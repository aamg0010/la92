/**
 * MoneyInput Component
 * Input con formateo automático de montos con separadores de miles
 */

import { useState, useEffect, useRef, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type CurrencyCode, CURRENCIES } from "@/lib/utils/currency";
import { useCurrency } from "@/hooks/useCurrency";

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number | string;
  onChange: (value: number) => void;
  /**
   * Moneda a usar para formateo. Si no se pasa, se toma del CurrencyContext
   * (clinic_settings.currency). Esto garantiza que cada clínica vea su
   * moneda configurada (COP para Colombia, EUR para España, etc.) sin
   * forzar a cada formulario a leerla manualmente.
   */
  currency?: CurrencyCode;
}

/**
 * Formatea un número con separadores de miles según la moneda
 */
function formatWithSeparators(value: number | string, currency: CurrencyCode): string {
  const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  if (numValue === 0) return "";

  const config = CURRENCIES[currency];
  const separator = currency === "USD" ? "," : ".";
  const decimalSeparator = currency === "USD" ? "." : ",";

  const parts = numValue.toFixed(config.decimals).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  if (config.decimals > 0 && parts[1]) {
    return `${integerPart}${decimalSeparator}${parts[1]}`;
  }
  return integerPart;
}

/**
 * Parsea un string formateado a número
 */
function parseFormattedValue(value: string, currency: CurrencyCode): number {
  if (!value) return 0;

  // Eliminar símbolos de moneda y espacios
  let cleaned = value.replace(/[€$\s]/g, "");

  if (currency === "USD") {
    // USD usa , para miles y . para decimales
    cleaned = cleaned.replace(/,/g, "");
  } else {
    // EUR/COP usan . para miles y , para decimales
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, currency: currencyProp, className, placeholder, ...props }, ref) => {
    // Si el caller no fuerza un currency, usamos el del contexto del tenant.
    // Default a COP solo si no estamos dentro de un CurrencyProvider (tests).
    const { currency: ctxCurrency } = useCurrency();
    const currency: CurrencyCode = currencyProp ?? ctxCurrency;
    const [displayValue, setDisplayValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sincronizar valor externo
    useEffect(() => {
      if (!isFocused) {
        const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
        setDisplayValue(formatWithSeparators(numValue, currency));
      }
    }, [value, currency, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;

      // Solo permitir números, puntos, comas y espacios
      const validChars = /[^\d.,\s]/g;
      const cleanedInput = rawValue.replace(validChars, "");

      setDisplayValue(cleanedInput);

      // Parsear y notificar al padre
      const numericValue = parseFormattedValue(cleanedInput, currency);
      onChange(numericValue);
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Mostrar valor sin formato para edición fácil
      const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
      if (numValue > 0) {
        setDisplayValue(numValue.toString());
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Formatear al salir del campo
      const numValue = parseFormattedValue(displayValue, currency);
      setDisplayValue(formatWithSeparators(numValue, currency));
      onChange(numValue);
    };

    const symbol = CURRENCIES[currency].symbol;

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {symbol}
        </span>
        <Input
          ref={ref || inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn("pl-7", className)}
          placeholder={placeholder || "0"}
          {...props}
        />
      </div>
    );
  }
);

MoneyInput.displayName = "MoneyInput";
