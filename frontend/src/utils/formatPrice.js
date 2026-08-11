// Reusable Indian Rupee currency formatter for the whole app.
// Keeps a single source of truth so the symbol / format is never hardcoded.

export const formatPrice = (value, options = {}) => {
  const num = Number(value);
  if (Number.isNaN(num)) return `\u20B9${value}`;

  const { trimWhole = true, ...rest } = options;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: trimWhole ? 0 : 2,
    maximumFractionDigits: 2,
    ...rest,
  }).format(num);
};

export default formatPrice;
