import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaGlassWhiskey, FaEnvelope, FaLock, FaExclamationCircle } from 'react-icons/fa';
import '../styles/Auth.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address (e.g., name@example.com)';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const user = await login(email, password, rememberMe);
      // Role-based redirect: ADMIN goes to the admin dashboard, users to the store
      navigate(user.role === 'ADMIN' ? '/admin' : '/home');
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
          <h2 className="authTitle">Welcome Back</h2>
          <p className="authSubtitle">Log in to order your favorite beverages</p>
        </div>

        {apiError && (
          <div className="errorAlert mb-4">
            <FaExclamationCircle className="errorAlertIcon" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>{apiError}</span>
              {apiError.toLowerCase().includes('not verified') && (
                <button
                  type="button"
                  onClick={() => navigate('/verify-account', { state: { email } })}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#b91c1c',
                    textDecoration: 'underline',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  Click here to verify your account
                </button>
              )}
            </div>
          </div>
        )}

        <form className="authForm" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="formGroup">
            <label className="formLabel" htmlFor="email">
              Email Address
            </label>
            <div className="inputIconWrapper">
              <FaEnvelope className="inputIcon" />
              <input
                id="email"
                type="text"
                placeholder="admin@gmail.com"
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

          {/* Password Field */}
          <div className="formGroup">
            <label className="formLabel" htmlFor="password">
              Password
            </label>
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
            {errors.password && (
              <span className="errorAlert mt-1">
                <FaExclamationCircle className="errorAlertIcon" />
                {errors.password}
              </span>
            )}
          </div>

          {/* Helper Row (Remember me, Forgot Password) */}
          <div className="formHelperRow">
            <label className="rememberMeLabel" htmlFor="rememberMe">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
              />
              Remember Me
            </label>
            <Link to="/forgot-password" className="forgotPasswordLink">
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button type="submit" className="authButton" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="authFooter">
          Don't have an account?
          <Link to="/register" className="authFooterLink">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
