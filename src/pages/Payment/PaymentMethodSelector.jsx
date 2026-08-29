import { FiCreditCard, FiGlobe, FiSmartphone} from 'react-icons/fi';
import { SiBitcoinsv } from "react-icons/si";

// Add Flutterwave icon
const FlutterwaveIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" className='method-icon'>
    <path 
      fill="currentColor" 
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
    />
  </svg>
);


const PaymentMethodSelector = ({ selected, onChange, currency }) => {
  // Define all available payment methods
  const allPaymentMethods = [
    { id: 'mpesa', label: 'Mobile Money', icon: FiSmartphone, desc: 'Pay via M-Pesa, Airtel' },
    { id: 'kora', label: 'Kora', icon: FiCreditCard, desc: 'Mobile Money, Card, Bank' },
    { id: 'flutterwave', label: 'Flutterwave', icon: FlutterwaveIcon, desc: 'Card, Mobile Money, Bank, USSD' },
    { id: 'crypto', label: 'Crypto', icon: SiBitcoinsv, desc: 'BTC, ETH, USDT' },
    //{ id: 'paypal', label: 'PayPal', icon: FiGlobe, desc: 'Pay with PayPal' },
    //{ id: 'card', label: 'Card', icon: FiCreditCard, desc: 'Visa / Mastercard' },
  ];

  // Filter payment methods based on currency
  const getFilteredPaymentMethods = () => {
    let methods = [...allPaymentMethods];

    // If currency is KES (Kenya)
    if (currency === 'KES') {
      // Hide Flutterwave
      methods = methods.filter(m => m.id !== 'flutterwave');
    } 
    // If currency is NGN (Nigeria)
    else if (currency === 'NGN') {
      // Hide M-Pesa and Kora
      methods = methods.filter(m => m.id !== 'mpesa' && m.id !== 'flutterwave');
    }
    // For other currencies (USD, EUR, etc.)
    else {
      // Hide M-Pesa, Kora, and Flutterwave
      methods = methods.filter(m => 
        m.id !== 'mpesa' && 
        m.id !== 'kora' //&& 
        //m.id !== 'flutterwave'
      );
    }

    return methods;
  };

  const PAYMENT_METHODS = getFilteredPaymentMethods();

  return (
    <div className='method-selector'>
      <p className='selector-label'>Choose Payment Method</p>
      <div className='method-grid'>
        {PAYMENT_METHODS.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              className={`method-card ${selected === m.id ? 'active' : ''}`}
              onClick={() => onChange(m.id)}
            >
              <Icon className='method-icon' />
              {/*typeof Icon === 'function' && !Icon.prototype?.render ? (
                <Icon className='method-icon' />
              ) : (
                <Icon className='method-icon' />
              )*/}
              <span className='method-name'>{m.label}</span>
              <span className='method-desc'>{m.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;