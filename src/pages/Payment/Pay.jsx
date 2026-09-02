import { useLocation, useNavigate } from 'react-router-dom';
import './Pay.scss';
import { useEffect, useState } from 'react';
import AppHelmet from '../AppHelmet';
import ScrollToTop from '../ScrollToTop';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { notificationState, subscriptionState, userState } from '../../recoil/atoms';
import { getUser, updateUser } from '../../firebase';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Swal from 'sweetalert2';
import { FiCheck } from 'react-icons/fi';
import { useCurrency } from '../../context/CurrencyContext';

// Import payment components
import PaymentMethodSelector from './PaymentMethodSelector';
import PaystackPay from './PaystackPay';
import KoraPay from './KoraPay';
import FlutterwavePay from './FlutterwavePay';//
import FlutterwavePayment from './FlutterwavePayment';
import CryptoPay from './CryptoPay';
import PayPalPay from './PayPalPay';
import CardPay from './CardPay';
import ProcessingStep from './ProcessingStep';

const paypalInitialOptions = {
  "client-id": "AXIggvGGvXozbZhdkvizPLd89nVYW8KoyNlHO0gHx7hjY_Ah_IfgXihUQGf7T2HUUVYx-D5SNncM0CtU",
  currency: "USD",
  intent: "capture",
};

