import { useState, useRef, useEffect } from 'react';
import { FiSmartphone } from 'react-icons/fi';
import { PaymentApiService } from '../../services/PaymentApiService';
import { formatPhone } from '../../utils/paymentUtils';

const PaystackPay = ({ 
  user, 
  plan, 
  onSuccess, 
  onError, 
  setProcessing,
  processing 
}) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const referenceRef = useRef(null);
  //const isCancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      //isCancelledRef.current = true;
      if (pollRef.current) {
        pollRef.current.cancel();
        //pollRef.current = null;
      }
    };
  }, []);

  /*const cleanupPolling = () => {
    if (pollRef.current) {
      pollRef.current.cancel();
      pollRef.current = null;
    }
  };*/

  const handleMpesa = async () => {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    setError(null);
    setProcessing(true);
    setAwaitingOtp(false);
    setOtp('');
    
    try {
      const data = await PaymentApiService.initialize({
        email: user?.email,
        amount: plan.price,
        phone,
        userId: user?.uid || user?.email,
        activation_type: 'account_activation',
      });

      if (!data.reference) {
        throw new Error('No reference returned from payment gateway');
      }

      referenceRef.current = data.reference;
      setStep(1);


      // Clean up any existing polling
      //cleanupPolling();

      pollRef.current = PaymentApiService.pollTransaction(
        data.reference,
        async () => {
          //if (isCancelledRef.current) return;
          setProcessing(false);
          //setAwaitingOtp(false);
          //cleanupPolling();
          await onSuccess();
        },
        (err) => {
          //if (isCancelledRef.current) return;
          setProcessing(false);
          setStep(0);
          setError(err?.timeout ? 'Payment timed out. Please check your transaction status.' : (err?.message || 'Payment failed. Please try again.'));
          //cleanupPolling();
          if (onError) onError(err);
        },
        (reference) => {
          //if (isCancelledRef.current) return;
          setAwaitingOtp(true);
          setProcessing(false);
        }
      );
    } catch (e) {
      //if (isCancelledRef.current) return;
      setProcessing(false);
      //setStep(0);
      setError(e.message);
      //cleanupPolling();
      if (onError) onError(e);
    }
  };

  const handleSubmitOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP sent to your phone');
      return;
    }

    setError(null);
    setProcessing(true);

    try {
      await PaymentApiService.submitOtp(referenceRef.current, otp);
      setAwaitingOtp(false);
      setProcessing(true);
      setStep(1);

      if (pollRef.current) {
        await pollRef.current.resume();
      }
    } catch (e) {
      //if (isCancelledRef.current) return;
      setProcessing(false);
      setError(e.message);
      if (onError) onError(e);
    }
  };

  /*const handleCancel = () => {
    isCancelledRef.current = true;
    cleanupPolling();
    setProcessing(false);
    setStep(0);
    setAwaitingOtp(false);
    setError(null);
    setOtp('');
    if (onError) onError({ message: 'Payment cancelled by user' });
  };*/

  return (
    <div className='mpesa-form'>
      {error && (
        <div className='error-message'>
          <span className='error-icon'>⚠️</span>
          {error}
          {/*error.includes('timed out') && (
            <button onClick={handleMpesa} className='retry-btn'>
              Try Again
            </button>
          )*/}
        </div>
      )}
      
      {!awaitingOtp /*&& step === 0*/ && (
        <>
          <label className='input-label'>Phone Number</label>
          <div className='input-group'>
            <span className='input-prefix'>🇰🇪 +254</span>
            <input
              type='tel'
              placeholder='7XX XXX XXX'
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className='input-field'
              maxLength={10}
              //disabled={processing}
            />
          </div>
          <p className='input-hint'>Enter your M-Pesa registered number</p>
          <button
            className='btn pay-btn'
            onClick={handleMpesa}
            disabled={processing}
          >
            {processing ? (
              <span className='spinner'>Processing...</span>
            ) : (
              <>
                <FiSmartphone /> Pay KSH {plan?.price}
              </>
            )}
          </button>
        </>
      )}

      {awaitingOtp && (
        <>
          <label className='input-label'>Enter OTP</label>
          <input
            type='text'
            placeholder='Enter the code sent to your phone'
            value={otp}
            onChange={(e) => setOtp(e.target.value)}//setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className='input-field'
            maxLength={6}
            /*disabled={processing}
            autoFocus*/
          />
          <p className='input-hint'>A one-time code was sent to your phone to authorize this payment.</p>
          
          {/*<div className='otp-actions'>*/}
            <button
              className='btn pay-btn'
              onClick={handleSubmitOtp}
              disabled={processing}//{processing || !otp}
            >
              {processing ? (
                <span className='spinner'>Verifying...</span>
              ) : (
                <>
                  <FiSmartphone /> Submit OTP
                </>
              )}
            </button>
            {/*<button
              className='btn cancel-btn'
              onClick={handleCancel}
              disabled={processing}
            >
              Cancel
            </button>*/}
          {/*</div>*/}
          {/*<p className='resend-hint'>
            Didn't receive code?{' '}
            <button onClick={handleMpesa} className='resend-btn'>
              Resend OTP
            </button>
          </p>*/}
        </>
      )}
      
      {/*step === 1 && !awaitingOtp && (
        <div className='processing-indicator'>
          <div className='processing-spinner-small'></div>
          <p>Processing your payment...</p>
          <button onClick={handleCancel} className='cancel-btn small'>
            Cancel
          </button>
        </div>
      )*/}
    </div>
  );
};

export default PaystackPay;