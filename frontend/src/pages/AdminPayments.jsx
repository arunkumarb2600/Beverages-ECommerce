import React, { useState, useEffect } from 'react';
import api from '../services/api';
import formatPrice from '../utils/formatPrice';
import { useToast } from '../context/ToastContext';
import { FaCreditCard } from 'react-icons/fa';
import '../styles/Admin.css';

const AdminPayments = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/payments');
        setPayments(res.data);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load payments', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleString('en-IN') : '—';

  const statusClass = (status) => {
    const key = String(status || '').toLowerCase();
    if (key === 'success' || key === 'captured' || key === 'paid') return 'badgeOk';
    if (key === 'pending' || key === 'authorized') return 'badgeWarn';
    return 'badgeDanger';
  };

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <h1 className="adminTitle">Payments</h1>
        <p className="adminSubtitle">Read-only view of all transactions.</p>
      </header>

      <div className="adminTableSection">
        <h3 className="tableSectionTitle">Transactions ({payments.length})</h3>

        {loading ? (
          <div className="adminLoading">
            <div className="spinner"></div> Loading...
          </div>
        ) : (
          <div className="tableWrapper">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Order</th>
                  <th>User ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Razorpay Order ID</th>
                  <th>Razorpay Payment ID</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.paymentId}>
                    <td className="boldText">#{p.paymentId}</td>
                    <td>#{p.orderId}</td>
                    <td>{p.userId}</td>
                    <td className="boldText">{formatPrice(p.amount)}</td>
                    <td>
                      <span className="paymentMethodTag">
                        <FaCreditCard /> {p.paymentMethod || '—'}
                      </span>
                    </td>
                    <td><span className={`badge ${statusClass(p.paymentStatus)}`}>{p.paymentStatus || '—'}</span></td>
                    <td className="monoText">{p.razorpayOrderId || '—'}</td>
                    <td className="monoText">{p.razorpayPaymentId || '—'}</td>
                    <td>{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan="9" className="adminEmptyRow">No payments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
