import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaGlassWhiskey, FaEnvelope, FaKey, FaLock, FaExclamationCircle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import '../styles/Auth.css';

const ResetPassword = () => {
  const { resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Prepopulate email from router state if available
  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  // Live Password Criteria checks
  const criteria = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordStrong = criteria.length && criteria.uppercase && criteria.lowercase && criteria.number && criteria.special;

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!otp.trim()) {
      newErrors.otp = 'OTP code is required';
    } else if (!/^[0-9]{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be a 6-digit number';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!isPasswordStrong) {
      newErrors.newPassword = 'Password does not meet all security strength criteria';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await resetPassword(email, otp, newPassword);
      if (response.success) {
        setSuccessMsg(response.message || 'Password reset successfully!');
        setResetDone(true);
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
          <h2 className="authTitle">Reset Password</h2>
          <p className="authSubtitle">Set a new secure password for your account</p>
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
            <span>{successMsg}</span>
          </div>
        )}

        {resetDone ? (
          <div className="authSuccessScreen">
            <FaCheckCircle className="authSuccessIcon" />
            <h3 className="authSuccessTitle">Password Reset Successful!</h3>
            <p className="authSuccessText">
              Your password has been updated. You can now log in with your new password.
            </p>
            <button
              type="button"
              className="authButton"
              onClick={() => navigate('/')}
            >
              Go to Login
            </button>
          </div>
        ) : (
        <>
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

          {/* OTP */}
          <div className="formGroup">
            <label className="formLabel" htmlFor="otp">Reset Code (OTP)</label>
            <div className="inputIconWrapper">
              <FaKey className="inputIcon" />
              <input
                id="otp"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className={`authInput ${errors.otp ? 'authInputError' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.otp && (
              <span className="errorAlert mt-1">
                <FaExclamationCircle className="errorAlertIcon" />
                {errors.otp}
              </span>
            )}
          </div>

          {/* New Password */}
          <div className="formGroup">
            <label className="formLabel" htmlFor="newPassword">New Password</label>
            <div className="inputIconWrapper">
              <FaLock className="inputIcon" />
              <input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`authInput ${errors.newPassword ? 'authInputError' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Real-time Password Strength Criteria Checklist */}
            {newPassword && (
              <div className="passwordStrengthList">
                <div className={`strengthItem ${criteria.length ? 'valid' : 'invalid'}`}>
                  {criteria.length ? <FaCheckCircle /> : <FaTimesCircle />} Min 8 characters
                </div>
                <div className={`strengthItem ${criteria.uppercase ? 'valid' : 'invalid'}`}>
                  {criteria.uppercase ? <FaCheckCircle /> : <FaTimesCircle />} Uppercase letter
                </div>
                <div className={`strengthItem ${criteria.lowercase ? 'valid' : 'invalid'}`}>
                  {criteria.lowercase ? <FaCheckCircle /> : <FaTimesCircle />} Lowercase letter
                </div>
                <div className={`strengthItem ${criteria.number ? 'valid' : 'invalid'}`}>
                  {criteria.number ? <FaCheckCircle /> : <FaTimesCircle />} Number (0-9)
                </div>
                <div className={`strengthItem ${criteria.special ? 'valid' : 'invalid'}`}>
                  {criteria.special ? <FaCheckCircle /> : <FaTimesCircle />} Special character
                </div>
              </div>
            )}
            
            {errors.newPassword && (
              <span className="errorAlert mt-1">
                <FaExclamationCircle className="errorAlertIcon" />
                {errors.newPassword}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="formGroup">
            <label className="formLabel" htmlFor="confirmPassword">Confirm Password</label>
            <div className="inputIconWrapper">
              <FaLock className="inputIcon" />
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`authInput ${errors.confirmPassword ? 'authInputError' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.confirmPassword && (
              <span className="errorAlert mt-1">
                <FaExclamationCircle className="errorAlertIcon" />
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="authButton" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Resetting password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="authFooter">
          Remembered your password?
          <Link to="/" className="authFooterLink">
            Login
          </Link>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
