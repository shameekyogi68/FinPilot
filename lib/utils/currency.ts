export const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
};

export const currencyLocales: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'ja-JP',
};

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const locale = currencyLocales[currency] || 'en-IN';
  const symbol = currencySymbols[currency] || '₹';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || '$';
}