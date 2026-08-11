import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  FaGlassWhiskey, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaLock, 
  FaExclamationCircle, 
  FaCheckCircle, 
  FaTimesCircle 
} from 'react-icons/fa';
import '../styles/Auth.css';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Flow States
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Password Criteria checks
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordStrong = criteria.length && criteria.uppercase && criteria.lowercase && criteria.number && criteria.special;

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{7,15}$/.test(phone.replace(/[\s-()]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordStrong) {
      newErrors.password = 'Password does not meet all security strength criteria';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
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
      const response = await register(fullName, email, phone, password);
      if (response.success) {
        setSuccessMsg(response.message);
        setTimeout(() => {
          navigate('/verify-account', { state: { email } });
        }, 1800);
      }
    } catch (error) {
      setApiError(error.message || 'Registration failed. Please try again.');
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
          <h2 className="authTitle">Create Account</h2>
          <p className="authSubtitle">Join RefreshUp for a premium beverage experience</p>
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
            <span>{successMsg} Redirecting to verification...</span>
          </div>
        )}

        <form className="authForm" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="formGroup">
            <label className="formLabel" htmlFor="fullName">Full Name</label>
            <div className="inputIconWrapper">
              <FaUser className="inputIcon" />
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`authInput ${errors.fullName ? 'authInputError' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.fullName && (
              <span className="errorAlert mt-1">
                <FaExclamationCircle className="errorAlertIcon" />
                {errors.fullName}
              </span>
            )}
          </div>

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

          {/* Phone Number */}
          <div className="formGroup">
            <label className="formLabel" htmlFor="phone">Phone Number</label>
            <div className="inputIconWrapper">
              <FaPhone className="inputIcon" />
              <input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`authInput ${errors.phone ? 'authInputError' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.phone && (
              <span className="errorAlert mt-1">
                <FaExclamationCircle className="errorAlertIcon" />
                {errors.phone}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="formGroup">
            <label className="formLabel" htmlFor="password">Password</label>
            <div className="inputIconWrapper">
              <FaLock className="inputIcon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`authInput ${errors.password ? 'authInputError' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Real-time Password Strength Criteria Checklist */}
            {password && (
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
                  {criteria.special ? <FaCheckCircle /> : <FaTimesCircle />} Special character (@, $, !)
                </div>
              </div>
            )}
            
            {errors.password && (
              <span className="errorAlert mt-1">
                <FaExclamationCircle className="errorAlertIcon" />
                {errors.password}
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
                Creating account...
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="authFooter">
          Already have an account?
          <Link to="/" className="authFooterLink">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
