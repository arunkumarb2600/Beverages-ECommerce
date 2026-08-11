import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaGlassWhiskey, FaEnvelope, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const { forgotPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMsg('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await forgotPassword(email);
      if (response.success) {
        setSuccessMsg(response.message || 'Reset code sent to your email.');
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 1800);
      }
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authHeader">
          <div className="authLogo">
            <FaGlassWhiskey className="authLogoIcon" />
            <span>Refresh<span className="logoTextGreen">Up</span></span>
          </div>
          <h2 className="authTitle">Forgot Password</h2>
          <p className="authSubtitle">Enter your email and we'll send you an OTP to reset your password</p>
        </div>

        {apiError && (
          <div className="errorAlert mb-4">
            <FaExclamationCircle className="errorAlertIcon" />
            <span>{apiError}</span>
          </div>
        )}

        {successMsg && (
          <div className="errorAlert mb-4" style={{ backgroundColor: '#ecfdf5', borderColor: '#d1fae5', borderLeftColor: '#10b981', color: '#065f46' }}>
            <FaCheckCircle className="errorAlertIcon" style={{ color: '#10b981' }} />
            <span>{successMsg} Redirecting...</span>
          </div>
        )}

        <form className="authForm" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="formGroup">
            <label className="formLabel" htmlFor="email">Email Address</label>
            <div className="inputIconWrapper">
              <FaEnvelope className="inputIcon" />
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`authInput ${errors.email ? 'authInputError' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <span className="errorAlert mt-1">
                <FaExclamationCircle className="errorAlertIcon" />
                {errors.email}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="authButton" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Sending code...
              </>
            ) : (
              'Send OTP Code'
            )}
          </button>
        </form>

        <div className="authFooter">
          Remembered your password?
          <Link to="/" className="authFooterLink">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
