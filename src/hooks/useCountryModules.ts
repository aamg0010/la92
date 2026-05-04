import { useClinicSettings } from "./useSettings";

export type CountryCode = "CO" | "ES" | null;

export function useCountryModules() {
  const { data: settings, isLoading } = useClinicSettings();
  const country: CountryCode = settings?.tax_country || null;

  return {
    country,
    isLoading,
    // Colombia: Facturación DIAN + RIPS
    showFacturacionDIAN: country === "CO",
    showRIPS: country === "CO",
    // España: Facturación Verifactu
    showFacturacionVerifactu: country === "ES",
    // Módulos comunes a ambos países
    showRH1: true,
    showControlAmbiental: true,
    // Labels según país
    facturacionLabel: country === "ES" ? "Facturación" : "Facturación",
    facturacionBadge: country === "ES" ? "Verifactu" : "DIAN",
    facturacionPath: country === "ES" ? "/facturacion-es" : "/facturacion",
  };
}
