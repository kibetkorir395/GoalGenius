import { useState } from 'react';
import { FiCreditCard } from 'react-icons/fi';
import Swal from 'sweetalert2';

const KORAPAY_SECRET_KEY = "sk_live_QSCFYWDHaEL8Yv3V4JA49G7vm2muVRHxAiBhuhgP";
const KORAPAY_API_URL = "https://api.korapay.com/merchant/api/v1/charges/initialize";

const KoraPay = ({ 
  user, 
  plan, 
  convertedPrice, 
  symbol, 
  subscription, 
  onSuccess,
  processing,
  setProcessing
}) => {
  const [error, setError] = useState(null);

  const generateReference = () => {
    return `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleKora = async () => {
    if (!user?.email) {
      Swal.fire({
        title: 'Login Required',
        text: 'Please login first',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    if (!plan) {
      Swal.fire({
        title: 'Error',
        text: 'No plan selected',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    setProcessing(true);
    setError(null);

    Swal.fire({
      title: "Initializing Payment",
      text: "Please wait...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const reference = generateReference();
      const currentUrl = window.location.href.split('?')[0];
      
      // Get the correct converted amount
      const amountToPay = convertedPrice || plan.convertedPrice || plan.price;
      
      // Determine currency based on symbol
      const payCurrency = (subscription?.currency || symbol) === '₦' ? 'NGN' : 'KES';
      
      // Round the amount for payment processing
      const finalAmount = Math.round(Number(amountToPay));
      
      const paymentData = {
        amount: finalAmount,
        redirect_url: `${currentUrl}?reference=${reference}`,
        currency: payCurrency,
        reference: reference,
        narration: `${plan.plan} VIP Subscription`,
        customer: {
          name: user?.username || (user?.email ? user.email.split('@')[0] : 'Customer'),
          email: user?.email,
        },
        metadata: {
          plan: plan.plan,
          user_id: user?.email,
          original_price: plan.price,
          converted_price: finalAmount,
        },
      };

      const response = await fetch(KORAPAY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      Swal.close();

      if (result.status && result.data?.checkout_url) {
        window.location.href = result.data.checkout_url;
      } else {
        throw new Error(result.message || 'Failed to initialize payment');
      }
    } catch (error) {
      setProcessing(false);
      setError(error.message || 'Failed to initialize payment');
      Swal.fire({
        title: "Payment Error",
        text: error.message || 'Failed to initialize payment',
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className='kora-form'>
      {error && (
        <div className='error-message'>
          <span className='error-icon'>⚠️</span>
          {error}
        </div>
      )}
      <p className='input-hint'>
        Pay securely with M-Pesa, card, or bank transfer via Kora. 
        You will be redirected to complete your payment.
      </p>
      <p className='payment-amount'>
        Amount to pay: <strong>{symbol} {convertedPrice || plan?.convertedPrice || plan?.price}</strong>
      </p>
      <button
        className='btn pay-btn'
        onClick={handleKora}
        disabled={processing}
      >
        {processing ? (
          <span className='spinner'>Processing...</span>
        ) : (
          <>
            <FiCreditCard /> Pay {symbol} {convertedPrice || plan?.convertedPrice || plan?.price}
          </>
        )}
      </button>
    </div>
  );
};

export default KoraPay;