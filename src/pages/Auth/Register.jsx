import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Auth.scss'
import { registerUser } from '../../firebase';
import AppHelmet from '../AppHelmet';
import ScrollToTop from '../ScrollToTop';
import { useSetRecoilState } from 'recoil';
import { notificationState } from '../../recoil/atoms';
import { FiUserPlus } from 'react-icons/fi';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setNotification = useSetRecoilState(notificationState);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (email && password) {
      registerUser(username, email, password, setNotification);
    } else {
      setNotification({
        isVisible: true,
        type: 'warning',
        message: "Please enter a valid email and password",
      });
    }
  }

  return (
    <div className='auth-page'>
      <AppHelmet title={"Register"} />
      <ScrollToTop />
      <div className="auth-card">
        <h1>Get Started</h1>
        <p className="auth-subtitle">Create your account to unlock VIP tips</p>
        <form onSubmit={handleRegister}>
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
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
            />
            <p className="hint-text">4-15 characters, letters, numbers, dots, underscores, hyphens</p>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <button type="submit" className="btn">
            <FiUserPlus /> Create Account
          </button>
        </form>
        <p className="auth-footer">
          Already registered? <NavLink to="/login">Sign In</NavLink>
        </p>
      </div>
    </div>
  )
}