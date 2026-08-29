export const NOWPAYMENTS_API_KEY = "D7YT1YV-PCAM4ZN-HX9W5M1-H02KFCV";
export const EXCHANGE_RATE = 128;

export const kshToUsd = (ksh) => {
  if (!ksh || isNaN(ksh)) return '0.00';
  return (ksh / EXCHANGE_RATE).toFixed(2);
};

//export const kshToUsd = (ksh) => (ksh / EXCHANGE_RATE).toFixed(2);

export const formatPhone = (p) => {
  if (!p) return '';
  let clean = p.replace(/\D/g, '');
  if (clean.startsWith('0')) return clean; //return clean.slice(1);
  if (clean.startsWith('254')) return '0' + clean.slice(3); //return clean.slice(3);
  if (clean.startsWith('7') || clean.startsWith('1')) return '0' + clean;
  return clean;
};

export const validatePhone = (phone) => {
  const clean = phone.replace(/\D/g, '');
  return clean.length >= 9 && clean.length <= 12;
};

export function generateReference() {
  return `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}