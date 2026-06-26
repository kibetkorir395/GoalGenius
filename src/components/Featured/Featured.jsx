import './Featured.scss';
import { featured } from '../../data';
import { FiShield, FiLock, FiTrendingUp, FiZap } from 'react-icons/fi';

const icons = [FiShield, FiLock, FiTrendingUp, FiZap];

const Featured = () => {
    return (
    <section className="featured-section">
      <h2 className="section-title">Why Choose Us</h2>
      <p className="section-subtitle">Trusted by thousands of football enthusiasts across Africa</p>
        <div className="features-grid">
            {featured.map((feature, idx) => {
                const Icon = icons[idx] || FiShield;
                return (
                  <div className="feature-card" key={feature.title} style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="feature-icon-wrap">
                      <Icon className="feature-icon" />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{['Verified by experts', 'Secure encrypted payments', 'Data-driven analysis', 'Real-time updates'][idx]}</p>
                  </div>
                );
            })}
        </div>
    </section>
    );
}
export default Featured;