import './Flyer.scss';
import { NavLink, useLocation } from 'react-router-dom';
import { pricings } from '../../data';
export default function Flyer() {
  const location = useLocation();
  return (
    <div className="flyer">
      <h1>Welcome to the Home for Football Predictions!</h1>
      <h2>Ready to make smarter predictions? Join us and access expert VIP tips.</h2>
      <NavLink to="/subscribe" className="btn" state={{ from: location, subscription: pricings[0] }}>Subscribe Now</NavLink>
    </div>

  )
}
