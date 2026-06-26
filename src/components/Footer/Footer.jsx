import './Footer.scss';
import { Link, NavLink } from 'react-router-dom';
import { socialUrls } from '../../data';
import { userState } from '../../recoil/atoms';
import { useRecoilValue } from 'recoil';
import { useEffect, useState } from 'react';
import Logo from '../../assets/logo.png';

const Footer = () => {
  const user = useRecoilValue(userState);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const admins = ['kkibetkkoir@gmail.com', 'charleykibet254@gmail.com', 'coongames8@gmail.com'];
    setIsAdmin(user && admins.includes(user.email));
  }, [user]);

  return (
    <footer className='footer'>
      <div className='footer-inner'>
        <div className='footer-brand'>
          <div className='footer-logo'>
            <img src={Logo} alt="Goal Genius" />
            <span>GoalGenius</span>
          </div>
          <p className='footer-tagline'>Expert football predictions and tips. Play like a pro.</p>
          <div className='footer-social'>
            {socialUrls.map(social => (
              <Link to={social.url} title={social.title} target='_blank' rel='noopener noreferrer' key={social.id}>
                {social.icon}
              </Link>
            ))}
          </div>
        </div>

        <div className='footer-links'>
          <div className='footer-column'>
            <h4>Navigation</h4>
            <NavLink to='/'>Home</NavLink>
            <NavLink to='/about'>About</NavLink>
            <NavLink to='/subscribe'>Subscribe</NavLink>
            {!user && <NavLink to='/login'>Sign In</NavLink>}
            {!user && <NavLink to='/register'>Get Started</NavLink>}
          </div>
          {isAdmin && (
            <div className='footer-column'>
              <h4>Admin</h4>
              <NavLink to='/add-tip'>Add Tip</NavLink>
              <NavLink to='/users'>All Users</NavLink>
            </div>
          )}
          <div className='footer-column'>
            <h4>Support</h4>
            <NavLink to='/about'>FAQ</NavLink>
            <NavLink to='/about'>Contact</NavLink>
            <NavLink to='/about'>Privacy</NavLink>
          </div>
        </div>
      </div>
      <div className='footer-bottom'>
        <p>&copy; {new Date().getFullYear()} GoalGenius. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
