import { useLocation, useNavigate } from 'react-router-dom';
import './Pay.scss';
import { useEffect, useRef, useState } from 'react';
import AppHelmet from '../AppHelmet';
import ScrollToTop from '../ScrollToTop';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { notificationState, subscriptionState, userState } from '../../recoil/atoms';
import { getUser, updateUser } from '../../firebase';
import Swal from 'sweetalert2';
import { FiCreditCard, FiCopy, FiCheck, FiChevronDown } from 'react-icons/fi';
import { SiBitcoinsv } from "react-icons/si";

const NOWPAYMENTS_API_KEY = "D7YT1YV-PCAM4ZN-HX9W5M1-H02KFCV";
const EXCHANGE_RATE = 150;

// KoraPay API keys
const KORAPAY_SECRET_KEY = "sk_live_QSCFYWDHaEL8Yv3V4JA49G7vm2muVRHxAiBhuhgP";
const KORAPAY_API_URL = "https://api.korapay.com/merchant/api/v1/charges/initialize";

const PAYMENT_METHODS = [
  { id: 'kora', label: 'Kora', icon: FiCreditCard, desc: 'M-Pesa, Card, Bank' },
  { id: 'crypto', label: 'Crypto', icon: SiBitcoinsv, desc: 'BTC, ETH, USDT' },
];

function generateReference() {
  return `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function Payment() {
  const [user, setUser] = useRecoilState(userState);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('kora');
  const [copied, setCopied] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  const [cryptoData, setCryptoData] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [error, setError] = useState(null);
  const [generatingAddress, setGeneratingAddress] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const setNotification = useSetRecoilState(notificationState);
  const [subscription, setSubscription] = useRecoilState(subscriptionState);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (location.state?.subscription) {
      setPlan(location.state.subscription);
      setSubscription(location.state.subscription);
    } else {
      setPlan(subscription);
    }
  }, [location, subscription]);

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
    // Handle Kora payment redirect callback
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    
    if (reference && !processing) {
      verifyKoraTransaction(reference);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const kshToUsd = (ksh) => (ksh / EXCHANGE_RATE).toFixed(2);
  const getUsdPrice = () => kshToUsd(plan?.price || 0);

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
      // Since Kora redirects back, we assume payment was successful
      // You can optionally verify with Kora API here
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

  const getCryptoAddress = async () => {
    setGeneratingAddress(true);
    setError(null);
    setCryptoData(null);
    setPaymentId(null);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
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
          order_id: `VIP-${plan?.plan || 'sub'}-${Date.now()}`,
          order_description: `${plan?.plan || ''} VIP Subscription`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.pay_address) {
        throw new Error(data.message || 'Failed to generate address');
      }
      setCryptoData({
        amount: data.pay_amount,
        currency: data.pay_currency,
        address: data.pay_address,
        network: data.network,
      });
      setPaymentId(data.payment_id);
    } catch (e) {
      setError(e?.message || 'Failed to generate crypto address. Please try again.');
    } finally {
      setGeneratingAddress(false);
    }
  };

  const handleCryptoCurrencyChange = (newCurrency) => {
    setSelectedCurrency(newCurrency);
    setCryptoData(null);
    setPaymentId(null);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const checkCryptoPaymentStatus = async () => {
    if (!paymentId) return false;
    try {
      const res = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
        headers: { 'x-api-key': NOWPAYMENTS_API_KEY },
      });
      const data = await res.json();
      const status = data.payment_status;
      if (status === 'finished' || status === 'confirmed' || status === 'sending') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsPolling(false);
        await handleUpgrade();
        return true;
      } else if (status === 'failed' || status === 'refunded' || status === 'expired') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsPolling(false);
        setError('Payment was not successful. Please generate a new address and try again.');
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const startCryptoPolling = () => {
    if (!paymentId) {
      setError('Please generate a payment address first.');
      return;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    setIsPolling(true);
    setError(null);
    pollingIntervalRef.current = setInterval(async () => {
      const completed = await checkCryptoPaymentStatus();
      if (completed && pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 10000);
    checkCryptoPaymentStatus();
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
    setProcessing(false);
    Swal.fire({
      icon: 'success',
      title: 'Welcome to VIP!',
      text: `You are now subscribed to the ${plan.plan} plan.`,
      confirmButtonColor: '#059212',
      timer: 3000,
    });
    navigate('/', { replace: true });
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

    setProcessing(true);

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
      const amount = Math.round(Number(plan.price));
      
      const paymentData = {
        amount: amount,
        redirect_url: `${currentUrl}?reference=${reference}`,
        currency: 'KES',
        reference: reference,
        narration: `${plan.plan} VIP Subscription`,
        customer: {
          name: user?.username || (user?.email ? user.email.split('@')[0] : 'Customer'),
          email: user?.email,
        },
        metadata: {
          plan: plan.plan,
          user_id: user?.email,
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
      Swal.fire({
        title: "Payment Error",
        text: error.message,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
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

          {paymentMethod === 'kora' && (
            <div className='kora-form'>
              <p className='input-hint'>
                Pay securely with M-Pesa, card, or bank transfer via Kora. You will be redirected to complete your payment.
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
                    onChange={(e) => handleCryptoCurrencyChange(e.target.value)}
                    className='input-field select'
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <FiChevronDown className='select-icon' />
                </div>
              </div>

              {cryptoData ? (
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
                    Send the exact amount to the address above.
                  </p>
                  <div className='crypto-actions'>
                    <button
                      className='btn pay-btn'
                      onClick={getCryptoAddress}
                      disabled={generatingAddress}
                    >
                      {generatingAddress ? 'Generating...' : 'Generate New Address'}
                    </button>
                    {!isPolling && (
                      <button
                        className='btn pay-btn'
                        onClick={startCryptoPolling}
                      >
                        Check Payment Status
                      </button>
                    )}
                  </div>
                  {isPolling && (
                    <p className='crypto-note polling-note'>Monitoring payment status...</p>
                  )}
                </div>
              ) : (
                <button
                  className='btn pay-btn full-width'
                  onClick={getCryptoAddress}
                  disabled={generatingAddress}
                >
                  {generatingAddress ? 'Generating Address...' : 'Generate Payment Address'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