export default function Pay() {
  const [user, setUser] = useRecoilState(userState);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const setNotification = useSetRecoilState(notificationState);
  const [subscription, setSubscription] = useRecoilState(subscriptionState);
  const [plan, setPlan] = useState(null);

  const [convertedPrice, setConvertedPrice] = useState(0);
  const { symbol, currency, convertPrice } = useCurrency();

  useEffect(() => {
    if (location.state?.subscription) {
      setPlan(location.state.subscription);
      setSubscription(location.state.subscription);
    } else {
      setPlan(subscription);
    }

    switch (currency) {
      case 'KES':
        setPaymentMethod('mpesa')
        break;
      case 'NGN':
        setPaymentMethod('kora')
        break;
      default:
        setPaymentMethod('flutterwave')
        break;
    }
  }, [location, subscription]);


  // Set initial plan and converted price
  useEffect(() => {
    let selectedPlan;
    if (location.state?.subscription) {
      selectedPlan = location.state.subscription;
    } else {
      selectedPlan = { ...pricings[0] };
    }
    
    // Convert the price immediately
    const converted = convertPrice(selectedPlan.price);
    
    setPlan({
      ...selectedPlan,
      price: selectedPlan.price,
      convertedPrice: converted,
      currency: selectedPlan.currency || symbol,
    });
    
    setConvertedPrice(converted);
    setSubscription(selectedPlan);
  }, [location.state?.subscription]);


  //or
  /*useEffect(() => {
    if (location.state?.subscription) {
      setPlan({
        ...location.state.subscription,
        price: subscription?.price != null ? subscription.price : convertPrice(subscription.price),
        currency: subscription?.currency || symbol,
      });
      setSubscription(location.state.subscription);
    } else {
      const fallback = { ...pricings[0], price: convertPrice(pricings[0].price), currency: symbol };
      setPlan(fallback);
      setSubscription(fallback);
    }
  }, [location]);*/

  // Update converted price whenever convertPrice or plan changes
  useEffect(() => {
    if (plan?.price !== undefined) {
      const converted = convertPrice(plan.price);
      setConvertedPrice(converted);
      setPlan(prev => ({
        ...prev,
        convertedPrice: converted,
      }));
    }
  }, [plan?.price, convertPrice]);



  useEffect(() => {
    // Check for Kora payment callback
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    
    if (reference && !processing) {
      verifyKoraTransaction(reference);
    }
  }, []);

  const verifyKoraTransaction = async (reference) => {
    setProcessing(true);

    Swal.fire({
      title: "Verifying Payment",
      text: "Please wait...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      Swal.close();
      await handleUpgrade();
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      Swal.close();
      Swal.fire({
        title: "Verification Error",
        text: "Please contact support",
        icon: "error",
        confirmButtonText: "OK",
      });
      setProcessing(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const currentDate = new Date().toISOString();
      await updateUser(user.email, true, {
        subDate: currentDate,
        billing: plan.billing,
        plan: plan.plan,
      }, setNotification);
      await getUser(user.email, setUser);
      setProcessing(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Welcome to VIP! 🎉',
        text: `You are now subscribed to the ${plan.plan} plan.`,
        confirmButtonColor: '#059212',
        timer: 3000,
        showConfirmButton: true,
      });
      
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Upgrade error:', err);
      setProcessing(false);
      setError('Failed to update subscription. Please contact support.');
      throw err;
    }
  };

  const handleError = (err) => {
    const errorMsg = err?.message || err || 'Payment failed';
    setError(errorMsg);
    // Don't set notification here to avoid duplicates
  };

  const handleMethodChange = (method) => {
    setPaymentMethod(method);
    setError(null);
    setStep(0);
  };

  /*const paypalScriptProps = {
    ...paypalInitialOptions,
    "enable-funding": "venmo,paylater",
    "data-namespace": "paypal_sdk",
  };*/

  return (
    <PayPalScriptProvider options={paypalInitialOptions /*paypalScriptProps*/}>
      <div className='pay-section'>
        <AppHelmet title={'Subscription'} />
        <ScrollToTop />

        <div className='pay-card'>
          {/* Plan Header */}
          <div className='plan-header'>
            <div className='plan-badge'>{plan?.plan}</div>
            <h2 className='plan-title'>Upgrade to {plan?.plan || 'Premium'} Plan</h2>
            <p className='plan-desc'>{plan?.title || 'Get access to premium features'}</p>
            <div className='plan-price'>
              <span className='price-amount'>{symbol} {convertedPrice || convertPrice(plan?.price)}</span>
              <span className='price-period'>/{plan?.billing || 'month'}</span>
            </div>
            <div className='plan-features'>
              {plan?.features?.map((f, i) => (
                <span className='feature-tag' key={i}>
                  <FiCheck /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Payment Flow */}
          {step === 0 && (
            <>
              <PaymentMethodSelector 
                selected={paymentMethod} 
                onChange={handleMethodChange} 
                currency={currency}
              />

              <div className='payment-form'>
                {error && (
                  <div className='error-message'>
                    <span className='error-icon'>⚠️</span>
                    {error}
                  </div>
                )}

                {paymentMethod === 'mpesa' && (
                  <PaystackPay
                    user={user}
                    plan={plan}
                    onSuccess={handleUpgrade}
                    onError={handleError}
                    processing={processing}
                    setProcessing={setProcessing}

                    convertedPrice={convertedPrice}
                    symbol={symbol}
                    subscription={subscription}
                  />
                )}


                {paymentMethod === 'kora' && (
                  <KoraPay
                    user={user}
                    plan={plan}
                    onSuccess={handleUpgrade}
                    onError={handleError}
                    processing={processing}
                    setProcessing={setProcessing}

                    convertedPrice={convertedPrice}
                    symbol={symbol}
                    currency={currency}
                    subscription={subscription}
                  />
                )}

                {/*paymentMethod === 'flutterwave' && (
                  <FlutterwavePayment
                    user={user}
                    plan={plan}
                    subscription={subscription}
                    onSuccess={handleUpgrade}
                    currency ={currency}
                    processing={processing}
                    setProcessing={setProcessing}
                    onError={(err) => setError(err)}
                  />
                )*/}

                {paymentMethod === 'flutterwave' && (
                  <FlutterwavePay
                    user={user}
                    plan={plan}
                    convertedPrice={convertedPrice}
                    currency ={currency}
                    symbol={symbol}
                    onSuccess={handleUpgrade}
                    processing={processing}
                    setProcessing={setProcessing}
                  />
                )}

                {paymentMethod === 'crypto' && (
                  <CryptoPay 
                    plan={plan} 
                    onSuccess={handleUpgrade}
                  />
                )}
                
                {paymentMethod === 'card' && (
                  <CardPay
                    plan={plan}
                    user={user}
                    onSuccess={handleUpgrade}
                    processing={processing}
                    setProcessing={setProcessing}
                    onError={(err) => setError(err)}
                  /> 
                )}

                {paymentMethod === 'paypal' && (
                  <PayPalPay
                    plan={plan}
                    onSuccess={handleUpgrade}
                    onError={handleError}
                    processing={processing}
                    setProcessing={setProcessing}
                  />
                )}
              </div>
            </>
          )}

          {/* Processing Step */}
          {step === 1 && (
            <ProcessingStep plan={plan} phone={phone} />
          )}
        </div>
      </div>
    </PayPalScriptProvider>
  );
}