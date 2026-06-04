import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { authApi } from '../services/api';
import { clearCurrentCafeId, setAuthToken, setCurrentCafeId, setCurrentUser } from '../utils/session';
import './NewLoginPage.css';

const NewLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successMessage = location.state?.message;

  const getDashboardRoute = (role) => {
    if (!role) return '/';
    return `/dashboard/${String(role).trim().toLowerCase().replace(/[\s-]+/g, '_')}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const { data } = await authApi.login(
        formData.email.trim(),
        formData.password.trim()
      );

      if (data?.message === 'ADMIN_APPROVAL_PENDING') {
        setErrors({ submit: 'Your registration is still pending admin approval.' });
        return;
      }

      if (data?.message === 'RESET_PASSWORD_REQUIRED') {
        navigate('/reset-password', {
          state: {
            email: formData.email.trim(),
            message: 'Your account has been approved. Enter the OTP from your email and set your password to continue.'
          }
        });
        return;
      }

      if (data.cafeId) {
        setCurrentCafeId(data.cafeId);
      } else {
        clearCurrentCafeId();
      }
      setAuthToken(data.token);
      setCurrentUser({
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        cafeId: data.cafeId ?? null,
        cafeName: data.cafeName ?? null,
      });

      navigate(getDashboardRoute(data.role));
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed. Please check your email and password.';
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-login-page">
      <Header />

      <main className="login-main">
        <div className="login-container">
          <div className="login-left">
            <div className="login-features">
              <h2>Secure Login</h2>
              <p className="features-subtitle">
                Access your CafeConnect account with confidence
              </p>
              <p className="features-intro">
                Secure authentication, protected sessions, and reliable password recovery keep your CafeConnect account safe.
              </p>

              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-badge">01</span>
                  <div className="feature-content">
                    <h3>Protected Sign-In</h3>
                    <p>Only verified users can access customer and cafe management workspaces.</p>
                  </div>
                </div>

                <div className="feature-item">
                  <span className="feature-badge">02</span>
                  <div className="feature-content">
                    <h3>Safe Session Handling</h3>
                    <p>Your active login stays tied to authenticated account access across the platform.</p>
                  </div>
                </div>

                <div className="feature-item">
                  <span className="feature-badge">03</span>
                  <div className="feature-content">
                    <h3>Reliable Recovery</h3>
                    <p>Password reset support helps users regain access quickly and securely.</p>
                  </div>
                </div>
              </div>

              <div className="security-pill-row">
                <span className="security-pill">Secure Access</span>
                <span className="security-pill">Role Aware</span>
                <span className="security-pill">Quick Recovery</span>
              </div>
            </div>
          </div>

          <div className="login-right">
            <div className="login-form-container">
              <h1>Welcome Back</h1>
              <p className="login-subtitle">Login to your account</p>

              {successMessage && (
                <div className="success-banner">{successMessage}</div>
              )}

              {errors.submit && (
                <div className="error-banner">{errors.submit}</div>
              )}

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && (
                    <span className="error-message">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && (
                    <span className="error-message">{errors.password}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-login"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="login-footer">
                <p>
                  <Link to="/forgot-password">Forgot Password?</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewLoginPage;
