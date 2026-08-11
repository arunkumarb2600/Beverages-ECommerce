import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import formatPrice from '../utils/formatPrice';
import {
  FaCoffee,
  FaFolder,
  FaUsers,
  FaShoppingBag,
  FaRupeeSign,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight
} from 'react-icons/fa';
import '../styles/Admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="adminPage">
        <div className="adminLoading">
          <div className="spinner"></div> Loading Dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="adminPage">
        <div className="adminFormMsg errorMsg">{error}</div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Products', value: stats.totalProducts, icon: <FaCoffee />, to: '/admin/products', tone: 'green' },
    { label: 'Categories', value: stats.totalCategories, icon: <FaFolder />, to: '/admin/categories', tone: 'blue' },
    { label: 'Total Users', value: stats.totalUsers, icon: <FaUsers />, to: '/admin/users', tone: 'purple' },
    { label: 'Total Orders', value: stats.totalOrders, icon: <FaShoppingBag />, to: '/admin/orders', tone: 'orange' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: <FaRupeeSign />, to: '/admin/analytics', tone: 'gold' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: <FaHourglassHalf />, to: '/admin/orders', tone: 'amber' },
    { label: 'Completed', value: stats.completedOrders, icon: <FaCheckCircle />, to: '/admin/orders', tone: 'green' },
    { label: 'Cancelled', value: stats.cancelledOrders, icon: <FaTimesCircle />, to: '/admin/orders', tone: 'red' }
  ];

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <h1 className="adminTitle">Dashboard</h1>
        <p className="adminSubtitle">Overview of your beverage store performance.</p>
      </header>

      <div className="statGrid">
        {cards.map((card) => (
          <Link to={card.to} key={card.label} className={`statCard statCard${card.tone}`}>
            <div className="statCardIcon">{card.icon}</div>
            <div className="statCardBody">
              <span className="statValue">{card.value}</span>
              <span className="statLabel">{card.label}</span>
            </div>
            <span className="statCardArrow"><FaArrowRight /></span>
          </Link>
        ))}
      </div>

      <div className="adminSection">
        <h3 className="formSectionTitle">Revenue Snapshot</h3>
        <div className="revenueRow">
          <div className="revenueItem">
            <span className="revenueLabel">Today</span>
            <span className="revenueValue">{formatPrice(stats.todayRevenue)}</span>
          </div>
          <div className="revenueItem">
            <span className="revenueLabel">This Month</span>
            <span className="revenueValue">{formatPrice(stats.monthlyRevenue)}</span>
          </div>
          <div className="revenueItem">
            <span className="revenueLabel">This Year</span>
            <span className="revenueValue">{formatPrice(stats.yearlyRevenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
