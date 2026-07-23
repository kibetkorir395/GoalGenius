import { useLocation, useNavigate } from 'react-router-dom';
import './Pay.scss';
import { useEffect, useState } from 'react';
import AppHelmet from '../AppHelmet';
import ScrollToTop from '../ScrollToTop';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { notificationState, subscriptionState, userState } from '../../recoil/atoms';
import { getUser, updateUser } from '../../firebase';
import { PaymentService } from '../../services/PaymentService';
import Swal from 'sweetalert2';
import { FiCreditCard, FiCopy, FiCheck, FiChevronDown } from 'react-icons/fi';
import { SiBitcoinsv } from "react-icons/si";

const NOWPAYMENTS_API_KEY = "D7YT1YV-PCAM4ZN-HX9W5M1-H02KFCV";
const EXCHANGE_RATE = 150;

// KoraPay public key (safe for client-side). Replace with your live public key.
const KORAPAY_PUBLIC_KEY = "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const KORAPAY_SCRIPT_SRC = "https://api.korapay.com/merchant/widget/korapay.js";

const PAYMENT_METHODS = [
  { id: 'kora', label: 'Kora', icon: FiCreditCard, desc: 'M-Pesa, Card, Bank' },
  { id: 'crypto', label: 'Crypto', icon: SiBitcoinsv, desc: 'BTC, ETH, USDT' },
];

const KORAPAY_SCRIPT_ID = 'korapay-checkout-script';

function loadKorapayScript() {
  return new Promise((resolve, reject) => {
    if (window.Korapay) return resolve();
    const existing = document.getElementById(KORAPAY_SCRIPT_ID);
    if (existing) {
      if (window.Korapay) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load KoraPay SDK')));
      return;
    }
    const script = document.createElement('script');
    script.id = KORAPAY_SCRIPT_ID;
    script.src = KORAPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load KoraPay SDK'));
    document.body.appendChild(script);
  });
}

function generateReference() {
  return `GG-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
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
    if (paymentMethod === 'crypto' && plan) {
      getCryptoAddress();
    }
  }, [selectedCurrency, plan?.price, paymentMethod]);

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
    setError(null);
    setProcessing(true);
    let settled = false;
    try {
      await loadKorapayScript();
      const reference = generateReference();
      window.Korapay.initialize({
        key: KORAPAY_PUBLIC_KEY,
        reference,
        amount: Number(plan.price),
        currency: 'KES',
        customer: {
          name: user?.username || (user?.email ? user.email.split('@')[0] : 'Customer'),
          email: user?.email || 'customer@example.com',
        },
        narration: `${plan.plan} VIP Subscription`,
        channels: ['card', 'mobile_money', 'bank_transfer', 'pay_with_bank'],
        onClose: () => {
          if (!settled) setProcessing(false);
        },
        onSuccess: async (data) => {
          settled = true;
          try {
            const result = await PaymentService.verifyKora(data?.reference || reference);
            if (result.success) {
              await handleUpgrade();
            } else {
              setProcessing(false);
              setError(result.message || 'Payment verification failed. If you were charged, please contact support.');
            }
          } catch (e) {
            setProcessing(false);
            setError('Payment verification failed. If you were charged, please contact support.');
          }
        },
        onFailed: () => {
          settled = true;
          setProcessing(false);
          setError('Payment failed. Please try again.');
        },
        onPending: () => {
          setProcessing(false);
          setError('Payment is pending. We will confirm once it completes.');
        },
      });
    } catch (e) {
      setProcessing(false);
      setError(e?.message || 'Could not start KoraPay checkout.');
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
                Pay securely with M-Pesa, card, or bank transfer via Kora. A checkout window will open to collect your details.
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
        </div>
      </div>
    </div>
  );
}
