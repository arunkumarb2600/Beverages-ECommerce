import React, { useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';
import { FaTrash, FaTimes, FaPlus, FaMinus, FaShoppingBag } from 'react-icons/fa';
import '../styles/CartDrawer.css';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [qtyPopItemId, setQtyPopItemId] = useState(null);
  const qtyTimerRef = useRef(null);

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
  };

  const triggerQtyPop = (itemId) => {
    setQtyPopItemId(null);
    if (qtyTimerRef.current) {
      clearTimeout(qtyTimerRef.current);
    }
    requestAnimationFrame(() => {
      setQtyPopItemId(itemId);
      qtyTimerRef.current = setTimeout(() => setQtyPopItemId(null), 350);
    });
  };

  const handleIncrement = (item) => {
    if (item.stock !== undefined && item.quantity >= item.stock) {
      return;
    }
    updateQuantity(item.cartItemId, item.quantity + 1);
    triggerQtyPop(item.cartItemId);
  };

  const handleDecrement = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.cartItemId, item.quantity - 1);
      triggerQtyPop(item.cartItemId);
    } else {
      setConfirmRemoveId(item.cartItemId);
    }
  };

  const handleRemoveClick = (itemId) => {
    setConfirmRemoveId(itemId);
  };

  const handleCancelRemove = () => {
    setConfirmRemoveId(null);
  };

  const handleConfirmRemove = async (itemId) => {
    setConfirmRemoveId(null);
    setRemovingItemId(itemId);
    // Play the fade-out before actually removing from the backend
    setTimeout(async () => {
      await removeFromCart(itemId);
      setRemovingItemId(null);
    }, 300);
  };

  const handleClearCart = () => {
    clearCart();
    setConfirmRemoveId(null);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`cartDrawerOverlay ${isOpen ? 'cartDrawerOverlayOpen' : ''}`} 
        onClick={onClose}
      />

      {/* Slide-out drawer body */}
      <div className={`cartDrawerBody ${isOpen ? 'cartDrawerBodyOpen' : ''}`}>
        <div className="cartDrawerHeader">
          <div className="cartHeaderTitle">
            <FaShoppingBag className="headerBagIcon" />
            <h3>Your Cart</h3>
          </div>
          <button className="cartCloseBtn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="cartDrawerItemsContainer">
          {!cart || cart.items.length === 0 ? (
            <div className="cartEmptyState">
              <div className="emptyCartIconCircle">
                <span className="emptyCartEmoji">🛒</span>
              </div>
              <h4>Your cart is empty.</h4>
              <p>Start shopping to add your favorite beverages.</p>
              <button className="continueShoppingBtn" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cartItemsList">
              {cart.items.map((item) => (
                <div
                  className={`cartDrawerItemCard ${removingItemId === item.cartItemId ? 'cartItemRemoving' : ''}`}
                  key={item.cartItemId}
                >
                  {confirmRemoveId === item.cartItemId ? (
                    <div className="cartItemRemoveConfirm">
                      <p className="removeConfirmText">Remove this item?</p>
                      <div className="removeConfirmActions">
                        <button className="removeConfirmYesBtn" onClick={() => handleConfirmRemove(item.cartItemId)}>
                          Yes, Remove
                        </button>
                        <button className="removeConfirmNoBtn" onClick={handleCancelRemove}>
                          Keep
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=120'} 
                        alt={item.productName} 
                        className="cartItemImg"
                      />
                      <div className="cartItemDetails">
                        <span className="cartItemBrand">{item.brand}</span>
                        <h5 className="cartItemName">{item.productName}</h5>
                        <span className="cartItemPrice">{formatPrice(item.price)}</span>
                        <span className="cartItemSubtotal">{formatPrice(item.price * item.quantity)}</span>
                        
                        <div className="cartItemQuantityControl">
                          <button 
                            type="button" 
                            onClick={() => handleDecrement(item)}
                            className="qtyBtn"
                            aria-label="Decrease quantity"
                          >
                            <FaMinus />
                          </button>
                          <span className={`qtyValue ${qtyPopItemId === item.cartItemId ? 'qtyValuePop' : ''}`}>
                            {item.quantity}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => handleIncrement(item)}
                            className="qtyBtn"
                            aria-label="Increase quantity"
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </div>
                      <button 
                        className="cartItemRemoveBtn" 
                        onClick={() => handleRemoveClick(item.cartItemId)}
                        title="Remove from Cart"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="cartDrawerFooter">
            <div className="cartDrawerSummaryRow">
              <span className="summaryLabel">Subtotal</span>
              <span className="summaryVal">{formatPrice(cartTotal)}</span>
            </div>
            <p className="shippingDisclaimer">Taxes and shipping calculated at checkout.</p>
            
            <div className="cartFooterActions">
              <button className="clearAllCartBtn" onClick={handleClearCart}>
                Clear Cart
              </button>
              <button className="checkoutTriggerBtn" onClick={handleCheckoutClick}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
