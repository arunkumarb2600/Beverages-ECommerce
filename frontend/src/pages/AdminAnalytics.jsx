import React, { useState, useEffect } from 'react';
import api from '../services/api';
import formatPrice from '../utils/formatPrice';
import { useToast } from '../context/ToastContext';
import { FaRupeeSign, FaShoppingBag, FaCreditCard, FaUsers } from 'react-icons/fa';
import '../styles/Admin.css';

const STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
];

const AdminAnalytics = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, ordersRes, paymentsRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/orders'),
          api.get('/admin/payments')
        ]);
        setStats(statsRes.data);
        setOrders(ordersRes.data);
        setPayments(paymentsRes.data);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load analytics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="adminPage">
        <div className="adminLoading">
          <div className="spinner"></div> Loading Analytics...
        </div>
      </div>
    );
  }

  const orderCounts = STATUSES.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length
  }));
  const maxOrderCount = Math.max(1, ...orderCounts.map((o) => o.count));

  const paymentStatuses = {};
  payments.forEach((p) => {
    const key = p.paymentStatus || 'UNKNOWN';
    paymentStatuses[key] = (paymentStatuses[key] || 0) + 1;
  });

  const successPayments = payments.filter((p) => (p.paymentStatus || '').toLowerCase() === 'success');
  const successValue = successPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  const revenueCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: <FaRupeeSign /> },
    { label: 'Today', value: formatPrice(stats.todayRevenue), icon: <FaRupeeSign /> },
    { label: 'This Month', value: formatPrice(stats.monthlyRevenue), icon: <FaRupeeSign /> },
    { label: 'This Year', value: formatPrice(stats.yearlyRevenue), icon: <FaRupeeSign /> }
  ];

  const summaryCards = [
    { label: 'Orders Placed', value: stats.totalOrders, icon: <FaShoppingBag /> },
    { label: 'Successful Payments', value: payments.length, icon: <FaCreditCard /> },
    { label: 'Payment Value (Success)', value: formatPrice(successValue), icon: <FaRupeeSign /> },
    { label: 'Registered Users', value: stats.totalUsers, icon: <FaUsers /> }
  ];

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <h1 className="adminTitle">Analytics</h1>
        <p className="adminSubtitle">Key performance indicators for your store.</p>
      </header>

      <h3 className="formSectionTitle">Revenue</h3>
      <div className="statGrid">
        {revenueCards.map((card) => (
          <div className="statCard statCardGold" key={card.label}>
            <div className="statCardIcon">{card.icon}</div>
            <div className="statCardBody">
              <span className="statValue">{card.value}</span>
              <span className="statLabel">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <h3 className="formSectionTitle sectionSpaced">Summary</h3>
      <div className="statGrid">
        {summaryCards.map((card) => (
          <div className="statCard statCardGreen" key={card.label}>
            <div className="statCardIcon">{card.icon}</div>
            <div className="statCardBody">
              <span className="statValue">{card.value}</span>
              <span className="statLabel">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="analyticsColumns">
        <div className="adminTableSection">
          <h3 className="tableSectionTitle">Orders by Status</h3>
          <div className="barChart">
            {orderCounts.map((item) => (
              <div className="barRow" key={item.status}>
                <span className="barLabel">{item.status.replace(/_/g, ' ')}</span>
                <div className="barTrack">
                  <div
                    className={`barFill barFill${item.status}`}
                    style={{ width: `${(item.count / maxOrderCount) * 100}%` }}
                  ></div>
                </div>
                <span className="barValue">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="adminTableSection">
          <h3 className="tableSectionTitle">Payments by Status</h3>
          <div className="barChart">
            {Object.entries(paymentStatuses).map(([status, count]) => (
              <div className="barRow" key={status}>
                <span className="barLabel">{status}</span>
                <div className="barTrack">
                  <div className="barFill barFillPAYMENT" style={{ width: `${Math.min(100, count * 20)}%` }}></div>
                </div>
                <span className="barValue">{count}</span>
              </div>
            ))}
            {Object.keys(paymentStatuses).length === 0 && (
              <p className="adminEmptyText">No payment data available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="adminTableSection sectionSpaced">
        <h3 className="tableSectionTitle">Recent Orders</h3>
        <div className="tableWrapper">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.orderId}>
                  <td className="boldText">#{order.orderId}</td>
                  <td>{order.userName}</td>
                  <td className="boldText">{formatPrice(order.total)}</td>
                  <td>
                    <span className={`orderStatusBadge orderStatus${order.status}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan="5" className="adminEmptyRow">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
