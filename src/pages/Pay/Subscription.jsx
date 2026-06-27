import { useLocation, useNavigate } from 'react-router-dom';
import './Pay.scss';
import { useEffect, useState, useRef } from 'react';
import AppHelmet from '../AppHelmet';
import ScrollToTop from '../ScrollToTop';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { notificationState, subscriptionState, userState } from '../../recoil/atoms';
import { getUser, updateUser } from '../../firebase';
import { PaymentService } from '../../services/PaymentService';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Swal from 'sweetalert2';
import { FiCreditCard, FiSmartphone, FiGlobe, FiCopy, FiCheck, FiChevronDown } from 'react-icons/fi';
import { SiBitcoinsv } from "react-icons/si";

const NOWPAYMENTS_API_KEY = "D7YT1YV-PCAM4ZN-HX9W5M1-H02KFCV";
const EXCHANGE_RATE = 150;

const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', icon: FiSmartphone, desc: 'Pay via M-Pesa' },
  //{ id: 'card', label: 'Card', icon: FiCreditCard, desc: 'Visa / Mastercard' },
  { id: 'crypto', label: 'Crypto', icon: SiBitcoinsv, desc: 'BTC, ETH, USDT' },
  //{ id: 'paypal', label: 'PayPal', icon: FiGlobe, desc: 'Pay with PayPal' },
];

const paypalInitialOptions = {
  "client-id": "AXIggvGGvXozbZhdkvizPLd89nVYW8KoyNlHO0gHx7hjY_Ah_IfgXihUQGf7T2HUUVYx-D5SNncM0CtU",
  currency: "USD",
  intent: "capture",
};

