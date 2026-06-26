import { NavLink } from 'react-router-dom';
import './About.scss';
import Faq from '../../components/Faq/Faq';
import Newsletter from '../../components/Newsletter/Newsletter';
import Testimonials from '../../components/Testimonials/Testimonials';
import ScrollToTop from '../ScrollToTop';
import AppHelmet from '../AppHelmet';
import { FiArrowRight } from 'react-icons/fi';

const About = () => {
    return (
        <div className="about-page">
            <ScrollToTop />
            <AppHelmet title={"About"} />
            <div className="about-hero">
                <h1 className="section-title">About GoalGenius</h1>
                <p className="section-subtitle">Your trusted partner for football predictions and expert analysis</p>
            </div>
            <div className="about-content">
                <div className="about-card">
                    <h3>For Football Fans</h3>
                    <p>Your ultimate destination for accurate match forecasts, insightful analysis, and real-time updates. From the Premier League to international tournaments, we provide forecasts backed by data and expert insights.</p>
                </div>
                <div className="about-card">
                    <h3>For Bettors & Analysts</h3>
                    <p>Gain access to detailed match predictions, player stats, and historical data to make informed decisions. Our platform empowers you with the tools you need to succeed.</p>
                </div>
                <div className="about-card">
                    <h3>Our Mission</h3>
                    <p>We aim to revolutionize football predictions by combining cutting-edge technology, expert knowledge, and community-driven engagement. Join us and be part of a thriving football community.</p>
                </div>
            </div>
            <div className="about-cta">
                <NavLink to="/subscribe" className="btn">
                    Get Started <FiArrowRight />
                </NavLink>
            </div>
            <Faq />
            <Testimonials />
            <Newsletter />
        </div>
    );
}

export default About;
