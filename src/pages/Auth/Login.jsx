import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Auth.scss'
import { signInUser, sendPasswordReset } from '../../firebase';
import AppHelmet from '../AppHelmet';
import ScrollToTop from '../ScrollToTop';
import { notificationState } from '../../recoil/atoms';
import { useSetRecoilState } from 'recoil';
import { FiLogIn, FiMail, FiLock, FiKey, FiArrowLeft } from 'react-icons/fi';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [processing, setProcessing] = useState(false);
  const setNotification = useSetRecoilState(notificationState);
  const location = useLocation();

  const navigate = useNavigate(); // Add this
  const from = location.state?.from || '/';

  const handleLogin = (e) => {
    e.preventDefault();
    if(email && password) {
      signInUser(email, password, setNotification, navigate, from); // Pass navigate
    } else {
      setNotification({
        isVisible: true,
        type: 'warning',
        message: "You have entered an invalid email address!",
      });
    };
  }

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setNotification({
        isVisible: true,
        type: 'warning',
        message: "Please enter your email address",
      });
      return;
    }
    setProcessing(true);
    try {
      await sendPasswordReset(resetEmail);
      setNotification({
        isVisible: true,
        type: 'success',
        message: "Password reset email sent! Check your inbox.",
      });
      setShowReset(false);
      setResetEmail('');
    } catch (err) {
      setNotification({
        isVisible: true,
        type: 'error',
        message: err.message,
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className='auth-page'>
      <AppHelmet title={"Login"}/>
      <ScrollToTop />
      <div className="auth-card">
        {!showReset ? (
          <>
            <h1>Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account</p>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-group">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-group">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="form-extra">
                <button type="button" className="forgot-link" onClick={() => { setResetEmail(email); setShowReset(true); }}>
                  Forgot password?
                </button>
              </div>
              <button type="submit" className="btn">
                <FiLogIn /> Sign In
              </button>
            </form>
            <p className="auth-footer">
              Don't have an account? <NavLink to="/register">Get Started</NavLink>
            </p>
          </>
        ) : (
          <>
            <h1>Reset Password</h1>
            <p className="auth-subtitle">Enter your email to receive a reset link</p>
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label htmlFor="reset-email">Email</label>
                <div className="input-group">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    id="reset-email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn" disabled={processing}>
                <FiKey /> {processing ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" className="btn ghost back-link" onClick={() => setShowReset(false)}>
                <FiArrowLeft /> Back to Sign In
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
