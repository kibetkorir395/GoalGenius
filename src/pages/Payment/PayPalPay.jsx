import { useEffect, useState } from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { kshToUsd } from '../../utils/paymentUtils';

const PayPalPay = ({ plan, onSuccess, onError, processing, setProcessing }) => {
  const [paypalKey, setPaypalKey] = useState(0);
  //const [error, setError] = useState(null);

  useEffect(() => {
    setPaypalKey(k => k + 1);
  }, [plan?.price]);

  const getUsdPrice = () => kshToUsd(plan?.price || 0);

  const createPayPalOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [{
        amount: { value: getUsdPrice(), currency_code: 'USD' },
        description: `${plan.plan} VIP Subscription`,
        //custom_id: plan?.id || Date.now().toString(),
      }],
      /*application_context: {
        shipping_preference: 'NO_SHIPPING',
      }*/
    });
  };

  const onPayPalApprove = (data, actions) => {
    return actions.order.capture().then(async () => {
      setProcessing(true);
      await onSuccess();
      setProcessing(false);

      /*setProcessing(true);
      try {
        await onSuccess();
      } catch (err) {
        setError('Payment completed but subscription update failed');
        if (onError) onError(err);
      } finally {
        setProcessing(false);
      }*/
    });
  };

  const onPayPalError = (err) => {
    console.error('PayPal Error:', err);
    setProcessing(false);
    const errorMsg = err?.message || 'PayPal payment failed. Please try again.';
    //setError(errorMsg);
    if (onError) onError(errorMsg);
  };

  return (
    <div className='paypal-form'>
      {/*error && (
        <div className='error-message'>
          <span className='error-icon'>⚠️</span>
          {error}
        </div>
      )*/}
      <div className='paypal-price'>
        <span className='usd-label'>Pay with PayPal</span>
        <span className='usd-amount'>${getUsdPrice()}</span>
        {/*<span className='usd-exchange'>~ KSH {plan?.price}</span>*/}
      </div>
      <div className='paypal-buttons'>
        <PayPalButtons
          key={paypalKey}
          style={{ 
            layout: 'horizontal', 
            color: 'gold',
            shape: 'pill',
            label: 'pay',

            /*height: 48,
            tagline: false*/
          }}
          createOrder={createPayPalOrder}
          onApprove={onPayPalApprove}
          onError={onPayPalError}
          /*onCancel={() => {
            setError('Payment cancelled');
            setProcessing(false);
          }}*/
          disabled={processing}
        />
      </div>
    </div>
  );
};

export default PayPalPay;