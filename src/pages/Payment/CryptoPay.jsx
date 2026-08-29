import { useState, useEffect, useRef } from 'react';
import { FiCopy, FiCheck, FiChevronDown } from 'react-icons/fi';
import { NOWPAYMENTS_API_KEY, kshToUsd } from '../../utils/paymentUtils';

const CryptoPay = ({ plan, onSuccess }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  const [cryptoData, setCryptoData] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [generatingAddress, setGeneratingAddress] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await fetch('https://api.nowpayments.io/v1/merchant/coins', {
          headers: { 'x-api-key': NOWPAYMENTS_API_KEY }
        });
        const data = await res.json();
        setCurrencies(data?.selectedCurrencies || []);
      } catch (e) { 
        console.error('Crypto currencies fetch failed', e); 
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const getUsdPrice = () => {
    if (!plan) return 0;
    const priceToUse = plan.convertedPrice || plan.price || 0;////return kshToUsd(plan?.convertedPrice || plan?.price || 0);
    return kshToUsd(priceToUse);
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
      const usdPrice = getUsdPrice();
      
      const res = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
        body: JSON.stringify({
          price_amount: parseFloat(usdPrice),
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
        await onSuccess();
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

  return (
    <div className='crypto-form'>
      {error && (
        <div className='error-message'>
          <span className='error-icon'>⚠️</span>
          {error}
        </div>
      )}

      <div className='currency-selector'>
        <label className='input-label'>Select Currency</label>
        <div className='select-wrapper'>
          <select
            value={selectedCurrency}
            onChange={(e) => handleCryptoCurrencyChange(e.target.value)}
            className='input-field select'
            disabled={generatingAddress}
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
                disabled={!paymentId}
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
  );
};

export default CryptoPay;