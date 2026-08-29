import { useState } from 'react';
import { FiCreditCard } from 'react-icons/fi';
import { PaymentService } from '../../services/PaymentService';

const CardPay = ({ 
  plan, 
  user, 
  onSuccess, 
  processing, 
  setProcessing,
  onError 
}) => {
  const [cardData, setCardData] = useState({
    card_number: '',
    cvv: '',
    expiry_month: '',
    expiry_year: '',
    pin: ''
  });
  const [error, setError] = useState(null);

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
        await onSuccess();
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (e) {
      setProcessing(false);
      setError(e.message);
      if (onError) onError(e.message);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s/g, '').replace(/\D/g, '');
    const matches = v.match(/(\d{0,4})/g);
    const match = (matches || []).filter(Boolean).join(' ');
    return match;
  };

  const handleCardInput = (field, value) => {
    let formattedValue = value;
    
    if (field === 'card_number') {
      formattedValue = formatCardNumber(value);
    }
    
    setCardData({ ...cardData, [field]: formattedValue });
  };

  return (
    <div className='card-form'>
      {error && (
        <div className='error-message'>
          <span className='error-icon'>⚠️</span>
          {error}
        </div>
      )}
      
      <div className='input-group-2'>
        <div>
          <label className='input-label'>Card Number</label>
          <input
            type='text'
            placeholder='1234 5678 9012 3456'
            value={cardData.card_number}
            onChange={(e) => handleCardInput('card_number', e.target.value)}
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
  );
};

export default CardPay;