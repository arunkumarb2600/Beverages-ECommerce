import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Clear corrupt storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login
  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      const { token, role, name } = response.data;
      const userObj = { name, role };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));

      setToken(token);
      setUser(userObj);
      return userObj;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  // Registration
  const register = async (name, email, phone, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, phone, password });
      return {
        success: true,
        message: response.data.message || 'Registration successful!'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  // Verify Account OTP
  const verifyAccount = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify', { email, otp });
      return {
        success: true,
        message: response.data.message || 'Account verified successfully!'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Verification failed');
    }
  };

  // Request Password Reset OTP
  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forget-password', { email });
      return {
        success: true,
        message: response.data.message || 'Reset code sent!'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Request failed');
    }
  };

  // Verify Password Reset OTP
  const verifyOtp = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return {
        success: true,
        message: response.data.message || 'OTP verified successfully!'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
  };

  // Reset Password using OTP
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      return {
        success: true,
        message: response.data.message || 'Password reset successfully!'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  };

  // Resend OTP
  const resendOtp = async (email) => {
    try {
      const response = await api.post(`/auth/resend-otp?email=${encodeURIComponent(email)}`);
      return {
        success: true,
        message: response.data.message || 'OTP resent successfully!'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore errors during logout and clear local state anyway
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    verifyAccount,
    forgotPassword,
    verifyOtp,
    resetPassword,
    resendOtp,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
