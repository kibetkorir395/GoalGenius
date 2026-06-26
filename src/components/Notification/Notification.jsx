import { useRecoilState } from 'recoil';
import { notificationState } from '../../recoil/atoms';
import { BsCheckCircle, BsExclamationCircle, BsXCircle } from 'react-icons/bs';
import { CgClose } from 'react-icons/cg';
import { BiError } from 'react-icons/bi';
import './Notification.scss';
import { useEffect } from 'react';

export default function Notification() {
  const [notification, setNotification] = useRecoilState(notificationState);

  useEffect(() => {
    if (notification.isVisible) {
      const timer = setTimeout(() => {
        setNotification({ isVisible: false, type: null, message: null });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notification.isVisible, setNotification]);

  const handleClose = () => {
    setNotification({ isVisible: false, type: null, message: null });
  };

  const icons = {
    error: <BiError className="icon" />,
    warning: <BsExclamationCircle className="icon" />,
    success: <BsCheckCircle className="icon" />,
  };

  if (!notification.isVisible) return null;

  return (
    <div className={`notification ${notification.type}`}>
      <div className="notification-content">
        {icons[notification.type] || <BsXCircle className="icon" />}
        <span className="message">{notification.message}</span>
      </div>
      <button className="close-btn" onClick={handleClose} aria-label="Close">
        <CgClose />
      </button>
    </div>
  );
}
