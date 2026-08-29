import { useState, useEffect } from 'react';
import { useFlutterwave } from 'react-flutterwave';
import Swal from 'sweetalert2';

const FlutterwavePay = ({ 
  user, 
  plan, 
  convertedPrice, 
  symbol, 
  currency,
  onSuccess,
  processing,
  setProcessing 
}) => {
  const [error, setError] = useState(null);

  const getPaymentConfig = () => {
    
    // Get the amount
    const amount = convertedPrice || plan?.convertedPrice || plan?.price || 0;
    
    // Generate transaction reference
    const tx_ref = `fw-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    return {
      public_key: "FLWPUBK-38aac8e4c9002a02b46496e8ef4b32ab-X", // Replace with your public key
      tx_ref: tx_ref,
      amount: Number(amount),
      currency,
      payment_options: "card,mobilemoney",
      customer: {
        email: user?.email || 'customer@example.com',
        phonenumber: user?.phone || '08000000000',
        name: user?.username || user?.email?.split('@')[0] || 'Customer',
      },
      customizations: {
        title: `${plan?.plan || 'VIP'} Subscription`,
        description: `Upgrade to ${plan?.plan || 'Premium'} plan - ${plan?.billing || 'monthly'} subscription`,
        logo: "https://your-logo-url.com/logo.png", // Replace with your logo URL
      },
      meta: {
        plan: plan?.plan || 'premium',
        user_id: user?.email || 'unknown',
        billing: plan?.billing || 'monthly',
        original_price: plan?.price || 0,
      }
    };
  };

  const handleFlutterPayment = useFlutterwave(getPaymentConfig());

  const handlePayment = () => {
    setError(null);
    setProcessing(true);

    handleFlutterPayment({
      callback: async (response) => {
        
        if (response.status === 'successful') {
          setProcessing(false);
          Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            text: 'Your subscription is being activated...',
            timer: 1500,
            showConfirmButton: false,
          });
          await onSuccess();
        } else if (response.status === 'cancelled') {
          setProcessing(false);
          setError('Payment was cancelled');
        } else {
          setProcessing(false);
          setError('Payment failed. Please try again.');
        }
      },
      onClose: () => {
        setProcessing(false);
        // Don't show error on close as user might have cancelled intentionally
      },
    });
  };

  // Handle payment verification from redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const tx_ref = urlParams.get('tx_ref');
    const transaction_id = urlParams.get('transaction_id');
    
    if (status === 'successful' && tx_ref) {
      // Verify the transaction
      verifyFlutterwaveTransaction(tx_ref, transaction_id);
    }
  }, []);

  const verifyFlutterwaveTransaction = async (tx_ref, transaction_id) => {
    setProcessing(true);
    
    Swal.fire({
      title: "Verifying Payment",
      text: "Please wait...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      // You should verify the transaction on your backend
      // For now, we'll simulate verification
      // In production, call your backend API to verify
      
      // Simulate verification
      setTimeout(async () => {
        Swal.close();
        await onSuccess();
        setProcessing(false);
      }, 2000);
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      Swal.close();
      setProcessing(false);
      Swal.fire({
        title: "Verification Error",
        text: "Please contact support",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const config = getPaymentConfig();

  return (
    <div className='flutterwave-form'>
      {error && (
        <div className='error-message'>
          <span className='error-icon'>⚠️</span>
          {error}
        </div>
      )}
      
      <p className='input-hint'>
        Pay securely with card, mobile money, or bank transfer via Flutterwave.
      </p>
      
      <div className='payment-details'>
        <div className='detail-row'>
          <span>Plan:</span>
          <strong>{plan?.plan} ({plan?.billing})</strong>
        </div>
        <div className='detail-row'>
          <span>Amount:</span>
          <strong>{symbol} {convertedPrice || plan?.convertedPrice || plan?.price}</strong>
        </div>
        <div className='detail-row'>
          <span>Currency:</span>
          <strong>{config.currency}</strong>
        </div>
        <div className='detail-row'>
          <span>Reference:</span>
          <strong className='reference-text'>{config.tx_ref}</strong>
        </div>
      </div>

      <button
        className='btn pay-btn flutterwave-btn'
        onClick={handlePayment}
        disabled={processing}
      >
        {processing ? (
          <span className='spinner'>Processing...</span>
        ) : (
          <>
            <svg 
              className='fw-icon' 
              viewBox="0 0 24 24" 
              width="20" 
              height="20"
            >
              <path 
                fill="currentColor" 
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
              />
            </svg>
            Pay {symbol} {convertedPrice || plan?.convertedPrice || plan?.price} with Flutterwave
          </>
        )}
      </button>

      <p className='payment-secure'>
        🔒 Secured by Flutterwave
      </p>
    </div>
  );
};

export default FlutterwavePay;