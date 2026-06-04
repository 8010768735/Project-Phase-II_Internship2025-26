export const USD_TO_INR = 83;

export const toINR = (usd) => {
  const n = Number(usd || 0);
  return Math.max(0, n * USD_TO_INR);
};

export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

