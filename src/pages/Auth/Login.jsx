import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Auth.scss'
import { signInUser } from '../../firebase';
import AppHelmet from '../AppHelmet';
import ScrollToTop from '../ScrollToTop';
import { notificationState } from '../../recoil/atoms';
import { useSetRecoilState } from 'recoil';
import { FiLogIn } from 'react-icons/fi';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setNotification = useSetRecoilState(notificationState);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      signInUser(email, password, setNotification);
    } else {
      setNotification({
        isVisible: true,
        type: 'warning',
        message: "Please enter your email and password",
      });
    }
  }

  return (
    <div className='auth-page'>
      <AppHelmet title={"Login"}/>
      <ScrollToTop />
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
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
          <div className="form-group">
            <label htmlFor="password">Password</label>
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
          <button type="submit" className="btn">
            <FiLogIn /> Sign In
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <NavLink to="/register">Get Started</NavLink>
        </p>
      </div>
    </div>
  )
}