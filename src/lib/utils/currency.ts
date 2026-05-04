/**
 * Currency utilities for dentry!
 * Supports EUR, USD, and COP currencies with proper formatting
 */

export type CurrencyCode = 'EUR' | 'USD' | 'COP';

export interface CurrencyConfig {
  symbol: string;
  locale: string;
  name: string;
  flag: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EUR: {
    symbol: '€',
    locale: 'es-ES',
    name: 'Euro',
    flag: '🇪🇺',
    decimals: 2
  },
  USD: {
    symbol: '$',
    locale: 'en-US',
    name: 'Dólar',
    flag: '🇺🇸',
    decimals: 2
  },
  COP: {
    symbol: '$',
    locale: 'es-CO',
    name: 'Peso Colombiano',
    flag: '🇨🇴',
    decimals: 0
  }
};

export const CURRENCY_OPTIONS = Object.entries(CURRENCIES).map(([code, config]) => ({
  value: code as CurrencyCode,
  label: `${config.flag} ${config.name} (${config.symbol})`,
  ...config
}));

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - Currency code (EUR, USD, COP)
 * @returns Formatted currency string
 */
export function formatMoney(
  amount: number | null | undefined,
  currency: CurrencyCode = 'COP'
): string {
  if (amount == null || isNaN(amount)) return '-';

  const config = CURRENCIES[currency];

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

/**
 * Parse a currency string back to number
 * @param value - The formatted currency string
 * @param currency - Currency code
 * @returns Parsed number or 0
 */
export function parseMoney(value: string, currency: CurrencyCode = 'COP'): number {
  if (!value) return 0;

  // Remove currency symbols and formatting
  const cleaned = value
    .replace(/[€$]/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, currency === 'USD' ? '' : '.')
    .replace(/,/g, currency === 'USD' ? '.' : '')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency]?.symbol || '$';
}

/**
 * Check if a currency code is valid
 */
export function isValidCurrency(code: string): code is CurrencyCode {
  return code in CURRENCIES;
}
