import { useState } from 'react';
import { FiCreditCard } from 'react-icons/fi';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import Swal from 'sweetalert2';
import { useCurrency } from '../../context/CurrencyContext';

const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK-38aac8e4c9002a02b46496e8ef4b32ab-X";

function generateReference() {
  return `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const FlutterwavePayment = ({ 
  user, 
  plan, 
  subscription, 
  onSuccess,
  processing,
  setProcessing,
  onError 
}) => {
  const [error, setError] = useState(null);
  const { symbol, currency, convertPrice } = useCurrency();

  // Flutterwave Payment Configuration
  const getFlutterwaveConfig = () => {
    // Determine currency - use NGN for Nigeria, KES for Kenya, etc.
    const amount = Math.round(Number(convertPrice(plan?.price) || 0));

    return {
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: generateReference(),
      amount: amount,
      currency: subscription?.currency || currency || 'KES',
      payment_options: 'card,mobilemoney,ussd,banktransfer',
      redirect_url: window.location.href.split('?')[0],
      customer: {
        email: user?.email || '',
        phone_number: user?.phone || '',
        name: user?.username || (user?.email ? user.email.split('@')[0] : 'Customer'),
      },
      customizations: {
        title: `${plan?.plan || 'VIP'} Subscription`,
        description: `Upgrade to ${plan?.plan || 'VIP'} Plan - ${plan?.billing || 'Monthly'}`,
        logo: 'https://your-logo-url.com/logo.png', // Replace with your logo
      },
      meta: {
        plan: plan?.plan || 'VIP',
        user_id: user?.email || '',
        billing: plan?.billing || 'monthly',
      },
    };
  };

  const handleFlutterwavePayment = useFlutterwave(getFlutterwaveConfig());

  const handleFlutterwavePay = () => {
    if (!user?.email) {
      Swal.fire({
        title: 'Login Required',
        text: 'Please login first',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    setProcessing(true);
    setError(null);

    handleFlutterwavePayment({
      callback: async (response) => {
        
        if (response.status === 'successful') {
          closePaymentModal();
          Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            text: 'Your subscription is being activated...',
            timer: 1500,
            showConfirmButton: false,
          });
          await onSuccess();
        } else {
          setProcessing(false);
          const errorMsg = response.message || 'Transaction was not successful';
          setError(errorMsg);
          if (onError) onError(errorMsg);
          
          Swal.fire({
            title: 'Payment Failed',
            text: errorMsg,
            icon: 'error',
            confirmButtonText: 'OK',
          });
        }
      },
      onClose: () => {
        setProcessing(false);
      },
    });
  };

  return (
    <div className='flutterwave-form'>
      {error && (
        <div className='error-message'>
          <span className='error-icon'>⚠️</span>
          {error}
        </div>
      )}
      
      <p className='input-hint'>
        Pay securely with Card, M-Pesa, Bank Transfer, or USSD via Flutterwave.
      </p>
      
      <div className='payment-details'>
        <div className='detail-row'>
          <span>Plan:</span>
          <strong>{plan?.plan} ({plan?.billing})</strong>
        </div>
        <div className='detail-row'>
          <span>Amount:</span>
          <strong>{symbol} {convertPrice(plan?.price)}</strong>
        </div>
        <div className='detail-row'>
          <span>Currency:</span>
          <strong>{subscription?.currency || currency || 'KES'}</strong>
        </div>
      </div>

      <button
        className='btn pay-btn flutterwave-btn'
        onClick={handleFlutterwavePay}
        disabled={processing}
      >
        {processing ? (
          <span className='spinner'>Processing...</span>
        ) : (
          <>
            <FiCreditCard /> Pay {symbol} {convertPrice(plan?.price)}
          </>
        )}
      </button>
      
      <p className='payment-secure'>
        🔒 Secured by Flutterwave
      </p>
    </div>
  );
};

export default FlutterwavePayment;