import './Pricing.scss';
import { NavLink, useLocation } from 'react-router-dom';
import { pricings } from '../../data';
import { useState } from 'react';
import { FiCheck, FiChevronRight } from 'react-icons/fi';

export default function Pricing() {
  const [billing, setBilling] = useState('Week');
  const location = useLocation();

  const plans = pricings.filter(p => p.billing === billing);

  return (
    <div className='pricing-section' id='pricing'>
      <h2 className='section-title'>Pricing Plans</h2>
      <p className='section-subtitle'>Choose the plan that works for you. Upgrade anytime.</p>

      <div className='billing-tabs'>
        {['Day', 'Week', 'Month'].map((b) => (
          <button
            key={b}
            className={`billing-tab ${billing === b ? 'active' : ''}`}
            onClick={() => setBilling(b)}
          >
            {b === 'Day' ? 'Daily' : b === 'Week' ? 'Weekly' : 'Monthly'}
          </button>
        ))}
      </div>

      <div className='pricing-cards'>
        {plans.map((plan, idx) => (
          <div key={plan.id} className={`pricing-card ${idx === 1 ? 'popular' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
            {idx === 1 && <span className='popular-badge'>Best Value</span>}
            <div className='card-header'>
              <h3 className='plan-name'>{plan.plan}</h3>
              <p className='plan-title'>{plan.title}</p>
            </div>
            <div className='card-price'>
              <span className='price'>KSH {plan.price}</span>
              <span className='period'>/{plan.billing}</span>
            </div>
            <ul className='card-features'>
              {plan.features.map((feature, i) => (
                <li key={i}>
                  <FiCheck className='feature-icon' />
                  {feature}
                </li>
              ))}
            </ul>
            <NavLink
              className='btn subscribe-btn'
              state={{ from: location, subscription: plan }}
              to='/subscribe'
            >
              Subscribe Now <FiChevronRight />
            </NavLink>
          </div>
        ))}
      </div>
    </div>
  );
}
