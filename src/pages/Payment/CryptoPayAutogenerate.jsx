import { useState, useEffect } from 'react';
import { FiCopy, FiCheck, FiChevronDown } from 'react-icons/fi';
import { NOWPAYMENTS_API_KEY, kshToUsd } from '../../utils/paymentUtils';

const CryptoPay = ({ plan }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  const [cryptoData, setCryptoData] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  //const [loading, setLoading] = useState(false);

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
        setError('Failed to load currencies');
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (plan) {
      getCryptoAddress();
    }
  }, [selectedCurrency, plan?.price/*, currencies*/]);

  const getCryptoAddress = async () => {
    /*if (!plan) return;
    
    setLoading(true);
    setError(null);
    */
    try {
      //const usdPrice = kshToUsd(plan?.price || 0);
      
      const res = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': NOWPAYMENTS_API_KEY,
        },
        body: JSON.stringify({
          price_amount: parseFloat(kshToUsd(plan?.price || 0)),//parseFloat(usdPrice),
          price_currency: 'usd',
          pay_currency: selectedCurrency.toLowerCase(),
          /*order_id: `sub_${Date.now()}`,
          order_description: `${plan.plan} VIP Subscription`,*/
        }),
      });

      /*if (!res.ok) {
        throw new Error('Failed to generate payment');
      }*/

      const data = await res.json();
      setCryptoData({
        amount: data.pay_amount,
        currency: data.pay_currency,//data.pay_currency?.toUpperCase() || selectedCurrency,
        address: data.pay_address/* || selectedCurrency*/,
        network: data.network,
        /*paymentId: data.payment_id,*/
      });
    } catch (e) {
      console.error('Crypto payment error:', e);
      setError('Failed to generate crypto address. Please try again.');
      /*setCryptoData(null);*/
    } /*finally {
      setLoading(false);
    }*/
  };

  const handleCopy = () => {
    if (cryptoData?.address) {
      navigator.clipboard.writeText(cryptoData.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);//setTimeout(() => setCopied(false), 2000);
    }
  };

  /*const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
    setCryptoData(null);
  };*/

  return (
    <div className='crypto-form'>
      {error && (
        <div className='error-message'>
          <span className='error-icon'>⚠️</span>
          {error}
          {/*<button 
            onClick={getCryptoAddress}
            className='retry-btn'
          >
            Retry
          </button>*/}
        </div>
      )}
      
      <div className='currency-selector'>
        <label className='input-label'>Select Currency</label>{/*<label className='input-label'>Select Cryptocurrency</label>*/}
        <div className='select-wrapper'>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className='input-field select'
            /*disabled={loading}*/
          >
            {currencies.length > 0 ? (
              currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))
            ) : (
              <option value="BTC">BTC</option>
            )}
          </select>
          <FiChevronDown className='select-icon' />
        </div>
      </div>

      {/*loading && (
        <div className='crypto-loading'>
          <div className='loading-spinner'></div>
          <p>Generating payment address...</p>
        </div>
      )*/}

      {cryptoData && (
        <div className='crypto-info'>
          <div className='crypto-row'>
            <span className='crypto-label'>Amount to send</span>
            <span className='crypto-value'>
              {cryptoData.amount /*parseFloat(cryptoData.amount).toFixed(8)*/} {cryptoData.currency}
            </span>
          </div>

          {/*<div className='crypto-row'>
            <span className='crypto-label'>Network</span>
            <span className='crypto-value'>{cryptoData.network}</span>
          </div>*/}

          <a
            className='crypto-row'
            href={`https://nowpayments.io/payment/?iid=${cryptoData.address}`}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <span className='crypto-label'>Status</span>
            <span className='crypto-value' style={{ color: 'var(--accent)' }}>Track payment →</span>
          </a>

          <div className='crypto-row address'>
            <span className='crypto-label'>Payment Address</span>
            <div className='address-box'>
              <input 
                value={cryptoData.address} 
                readOnly 
                className='address-input' 
              />
              <button onClick={handleCopy} className='copy-btn' title="Copy address">
                {copied ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
          </div>

          <p className='crypto-note'>
            ⚠️ Send the exact amount shown above to this address. 
            Payment will be confirmed automatically once the transaction is verified on the blockchain.
            <br /> {/*Send the exact amount to the address above. Payment will be confirmed automatically.*/}
            <small>Minimum confirmation: 2 network confirmations</small>
          </p>

          {/*<div className='crypto-warning'>
            <span>⏱️ Payment expires in 15 minutes</span>
            <button onClick={getCryptoAddress} className='refresh-btn'>
              Refresh Address
            </button>
          </div>*/}
        </div>
      )}
    </div>
  );
};

export default CryptoPay;