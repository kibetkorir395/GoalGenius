import { useState } from 'react';
import './Newsletter.scss';
import { addMailList } from '../../firebase';
import { useSetRecoilState } from 'recoil';
import { notificationState } from '../../recoil/atoms';
import { FiMail, FiArrowRight } from 'react-icons/fi';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const setNotification = useSetRecoilState(notificationState);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setNotification({ isVisible: true, type: 'warning', message: 'Please enter a valid email address' });
            return;
        }
        setLoading(true);
        addMailList({ email }, setNotification, (val) => {
            setEmail(val);
            setLoading(false);
        });
    };

    return (
        <div className='newsletter-section' id='subscribe'>
            <div className='newsletter-card'>
                <div className='newsletter-icon'>
                    <FiMail />
                </div>
                <h2 className='section-title'>Stay in the Loop</h2>
                <p className='section-subtitle'>Get the latest tips and insights delivered to your inbox.</p>
                <form onSubmit={handleSubmit} className='newsletter-form'>
                    <div className='input-wrap'>
                        <FiMail className='input-icon' />
                        <input
                            type='email'
                            placeholder='your@email.com'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='newsletter-input'
                        />
                    </div>
                    <button type='submit' className='btn' disabled={loading}>
                        {loading ? 'Subscribing...' : <><FiArrowRight /> Subscribe</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Newsletter;
