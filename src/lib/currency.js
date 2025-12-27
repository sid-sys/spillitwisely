// Currency conversion utilities
// Using a free exchange rate API (exchangerate-api.com)

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// In-memory cache for exchange rates
let ratesCache = {
  rates: null,
  timestamp: null,
  baseCurrency: 'USD'
};

/**
 * Fetch latest exchange rates
 * @param {string} baseCurrency - Base currency code (default: USD)
 * @returns {Promise<Object>} Exchange rates object
 */
export async function fetchExchangeRates(baseCurrency = 'USD') {
  try {
    // Check cache first
    const now = Date.now();
    if (
      ratesCache.rates &&
      ratesCache.baseCurrency === baseCurrency &&
      ratesCache.timestamp &&
      (now - ratesCache.timestamp) < CACHE_DURATION
    ) {
      return ratesCache.rates;
    }

    // Fetch fresh rates
    const response = await fetch(`${EXCHANGE_RATE_API}${baseCurrency}`);
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    
    // Update cache
    ratesCache = {
      rates: data.rates,
      timestamp: now,
      baseCurrency: baseCurrency
    };

    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return fallback rates if API fails
    return getFallbackRates();
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {Object} rates - Exchange rates object (optional, will fetch if not provided)
 * @returns {Promise<number>} Converted amount
 */
export async function convertCurrency(amount, fromCurrency, toCurrency, rates = null) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    // Get rates if not provided
    if (!rates) {
      rates = await fetchExchangeRates('USD');
    }

    // Convert via USD as base
    const amountInUSD = amount / rates[fromCurrency];
    const convertedAmount = amountInUSD * rates[toCurrency];

    return convertedAmount;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount; // Return original amount on error
  }
}

/**
 * Format currency with symbol and proper decimals
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {boolean} showCode - Whether to show currency code
 * @returns {string} Formatted currency string
 */
export function formatCurrencyWithSymbol(amount, currency = 'GBP', showCode = false) {
  const symbols = {
    GBP: '£',
    USD: '$',
    EUR: '€',
    INR: '₹',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'Fr',
    CNY: '¥',
    SEK: 'kr',
    NZD: 'NZ$'
  };

  const symbol = symbols[currency] || currency + ' ';
  const formatted = Math.abs(amount).toFixed(2);
  
  if (showCode && symbols[currency]) {
    return `${symbol}${formatted} ${currency}`;
  }

  return `${symbol}${formatted}`;
}

/**
 * Get all supported currencies
 * @returns {Array} Array of currency objects
 */
export function getSupportedCurrencies() {
  return [
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }
  ];
}

/**
 * Fallback exchange rates (approximate, for offline use)
 * Base: USD = 1.00
 */
function getFallbackRates() {
  return {
    USD: 1.00,
    GBP: 0.79,
    EUR: 0.92,
    INR: 83.12,
    JPY: 149.50,
    AUD: 1.52,
    CAD: 1.36,
    CHF: 0.88,
    CNY: 7.24,
    SEK: 10.37,
    NZD: 1.64
  };
}

/**
 * Convert multiple amounts to user's preferred currency
 * @param {Array} amounts - Array of {amount, currency} objects
 * @param {string} targetCurrency - User's preferred currency
 * @returns {Promise<number>} Total in target currency
 */
export async function convertMultipleCurrencies(amounts, targetCurrency) {
  const rates = await fetchExchangeRates('USD');
  
  let total = 0;
  for (const item of amounts) {
    const converted = await convertCurrency(item.amount, item.currency, targetCurrency, rates);
    total += converted;
  }
  
  return total;
}

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {Promise<number>} Exchange rate
 */
export async function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return 1;
  
  const rates = await fetchExchangeRates('USD');
  const rateInUSD = 1 / rates[fromCurrency];
  const rateToTarget = rateInUSD * rates[toCurrency];
  
  return rateToTarget;
}
