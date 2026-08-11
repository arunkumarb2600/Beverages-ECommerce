import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import formatPrice from '../utils/formatPrice';
import { FaBoxOpen, FaChevronDown, FaChevronUp, FaCalendarAlt, FaInfoCircle, FaTrashAlt } from 'react-icons/fa';
import '../styles/Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders/my');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleExpand = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This will restore stock levels.')) {
      return;
    }
    try {
      await api.delete(`/orders/${orderId}`);
      alert('Order cancelled successfully.');
      fetchOrders();
    } catch (error) {
      console.error('Cancel order failed:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusClass = (status) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'statusCompleted';
      case 'CANCELLED':
        return 'statusCancelled';
      default:
        return 'statusPending';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="ordersPage">
      <Navbar />

      <div className="ordersContentContainer">
        <h2 className="ordersPageTitle">My Order History</h2>

        {loading ? (
          <div className="ordersLoadingState">
            <div className="loadingSpinner" />
            <p>Fetching your order records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="ordersEmptyStateCard">
            <FaBoxOpen className="emptyBoxIcon" />
            <h3>No Orders Found</h3>
            <p>You haven't placed any orders on RefreshUp yet.</p>
            <button onClick={() => navigate('/home')} className="ordersStartShoppingBtn">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="ordersAccordionList">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.orderId;
              const formattedId = `#RU-${order.orderId}-${new Date(order.createdAt).getFullYear()}`;

              return (
                <div className="orderAccordionCard" key={order.orderId}>
                  {/* Accordion Trigger Header */}
                  <div className="orderCardHeader" onClick={() => toggleExpand(order.orderId)}>
                    <div className="headerLeftArea">
                      <span className="orderReferenceText">{formattedId}</span>
                      <div className="headerMetaRow">
                        <span className="headerMetaItem">
                          <FaCalendarAlt /> {formatDate(order.createdAt)}
                        </span>
                        <span className="headerMetaItem">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    <div className="headerRightArea">
                      <span className={`orderStatusPill ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                      <button className="expandToggleBtn" type="button">
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                  </div>

                  {/* Accordion Expandable Content */}
                  {isExpanded && (
                    <div className="orderCardBody">
                      <h5 className="itemsListTitle">Items Purchased</h5>
                      <div className="orderItemsDetailList">
                        {order.items.map((item) => (
                          <div className="orderItemDetailRow" key={item.orderItemId}>
                            <img 
                              src={item.imageUrl || 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=80'} 
                              alt={item.productName} 
                              className="orderDetailItemImg"
                            />
                            <div className="orderDetailItemMeta">
                              <h6>{item.productName}</h6>
                              <p className="itemBrand">{item.brand}</p>
                              <p className="itemPriceQuantity">
                                {formatPrice(item.price)} × {item.quantity}
                              </p>
                            </div>
                            <span className="orderDetailItemSubtotal">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="orderFooterSummaryBlock">
                        <div className="orderSummaryDetailsText">
                          <p><strong>Customer Name:</strong> {order.userName}</p>
                          <p><strong>Contact Email:</strong> {order.userEmail}</p>
                        </div>
                        <div className="orderActionRightArea">
                          {order.status === 'PENDING' && (
                            <button 
                              className="cancelPendingOrderBtn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelOrder(order.orderId);
                              }}
                            >
                              <FaTrashAlt /> Cancel Order
                            </button>
                          )}
                          <div className="finalTotalBadge">
                            <span>Total Charged:</span>
                            <strong>{formatPrice(order.total)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
