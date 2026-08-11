import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { ToastContext } from './ToastContext';
import api from '../services/api';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Drawer visibility (owned here so any page can open it, e.g. after "Add to Cart")
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Increment to trigger the navbar cart icon bounce/highlight
  const [cartBump, setCartBump] = useState(0);
  const previewTimerRef = useRef(null);

  // Open the drawer for a short preview (auto-closes after ~2.5s unless closed early).
  const openCartPreview = useCallback(() => {
    setIsCartOpen(true);
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    previewTimerRef.current = setTimeout(() => {
      setIsCartOpen(false);
    }, 2500);
  }, []);

  const openCart = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    setIsCartOpen(false);
  }, []);

  // Fetch cart from backend API
  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      setCartCount(0);
      setCartTotal(0);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/cart');
      const cartData = response.data;
      setCart(cartData);
      calculateTotals(cartData.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate cart items count and total price
  const calculateTotals = (items) => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    setCartCount(count);
    setCartTotal(total);
  };

  // Sync cart state on authentication changes
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  // Clear any pending auto-close timer on unmount
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    };
  }, []);

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) return false;
    try {
      const response = await api.post('/cart/items', { productId, quantity });
      setCart(response.data);
      calculateTotals(response.data.items || []);
      setCartBump((b) => b + 1);
      showToast('Added to Cart Successfully');
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast(error.response?.data?.message || 'Failed to add item to cart', 'error');
      return false;
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    if (!isAuthenticated) return;
    try {
      const response = await api.put(`/cart/items/${itemId}`, null, {
        params: { quantity }
      });
      setCart(response.data);
      calculateTotals(response.data.items || []);
      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      showToast(error.response?.data?.message || 'Failed to update quantity', 'error');
      return false;
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) return;
    try {
      const response = await api.delete(`/cart/items/${itemId}`);
      setCart(response.data);
      calculateTotals(response.data.items || []);
      showToast('Item removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      showToast(error.response?.data?.message || 'Failed to remove item', 'error');
      return false;
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!isAuthenticated) return;
    try {
      await api.delete('/cart');
      setCart(prev => prev ? { ...prev, items: [] } : null);
      setCartCount(0);
      setCartTotal(0);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      cartTotal,
      loading,
      isCartOpen,
      cartBump,
      openCart,
      closeCart,
      openCartPreview,
      fetchCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
