import React, { useState, useEffect } from 'react';
import api from '../services/api';
import formatPrice from '../utils/formatPrice';
import { useToast } from '../context/ToastContext';
import { FaChevronDown, FaChevronUp, FaShoppingBag } from 'react-icons/fa';
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

const AdminOrders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (newStatus === '') return;
    setUpdatingId(orderId);
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      showToast(`Order #${orderId} status updated to ${newStatus}`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  const statusClass = (status) => `orderStatusBadge orderStatus${status}`;

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <h1 className="adminTitle">Orders</h1>
        <p className="adminSubtitle">Track and update order statuses in real time.</p>
      </header>

      <div className="adminTableSection">
        <div className="adminTableToolbar">
          <h3 className="tableSectionTitle">Orders ({filteredOrders.length})</h3>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="adminSelect">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="adminLoading">
            <div className="spinner"></div> Loading...
          </div>
        ) : (
          <div className="tableWrapper">
            <table className="adminTable">
              <thead>
                <tr>
                  <th></th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <React.Fragment key={order.orderId}>
                    <tr>
                      <td>
                        <button
                          className="expandBtn"
                          onClick={() => setExpanded(expanded === order.orderId ? null : order.orderId)}
                          title="Toggle details"
                        >
                          {expanded === order.orderId ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </td>
                      <td className="boldText">#{order.orderId}</td>
                      <td>
                        <div className="orderCustomer">
                          <span className="boldText">{order.userName}</span>
                          <small>{order.userEmail}</small>
                        </div>
                      </td>
                      <td>{order.items?.length || 0}</td>
                      <td className="boldText">{formatPrice(order.total)}</td>
                      <td>
                        <span className={statusClass(order.status)}>{order.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td>
                        <div className="orderCustomer">
                          <span>{order.paymentMethod || '—'}</span>
                          <small className={order.paymentStatus === 'SUCCESS' ? 'textSuccess' : 'textMuted'}>
                            {order.paymentStatus || '—'}
                          </small>
                        </div>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                    {expanded === order.orderId && (
                      <tr className="orderDetailsRow">
                        <td></td>
                        <td colSpan="7">
                          <div className="orderDetailsInner">
                            <div className="orderStatusControl">
                              <label>Update Status:</label>
                              <select
                                value={order.status}
                                disabled={updatingId === order.orderId}
                                onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                                className="adminSelect"
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                              </select>
                            </div>
                            <div className="orderItemsList">
                              {order.items?.map((item) => (
                                <div className="orderItemRow" key={item.orderItemId || item.productId}>
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} className="tableThumb" alt={item.productName} />
                                  ) : (
                                    <div className="tableThumbFallback"><FaShoppingBag /></div>
                                  )}
                                  <div className="orderItemInfo">
                                    <span className="boldText">{item.productName}</span>
                                    <small>{item.brand || ''}</small>
                                  </div>
                                  <span>{formatPrice(item.price)} × {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="8" className="adminEmptyRow">No orders found.</td>
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

export default AdminOrders;