export default function Subscription() {
  const [user, setUser] = useRecoilState(userState);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [copied, setCopied] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  const [cryptoData, setCryptoData] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [paypalKey, setPaypalKey] = useState(0);
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [cardData, setCardData] = useState({
    card_number: '',
    cvv: '',
    expiry_month: '',
    expiry_year: '',
    pin: ''
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const setNotification = useSetRecoilState(notificationState);
  const [subscription, setSubscription] = useRecoilState(subscriptionState);
  const [plan, setPlan] = useState(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (location.state?.subscription) {
      setPlan(location.state.subscription);
      setSubscription(location.state.subscription);
    } else {
      setPlan(subscription);
    }
  }, [location, subscription]);

  useEffect(() => {
    if (paymentMethod === 'paypal') setPaypalKey(k => k + 1);
  }, [plan?.price, paymentMethod]);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await fetch('https://api.nowpayments.io/v1/merchant/coins', {
          headers: { 'x-api-key': NOWPAYMENTS_API_KEY }
        });
        const data = await res.json();
        setCurrencies(data?.selectedCurrencies || []);
      } catch (e) { console.error('Crypto currencies fetch failed', e); }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (paymentMethod === 'crypto' && plan) {
      getCryptoAddress();
    }
  }, [selectedCurrency, plan?.price, paymentMethod]);

  useEffect(() => {
    return () => {
      if (cancelRef.current) cancelRef.current();
    };
  }, []);

  const kshToUsd = (ksh) => (ksh / EXCHANGE_RATE).toFixed(2);
  const getUsdPrice = () => kshToUsd(plan?.price || 0);

  const getCryptoAddress = async () => {
    try {
      const res = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
        body: JSON.stringify({
          price_amount: parseFloat(getUsdPrice()),
          price_currency: 'usd',
          pay_currency: selectedCurrency.toLowerCase(),
        }),
      });
      const data = await res.json();
      setCryptoData({
        amount: data.pay_amount,
        currency: data.pay_currency,
        address: data.pay_address,
        network: data.network,
      });
    } catch (e) {
      setError('Failed to generate crypto address. Please try again.');
    }
  };

  const handleCopy = () => {
    if (cryptoData?.address) {
      navigator.clipboard.writeText(cryptoData.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleUpgrade = async () => {
    const currentDate = new Date().toISOString();
    await updateUser(user.email, true, {
      subDate: currentDate,
      billing: plan.billing,
      plan: plan.plan,
    }, setNotification);
    await getUser(user.email, setUser);
    Swal.fire({
      icon: 'success',
      title: 'Welcome to VIP!',
      text: `You are now subscribed to the ${plan.plan} plan.`,
      confirmButtonColor: '#059212',
      timer: 3000,
    });
    navigate('/', { replace: true });
  };

  const handleMpesa = async () => {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const data = await PaymentService.initiateMpesa(
        plan.price,
        'KES',
        phone,
        user?.email,
        user?.email?.split('@')[0]
      );
      if (data.success) {
        setStep(1);
        cancelRef.current = PaymentService.pollTransaction(
          data.checkoutId,
          async () => {
            setProcessing(false);
            await handleUpgrade();
          },
          (err) => {
            setProcessing(false);
            setError(err?.timeout ? 'Payment timed out. Please check your transaction status.' : 'Payment failed. Please try again.');
          }
        );
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (e) {
      setProcessing(false);
      setError(e.message);
    }
  };

  const handleCard = async () => {
    const { card_number, cvv, expiry_month, expiry_year, pin } = cardData;
    if (!card_number || !cvv || !expiry_month || !expiry_year) {
      setError('Please fill all card fields');
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const data = await PaymentService.initiateCard(
        plan.price,
        'KES',
        user?.email,
        user?.email?.split('@')[0],
        card_number,
        cvv,
        expiry_month,
        expiry_year,
        pin
      );
      if (data.success) {
        setProcessing(false);
        await handleUpgrade();
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (e) {
      setProcessing(false);
      setError(e.message);
    }
  };

  const createPayPalOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [{
        amount: { value: getUsdPrice(), currency_code: 'USD' },
        description: `${plan.plan} VIP Subscription`,
      }],
    });
  };

  const onPayPalApprove = (data, actions) => {
    return actions.order.capture().then(async () => {
      setProcessing(true);
      await handleUpgrade();
      setProcessing(false);
    });
  };

  const onPayPalError = (err) => {
    setProcessing(false);
    setError('PayPal payment failed. Please try again.');
  };

  const formatPhone = (p) => {
    let clean = p.replace(/\D/g, '');
    if (clean.startsWith('0')) return clean;
    if (clean.startsWith('254')) return '0' + clean.slice(3);
    if (clean.startsWith('7') || clean.startsWith('1')) return '0' + clean;
    return clean;
  };

  return (
    <PayPalScriptProvider options={paypalInitialOptions}>
      <div className='pay-section'>
        <AppHelmet title={'Subscription'} />
        <ScrollToTop />

        <div className='pay-card'>
          {/* Plan Header */}
          <div className='plan-header'>
            <div className='plan-badge'>{plan?.plan}</div>
            <h2 className='plan-title'>Upgrade to {plan?.plan} Plan</h2>
            <p className='plan-desc'>{plan?.title}</p>
            <div className='plan-price'>
              <span className='price-amount'>KSH {plan?.price}</span>
              <span className='price-period'>/{plan?.billing}</span>
            </div>
            <div className='plan-features'>
              {plan?.features?.map((f, i) => (
                <span className='feature-tag' key={i}>
                  <FiCheck /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Method Selector */}
          {step === 0 && (
            <>
              <div className='method-selector'>
                <p className='selector-label'>Choose Payment Method</p>
                <div className='method-grid'>
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        className={`method-card ${paymentMethod === m.id ? 'active' : ''}`}
                        onClick={() => { setPaymentMethod(m.id); setError(null); }}
                      >
                        <Icon className='method-icon' />
                        <span className='method-name'>{m.label}</span>
                        <span className='method-desc'>{m.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Forms */}
              <div className='payment-form'>
                {error && (
                  <div className='error-message'>
                    <span className='error-icon'>⚠️</span>
                    {error}
                  </div>
                )}

                {paymentMethod === 'mpesa' && (
                  <div className='mpesa-form'>
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
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className='card-form'>
                    <div className='input-group-2'>
                      <div>
                        <label className='input-label'>Card Number</label>
                        <input
                          type='text'
                          placeholder='1234 5678 9012 3456'
                          value={cardData.card_number}
                          onChange={(e) => setCardData({ ...cardData, card_number: e.target.value })}
                          className='input-field'
                          maxLength={19}
                        />
                      </div>
                    </div>
                    <div className='input-group-3'>
                      <div>
                        <label className='input-label'>MM</label>
                        <input
                          type='text'
                          placeholder='MM'
                          value={cardData.expiry_month}
                          onChange={(e) => setCardData({ ...cardData, expiry_month: e.target.value })}
                          className='input-field'
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <label className='input-label'>YY</label>
                        <input
                          type='text'
                          placeholder='YY'
                          value={cardData.expiry_year}
                          onChange={(e) => setCardData({ ...cardData, expiry_year: e.target.value })}
                          className='input-field'
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <label className='input-label'>CVV</label>
                        <input
                          type='text'
                          placeholder='123'
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          className='input-field'
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div>
                      <label className='input-label'>PIN (optional)</label>
                      <input
                        type='password'
                        placeholder='****'
                        value={cardData.pin}
                        onChange={(e) => setCardData({ ...cardData, pin: e.target.value })}
                        className='input-field'
                        maxLength={4}
                      />
                    </div>
                    <button
                      className='btn pay-btn'
                      onClick={handleCard}
                      disabled={processing}
                    >
                      {processing ? (
                        <span className='spinner'>Processing...</span>
                      ) : (
                        <>
                          <FiCreditCard /> Pay KSH {plan?.price}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {paymentMethod === 'crypto' && (
                  <div className='crypto-form'>
                    <div className='currency-selector'>
                      <label className='input-label'>Select Currency</label>
                      <div className='select-wrapper'>
                        <select
                          value={selectedCurrency}
                          onChange={(e) => setSelectedCurrency(e.target.value)}
                          className='input-field select'
                        >
                          {currencies.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <FiChevronDown className='select-icon' />
                      </div>
                    </div>

                    {cryptoData && (
                      <div className='crypto-info'>
                        <div className='crypto-row'>
                          <span className='crypto-label'>Amount to send</span>
                          <span className='crypto-value'>
                            {cryptoData.amount} {cryptoData.currency}
                          </span>
                        </div>
                        <div className='crypto-row'>
                          <span className='crypto-label'>Network</span>
                          <span className='crypto-value'>{cryptoData.network?.toUpperCase()}</span>
                        </div>
                        <div className='crypto-row address'>
                          <span className='crypto-label'>Address</span>
                          <div className='address-box'>
                            <input value={cryptoData.address} readOnly className='address-input' />
                            <button onClick={handleCopy} className='copy-btn'>
                              {copied ? <FiCheck /> : <FiCopy />}
                            </button>
                          </div>
                        </div>
                        <p className='crypto-note'>
                          Send the exact amount to the address above. Payment will be confirmed automatically.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className='paypal-form'>
                    <div className='paypal-price'>
                      <span className='usd-label'>Pay with PayPal</span>
                      <span className='usd-amount'>${getUsdPrice()}</span>
                    </div>
                    <div className='paypal-buttons'>
                      <PayPalButtons
                        key={paypalKey}
                        style={{ layout: 'horizontal', color: 'gold', shape: 'pill', label: 'pay' }}
                        createOrder={createPayPalOrder}
                        onApprove={onPayPalApprove}
                        onError={onPayPalError}
                        disabled={processing}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Processing Step */}
          {step === 1 && (
            <div className='processing-step'>
              <div className='processing-ring'>
                <div className='processing-spinner' />
              </div>
              <h3>Processing Payment</h3>
              <p>Please check your phone and enter your M-Pesa PIN to complete the transaction.</p>
              <div className='processing-details'>
                <span>Amount: KSH {plan?.price}</span>
                <span>Phone: {phone}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
