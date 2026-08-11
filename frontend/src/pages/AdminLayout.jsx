import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FaTachometerAlt,
  FaCoffee,
  FaFolder,
  FaShoppingBag,
  FaUsers,
  FaCreditCard,
  FaChartLine,
  FaStore,
  FaSignOutAlt,
  FaBars
} from 'react-icons/fa';
import '../styles/Admin.css';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'success');
    navigate('/');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { to: '/admin/products', label: 'Products', icon: <FaCoffee /> },
    { to: '/admin/categories', label: 'Categories', icon: <FaFolder /> },
    { to: '/admin/orders', label: 'Orders', icon: <FaShoppingBag /> },
    { to: '/admin/users', label: 'Users', icon: <FaUsers /> },
    { to: '/admin/payments', label: 'Payments', icon: <FaCreditCard /> },
    { to: '/admin/analytics', label: 'Analytics', icon: <FaChartLine /> }
  ];

  return (
    <div className="adminLayout">
      <button
        className="adminSidebarToggle"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        <FaBars />
      </button>

      <aside className={`adminSidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebarBrand">
          <span className="sidebarLogo">R</span>
          <div className="sidebarBrandText">
            <strong>RefreshUp</strong>
            <small>Admin Panel</small>
          </div>
        </div>

        <nav className="sidebarNav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebarNavLink ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebarNavIcon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebarFooter">
          <NavLink to="/home" className="sidebarNavLink">
            <span className="sidebarNavIcon"><FaStore /></span>
            Back to Store
          </NavLink>
          <div className="sidebarUser">
            <span className="sidebarAvatar">{user?.name?.charAt(0) || 'A'}</span>
            <span className="sidebarUserName">{user?.name || 'Admin'}</span>
          </div>
          <button className="sidebarLogoutBtn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      <main className="adminPanelMain">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
