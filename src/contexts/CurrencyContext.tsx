import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useClinicSettings } from '@/hooks/useSettings';
import {
  type CurrencyCode,
  CURRENCIES,
  CURRENCY_OPTIONS,
  formatMoney as formatMoneyUtil,
  getCurrencySymbol,
  isValidCurrency,
} from '@/lib/utils/currency';

interface CurrencyContextValue {
  /** Current currency code (EUR, USD, COP) */
  currency: CurrencyCode;
  /** Format a number as currency using current settings */
  formatMoney: (amount: number | null | undefined) => string;
  /** Get the currency symbol */
  symbol: string;
  /** Currency configuration */
  config: typeof CURRENCIES[CurrencyCode];
  /** All available currencies */
  currencies: typeof CURRENCY_OPTIONS;
  /** Loading state */
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { data: settings, isLoading } = useClinicSettings();

  const value = useMemo<CurrencyContextValue>(() => {
    // Default to COP if not set or invalid
    const currencyCode = settings?.currency && isValidCurrency(settings.currency)
      ? settings.currency as CurrencyCode
      : 'COP';

    return {
      currency: currencyCode,
      formatMoney: (amount) => formatMoneyUtil(amount, currencyCode),
      symbol: getCurrencySymbol(currencyCode),
      config: CURRENCIES[currencyCode],
      currencies: CURRENCY_OPTIONS,
      isLoading,
    };
  }, [settings?.currency, isLoading]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Hook to access currency formatting in components
 *
 * @example
 * ```tsx
 * const { formatMoney, currency, symbol } = useCurrency();
 * return <span>{formatMoney(1500)}</span>; // "$ 1.500" (COP)
 * ```
 */
export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);

  if (!context) {
    // Return default values if used outside provider (e.g., in tests)
    return {
      currency: 'COP',
      formatMoney: (amount) => formatMoneyUtil(amount, 'COP'),
      symbol: '$',
      config: CURRENCIES.COP,
      currencies: CURRENCY_OPTIONS,
      isLoading: false,
    };
  }

  return context;
}

export { CurrencyContext };
