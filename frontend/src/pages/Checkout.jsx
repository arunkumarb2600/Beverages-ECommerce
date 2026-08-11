import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import formatPrice from '../utils/formatPrice';
import { FaLock, FaSpinner, FaArrowLeft, FaRegCreditCard, FaMoneyBillWave, FaRedoAlt, FaTimesCircle } from 'react-icons/fa';
import '../styles/Checkout.css';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    if (!orderSuccess && (!cart || cart.items.length === 0)) {
      navigate('/home');
    }
  }, [cart, navigate, orderSuccess]);

  // Form Fields State
  const [shippingForm, setShippingForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const shippingCost = cartTotal > 50 ? 0 : 5.00;
  const orderGrandTotal = cartTotal + shippingCost;

  const handleShippingChange = (e) => {
    setShippingForm({ ...shippingForm, [e.target.name]: e.target.value });
  };

  const validateShipping = () => {
    const { name, phone, address, city, state, zip } = shippingForm;
    if (!name || !phone || !address || !city || !state || !zip) {
      alert('Please fill out all shipping fields.');
      return false;
    }
    return true;
  };

  const loadRazorpayScript = () => new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load the payment gateway. Please try again.'));
    document.body.appendChild(script);
  });

  const openRazorpayCheckout = async (razorpayData, order) => {
    try {
      await loadRazorpayScript();
    } catch (error) {
      setPaymentFailed(true);
      setPaymentError(error.message);
      return;
    }

    const options = {
      key: razorpayData.keyId,
      amount: razorpayData.amountInPaise,
      currency: razorpayData.currency,
      name: 'RefreshUp',
      description: `Order #RU-${order.orderId}`,
      order_id: razorpayData.razorpayOrderId,
      prefill: {
        name: shippingForm.name || order.userName || '',
        email: order.userEmail || '',
        contact: shippingForm.phone || ''
      },
      theme: { color: '#10b981' },
      handler: async (response) => {
        try {
          await api.post('/payments/verify', {
            orderId: order.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });
          setOrderSuccess(true);
          // Navigate first so the confirmation page renders immediately;
          // clear the cart in the background (it no longer blocks the redirect).
          navigate('/order-success', { state: { orderId: order.orderId, shipping: shippingForm, paymentMethod } });
          clearCart();
        } catch (error) {
          setPaymentFailed(true);
          setPaymentError(error.response?.data?.message || 'Payment could not be verified. Please contact support.');
        }
      },
      modal: {
        ondismiss: () => {}
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', (response) => {
      setPaymentFailed(true);
      setPaymentError(response?.error?.description || 'Payment failed. Please try again.');
    });
    razorpay.open();
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!validateShipping()) return;

    setIsProcessing(true);
    setProcessStep(1);

    try {
      const payload = {
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        paymentMethod
      };

      const response = await api.post('/orders', payload);
      const order = response.data;
      setCreatedOrder(order);

      if (paymentMethod === 'COD') {
        // Order is already confirmed by the backend; just clear the cart and show success.
        await clearCart();
        setOrderSuccess(true);
        navigate('/order-success', { state: { orderId: order.orderId, shipping: shippingForm, paymentMethod } });
      } else {
        setProcessStep(2);
        const razorpayResponse = await api.post('/payments/create-order', { orderId: order.orderId });
        setIsProcessing(false);
        setProcessStep(0);
        await openRazorpayCheckout(razorpayResponse.data, order);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert(error.response?.data?.message || 'Failed to place order. Please check product stock levels.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!createdOrder) return;
    setPaymentFailed(false);
    setPaymentError('');
    setIsProcessing(true);
    setProcessStep(2);
    try {
      const razorpayResponse = await api.post('/payments/create-order', { orderId: createdOrder.orderId });
      setIsProcessing(false);
      setProcessStep(0);
      await openRazorpayCheckout(razorpayResponse.data, createdOrder);
    } catch (error) {
      console.error('Retry failed:', error);
      alert(error.response?.data?.message || 'Failed to initialize payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const processStepTexts = [
    '',
    'Creating your order...',
    'Connecting to the payment gateway...'
  ];

  return (
    <div className="checkoutPage">
      <Navbar />

      {/* Processing Loader Overlay */}
      {isProcessing && (
        <div className="processingPaymentOverlay">
          <div className="processingLoaderBox">
            <FaSpinner className="processingSpinnerIcon" />
            <h4>Processing Transaction</h4>
            <p>{processStepTexts[processStep]}</p>
          </div>
        </div>
      )}

      <div className="checkoutMainContent">
        <div className="checkoutBackLinkWrapper">
          <button onClick={() => navigate(-1)} className="checkoutBackBtn">
            <FaArrowLeft /> Back to Catalog
          </button>
        </div>

        <h2 className="checkoutTitle">Secure Checkout</h2>

        <div className="checkoutGrid">
          <form onSubmit={handleSubmitOrder} className="checkoutFormsArea">

            {/* Delivery address Card */}
            <div className="checkoutSectionCard">
              <h4 className="sectionCardTitle">1. Shipping Address</h4>
              <div className="formGroupRow">
                <div className="formInputWrapper widthFull">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={shippingForm.name}
                    onChange={handleShippingChange}
                    required
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="formGroupRow">
                <div className="formInputWrapper widthHalf">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingForm.phone}
                    onChange={handleShippingChange}
                    required
                    placeholder="(555) 019-2834"
                  />
                </div>
                <div className="formInputWrapper widthHalf">
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="address"
                    value={shippingForm.address}
                    onChange={handleShippingChange}
                    required
                    placeholder="123 Main St, Apt 4"
                  />
                </div>
              </div>

              <div className="formGroupRow">
                <div className="formInputWrapper widthThird">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingForm.city}
                    onChange={handleShippingChange}
                    required
                    placeholder="Seattle"
                  />
                </div>
                <div className="formInputWrapper widthThird">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={shippingForm.state}
                    onChange={handleShippingChange}
                    required
                    placeholder="WA"
                  />
                </div>
                <div className="formInputWrapper widthThird">
                  <label>ZIP / Postal Code</label>
                  <input
                    type="text"
                    name="zip"
                    value={shippingForm.zip}
                    onChange={handleShippingChange}
                    required
                    placeholder="98101"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="checkoutSectionCard">
              <div className="paymentSectionHeader">
                <h4 className="sectionCardTitle">2. Payment Method</h4>
                <div className="securedBadge">
                  <FaLock /> SSL Secure
                </div>
              </div>

              {paymentFailed ? (
                <div className="paymentFailedCard">
                  <FaTimesCircle className="paymentFailedIcon" />
                  <h4 className="paymentFailedTitle">Payment Failed</h4>
                  <p className="paymentFailedMsg">{paymentError}</p>
                  <p className="paymentFailedHint">
                    Your order is saved. You can retry the payment or continue shopping.
                  </p>
                  <div className="paymentFailedActions">
                    <button type="button" onClick={handleRetryPayment} className="retryPaymentBtn">
                      <FaRedoAlt /> Retry Payment
                    </button>
                    <button type="button" onClick={() => navigate('/home')} className="backHomeBtn">
                      Continue Shopping
                    </button>
                  </div>
                </div>
              ) : (
                <div className="paymentMethodOptions">
                  <label className={`paymentMethodCard ${paymentMethod === 'RAZORPAY' ? 'paymentMethodSelected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="RAZORPAY"
                      checked={paymentMethod === 'RAZORPAY'}
                      onChange={() => setPaymentMethod('RAZORPAY')}
                    />
                    <div className="paymentMethodIcon">
                      <FaRegCreditCard />
                    </div>
                    <div className="paymentMethodInfo">
                      <h5>Pay Online</h5>
                      <p>Cards, UPI, Net Banking & Wallets via Razorpay</p>
                    </div>
                    <span className="paymentMethodBadge">Recommended</span>
                  </label>

                  <label className={`paymentMethodCard ${paymentMethod === 'COD' ? 'paymentMethodSelected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                    />
                    <div className="paymentMethodIcon">
                      <FaMoneyBillWave />
                    </div>
                    <div className="paymentMethodInfo">
                      <h5>Cash On Delivery</h5>
                      <p>Pay in cash when your order arrives</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {!paymentFailed && (
              <button type="submit" className="placeOrderSubmitBtn">
                <FaLock />
                {paymentMethod === 'COD'
                  ? `Place Order - Cash On Delivery`
                  : `Pay With Razorpay`}
                <span className="submitAmount">({formatPrice(orderGrandTotal)})</span>
              </button>
            )}
          </form>

          {/* Checkout Order Summary */}
          <div className="checkoutSummarySide">
            <div className="summarySideCard">
              <h4 className="summarySideTitle">Order Summary</h4>

              <div className="summaryItemsList">
                {cart && cart.items.map((item) => (
                  <div className="summaryItemRow" key={item.cartItemId}>
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=80'}
                      alt={item.productName}
                      className="summaryItemImg"
                    />
                    <div className="summaryItemDetail">
                      <h5>{item.productName}</h5>
                      <p>Qty: {item.quantity}</p>
                    </div>
                    <span className="summaryItemTotal">{formatPrice(item.quantity * item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="summaryCalculationBlocks">
                <div className="calcRow">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="calcRow">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                </div>
                <div className="calcRow grandTotalRow">
                  <span>Total Amount</span>
                  <span>{formatPrice(orderGrandTotal)}</span>
                </div>
                <div className="calcRow paymentMethodSummary">
                  <span>Payment Method</span>
                  <span>{paymentMethod === 'COD' ? 'Cash On Delivery' : 'Pay Online (Razorpay)'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
