import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaGlassWhiskey, FaEnvelope, FaKey, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import '../styles/Auth.css';

const VerifyAccount = () => {
  const { verifyAccount, resendOtp } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);

  // Resend Timer states
  const [cooldown, setCooldown] = useState(0);

  // Prepopulate email from router state if available (e.g. from registration redirect)
  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

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
      const response = await verifyAccount(email, otp);
      if (response.success) {
        setSuccessMsg(response.message);
        setVerified(true);
      }
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email to resend OTP' });
      return;
    }

    setApiError('');
    setSuccessMsg('');
    try {
      const response = await resendOtp(email);
      setSuccessMsg(response.message);
      setCooldown(60); // 60 seconds cooldown
    } catch (error) {
      setApiError(error.message);
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
          <h2 className="authTitle">Verify Account</h2>
          <p className="authSubtitle">Enter the 6-digit OTP code sent to your email</p>
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

        {verified ? (
          <div className="authSuccessScreen">
            <FaCheckCircle className="authSuccessIcon" />
            <h3 className="authSuccessTitle">Account Verified!</h3>
            <p className="authSuccessText">
              Your account has been verified successfully. You can now log in and start ordering.
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
            <label className="formLabel" htmlFor="otp">Verification Code (OTP)</label>
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

          {/* Action Row */}
          <div className="formHelperRow">
            <span style={{ color: 'var(--text-muted)' }}>Didn't receive a code?</span>
            <button
              type="button"
              onClick={handleResend}
              className="forgotPasswordLink"
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', opacity: cooldown > 0 ? 0.6 : 1 }}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </button>
          </div>

          {/* Submit Button */}
          <button type="submit" className="authButton" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Verifying...
              </>
            ) : (
              'Verify Account'
            )}
          </button>
        </form>

        <div className="authFooter">
          Remembered your details?
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

export default VerifyAccount;
