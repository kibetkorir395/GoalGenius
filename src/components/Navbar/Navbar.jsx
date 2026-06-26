import { useState, useEffect, useCallback } from 'react';
import Logo from '../../assets/logo.png';
import './Navbar.scss';
import { IoClose, IoMenu } from "react-icons/io5";
import { NavLink, useLocation } from "react-router-dom";
import { useRecoilState } from 'recoil';
import { userState } from '../../recoil/atoms';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const ADMIN_EMAILS = ['kkibetkkoir@gmail.com', 'charleykibet254@gmail.com', 'coongames8@gmail.com'];

const Navbar = () => {
  const [opened, setOpened] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useRecoilState(userState);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  const handleLogout = useCallback(() => {
    signOut(auth);
    setUser(null);
  }, [setUser]);

  const handleToggle = useCallback(() => {
    setOpened(prev => !prev);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpened(false);
  }, [location]);

  useEffect(() => {
    setIsAdmin(user && ADMIN_EMAILS.includes(user.email));
  }, [user]);

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-logo">
          <img src={Logo} alt="Goal Genius" />
          <span className="logo-text">GoalGenius</span>
        </NavLink>

        <nav className={`navbar-nav ${opened ? 'active' : ''}`}>
          <div className="nav-links">
            <NavLink to="/" className="nav-link">Home</NavLink>
            <NavLink to="/about" className="nav-link">About</NavLink>
            <NavLink to="/subscribe" className="nav-link">Subscribe</NavLink>
            {isAdmin && (
              <>
                <NavLink to="/add-tip" className="nav-link">Add Tip</NavLink>
                <NavLink to="/users" className="nav-link">Users</NavLink>
              </>
            )}
          </div>
          <div className="nav-actions">
            {user ? (
              <>
                <span className="nav-user">{user.username || user.email?.split('@')[0]}</span>
                <button className="btn ghost" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink className="btn ghost" to="/login" state={{ from: location }}>
                  Sign In
                </NavLink>
                <NavLink className="btn" to="/register" state={{ from: location }}>
                  Get Started
                </NavLink>
              </>
            )}
          </div>
        </nav>

        <button className="menu-toggle" onClick={handleToggle} aria-label="Toggle menu">
          {opened ? <IoClose /> : <IoMenu />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
