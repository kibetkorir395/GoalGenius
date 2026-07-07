import './Flyer.scss';
import { NavLink, useLocation } from 'react-router-dom';
import { pricings } from '../../data';
import { FiArrowRight } from 'react-icons/fi';

export default function Flyer() {
  const location = useLocation();
  return (
    <div className="flyer-section">
      <div className="flyer-content">
        <h2>Ready to level up your predictions?</h2>
        <p>Join thousands of football enthusiasts who trust our expert tips and analysis.</p>
        <NavLink
          to="/subscribe"
          className="btn"
          state={{ from: location, subscription: pricings[1] }}
        >
          Get VIP Access <FiArrowRight />
        </NavLink>
      </div>
    </div>
  );
}
