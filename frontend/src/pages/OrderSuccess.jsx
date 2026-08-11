import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import formatPrice from '../utils/formatPrice';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import '../styles/Checkout.css';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const state = location.state || {};
  const orderId = state.orderId;
  const shipping = state.shipping || null;
  const paymentMethod = state.paymentMethod || null;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const loadOrder = async () => {
      if (!orderId) {
        setError('No order reference found. Please check your orders.');
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data);
      } catch (err) {
        console.error('Failed to load order:', err);
        setError('Unable to load your order details. Please check your orders.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="checkoutSuccessPage">
        <Navbar />
        <div className="successContentContainer" style={{ textAlign: 'center', paddingTop: '60px' }}>
          <FaSpinner className="processingSpinnerIcon" style={{ fontSize: '3rem' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="checkoutSuccessPage">
      <Navbar />
      <div className="successContentContainer">
        <div className="successCard">
          <FaCheckCircle className="successBigCheck" />
          <h2>Thank You For Your Purchase!</h2>
          <p className="successSubtext">Your order has been received and is currently being prepared.</p>

          <div className="successDetailsBox">
            {order && (
              <>
                <div className="detailRow">
                  <span className="detailLabel">Order Reference:</span>
                  <span className="detailValue fontMono">#RU-{order.orderId}-{new Date(order.createdAt).getFullYear()}</span>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Order Status:</span>
                  <span className="detailValue">{order.status}</span>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Payment Method:</span>
                  <span className="detailValue">{paymentMethod === 'COD' ? 'Cash On Delivery' : 'Paid Online (Razorpay)'}</span>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Estimated Delivery:</span>
                  <span className="detailValue">2-3 Business Days</span>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Total Charge:</span>
                  <span className="detailValue fontBold">{formatPrice(order.total)}</span>
                </div>
                <div className="detailRow borderTop pt-3 mt-3">
                  <span className="detailLabel">Ordered Items:</span>
                  <span className="detailValue addressVal">
                    {order.items.map(item => (
                      <span key={item.orderItemId}>
                        {item.quantity} x {item.productName}
                        <br />
                      </span>
                    ))}
                  </span>
                </div>
              </>
            )}

            {shipping && (
              <div className="detailRow borderTop pt-3 mt-3">
                <span className="detailLabel">Delivery Address:</span>
                <span className="detailValue addressVal">
                  {shipping.name}<br />
                  {shipping.address}<br />
                  {shipping.city}, {shipping.state} {shipping.zip}<br />
                  Phone: {shipping.phone}
                </span>
              </div>
            )}
          </div>

          {error && <p className="paymentFailedMsg">{error}</p>}

          <div className="successActions">
            <button onClick={() => navigate('/orders')} className="viewOrdersBtn">
              View My Orders
            </button>
            <button onClick={() => navigate('/home')} className="backHomeBtn">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
