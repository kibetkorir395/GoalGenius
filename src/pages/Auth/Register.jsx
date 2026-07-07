import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Auth.scss'
import { getUser, registerUser } from '../../firebase';
import AppHelmet from '../AppHelmet';
import ScrollToTop from '../ScrollToTop';
import { notificationState, userState } from '../../recoil/atoms';
import { useSetRecoilState , useRecoilState } from 'recoil';
import { FiUserPlus, FiMail, FiLock, FiUser } from 'react-icons/fi';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const setNotification = useSetRecoilState(notificationState);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (email && password) {
      const refreshUser = async (email) => {
        await getUser(email, setUser);
        navigate('/subscribe')
      };
      registerUser(username, email, password, setNotification, navigate, refreshUser); // Pass navigate
    } else {
      setNotification({
        isVisible: true,
        type: 'warning',
        message: "You have entered an invalid email address!",
      });
    };
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
            <label htmlFor="username">Username</label>
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                id="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <p className="hint-text">4-15 characters, letters, numbers, dots, underscores, hyphens</p>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-group">
              <FiLock className="input-icon" />
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
          </div>
          <button type="submit" className="btn" disabled={processing}>
            <FiUserPlus /> {processing ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">
          Already registered? <NavLink to="/login">Sign In</NavLink>
        </p>
      </div>
    </div>
  )
}
