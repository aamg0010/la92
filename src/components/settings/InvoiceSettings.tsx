/**
 * InvoiceSettings.tsx
 * Configuration for payment receipts/invoices
 * Allows tenants to customize logo, colors, and tax settings
 */

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Receipt, Save, AlertTriangle, Eye, Globe, Upload, X, Image } from "lucide-react";
import { useClinicSettings, useUpdateClinicSettings } from "@/hooks/useSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { PaymentReceipt } from "@/components/cobros/PaymentReceipt";

const COUNTRIES = [
  { code: "ES", name: "Espana", taxIdLabel: "CIF/NIF", defaultTaxRate: 21 },
  { code: "CO", name: "Colombia", taxIdLabel: "NIT", defaultTaxRate: 19 },
] as const;

const SPAIN_TAX_RATES = [
  { value: 21, label: "General (21%)" },
  { value: 10, label: "Reducido (10%)" },
  { value: 4, label: "Superreducido (4%)" },
  { value: 0, label: "Exento (0%)" },
];

const SPAIN_IRPF_RATES = [
  { value: 0, label: "Sin retencion (0%)" },
  { value: 7, label: "Inicio actividad (7%)" },
  { value: 15, label: "General (15%)" },
];

export function InvoiceSettings() {
  const { data: settings, isLoading } = useClinicSettings();
  const { data: role } = useUserRole();
  const updateSettings = useUpdateClinicSettings();
  const isAdmin = role === "admin";
  const previewRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    invoice_logo_url: "",
    invoice_primary_color: "#0ea5e9",
    invoice_secondary_color: "#64748b",
    default_tax_rate: 0,
    show_tax_warning: true,
    invoice_header_text: "",
    invoice_footer_text: "Gracias por su preferencia",
    invoice_terms: "",
    show_tax_id_on_invoice: true,
    // Country-specific
    tax_country: "CO" as "ES" | "CO",
    cif: "",
    irpf_rate: 0,
    tax_regime: "",
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        invoice_logo_url: settings.invoice_logo_url || "",
        invoice_primary_color: settings.invoice_primary_color || "#0ea5e9",
        invoice_secondary_color: settings.invoice_secondary_color || "#64748b",
        default_tax_rate: settings.default_tax_rate || 0,
        show_tax_warning: settings.show_tax_warning ?? true,
        invoice_header_text: settings.invoice_header_text || "",
        invoice_footer_text: settings.invoice_footer_text || "Gracias por su preferencia",
        invoice_terms: settings.invoice_terms || "",
        show_tax_id_on_invoice: settings.show_tax_id_on_invoice ?? true,
        // Country-specific
        tax_country: settings.tax_country || "CO",
        cif: settings.cif || "",
        irpf_rate: settings.irpf_rate || 0,
        tax_regime: settings.tax_regime || "",
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      invoice_logo_url: formData.invoice_logo_url || null,
      invoice_primary_color: formData.invoice_primary_color,
      invoice_secondary_color: formData.invoice_secondary_color,
      default_tax_rate: formData.default_tax_rate,
      show_tax_warning: formData.show_tax_warning,
      invoice_header_text: formData.invoice_header_text || null,
      invoice_footer_text: formData.invoice_footer_text || null,
      invoice_terms: formData.invoice_terms || null,
      show_tax_id_on_invoice: formData.show_tax_id_on_invoice,
      // Country-specific
      tax_country: formData.tax_country,
      cif: formData.cif || null,
      irpf_rate: formData.irpf_rate,
      tax_regime: formData.tax_regime || null,
    });
  };

  const selectedCountry = COUNTRIES.find((c) => c.code === formData.tax_country);
  const taxIdLabel = selectedCountry?.taxIdLabel || "NIT/CIF";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Sample data for preview
  const samplePayment = {
    id: "sample-001",
    amount: 150000,
    payment_method: "cash",
    payment_date: new Date().toISOString(),
    reference_number: "REC-001234",
    notes: "Pago por limpieza dental",
  };

  const samplePatient = {
    first_name: "Maria",
    last_name: "Garcia Lopez",
    document_number: "12345678",
    phone: "3001234567",
  };

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Configuracion de Recibos
          </CardTitle>
          <CardDescription>
            Personaliza el aspecto y contenido de los recibos de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Branding Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Marca</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Logo para Recibos/Facturas</Label>
                  <div className="flex items-start gap-4">
                    {/* Logo Preview */}
                    <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                      {formData.invoice_logo_url ? (
                        <img
                          src={formData.invoice_logo_url}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Image className="w-8 h-8 text-muted-foreground/50" />
                      )}
                    </div>
                    {/* Upload Controls */}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!isAdmin}
                          onClick={() => document.getElementById("logo-upload")?.click()}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Subir Logo
                        </Button>
                        {formData.invoice_logo_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!isAdmin}
                            onClick={() => setFormData((prev) => ({ ...prev, invoice_logo_url: "" }))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 500000) {
                              alert("La imagen debe ser menor a 500KB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setFormData((prev) => ({
                                ...prev,
                                invoice_logo_url: event.target?.result as string,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = "";
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG o SVG. Max 500KB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="invoice_primary_color">Color Principal</Label>
                    <div className="flex gap-2">
                      <Input
                        id="invoice_primary_color"
                        type="color"
                        value={formData.invoice_primary_color}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            invoice_primary_color: e.target.value,
                          }))
                        }
                        className="w-12 h-10 p-1 cursor-pointer"
                        disabled={!isAdmin}
                      />
                      <Input
                        value={formData.invoice_primary_color}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            invoice_primary_color: e.target.value,
                          }))
                        }
                        placeholder="#0ea5e9"
                        className="flex-1"
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <Label htmlFor="invoice_secondary_color">Color Secundario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="invoice_secondary_color"
                        type="color"
                        value={formData.invoice_secondary_color}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            invoice_secondary_color: e.target.value,
                          }))
                        }
                        className="w-12 h-10 p-1 cursor-pointer"
                        disabled={!isAdmin}
                      />
                      <Input
                        value={formData.invoice_secondary_color}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            invoice_secondary_color: e.target.value,
                          }))
                        }
                        placeholder="#64748b"
                        className="flex-1"
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Country & Tax Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Pais e Impuestos
              </h3>

              {/* Country Selection */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pais de Tributacion</Label>
                  <Select
                    value={formData.tax_country}
                    onValueChange={(value: "ES" | "CO") => {
                      const country = COUNTRIES.find((c) => c.code === value);
                      setFormData((prev) => ({
                        ...prev,
                        tax_country: value,
                        default_tax_rate: country?.defaultTaxRate || 0,
                        irpf_rate: value === "ES" ? 15 : 0,
                      }));
                    }}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar pais" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.code === "ES" ? "🇪🇸" : "🇨🇴"} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_id_field">{taxIdLabel}</Label>
                  <Input
                    id="tax_id_field"
                    value={formData.tax_country === "ES" ? formData.cif : (settings?.tax_id || "")}
                    onChange={(e) => {
                      if (formData.tax_country === "ES") {
                        setFormData((prev) => ({ ...prev, cif: e.target.value }));
                      }
                    }}
                    placeholder={formData.tax_country === "ES" ? "B12345678" : "900123456-1"}
                    disabled={!isAdmin || formData.tax_country === "CO"}
                  />
                  {formData.tax_country === "CO" && (
                    <p className="text-xs text-muted-foreground">
                      Editar en Configuracion → Consultorio
                    </p>
                  )}
                </div>
              </div>

              {/* Tax Rate Selection - Country specific */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tasa de IVA</Label>
                  {formData.tax_country === "ES" ? (
                    <Select
                      value={String(formData.default_tax_rate)}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          default_tax_rate: parseFloat(value),
                        }))
                      }
                      disabled={!isAdmin}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPAIN_TAX_RATES.map((rate) => (
                          <SelectItem key={rate.value} value={String(rate.value)}>
                            {rate.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.default_tax_rate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          default_tax_rate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      disabled={!isAdmin}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.tax_country === "ES"
                      ? "Servicios sanitarios suelen estar exentos (Art. 20 LIVA)"
                      : "IVA estandar en Colombia: 19%"}
                  </p>
                </div>

                {/* Spain-specific: IRPF */}
                {formData.tax_country === "ES" && (
                  <div className="space-y-2">
                    <Label>Retencion IRPF</Label>
                    <Select
                      value={String(formData.irpf_rate)}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          irpf_rate: parseFloat(value),
                        }))
                      }
                      disabled={!isAdmin}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPAIN_IRPF_RATES.map((rate) => (
                          <SelectItem key={rate.value} value={String(rate.value)}>
                            {rate.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Retencion aplicable a profesionales
                    </p>
                  </div>
                )}
              </div>

              {/* Tax Regime - Spain */}
              {formData.tax_country === "ES" && (
                <div className="space-y-2">
                  <Label htmlFor="tax_regime">Regimen Fiscal</Label>
                  <Input
                    id="tax_regime"
                    value={formData.tax_regime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tax_regime: e.target.value }))
                    }
                    placeholder="Ej: Estimacion Directa Simplificada"
                    disabled={!isAdmin}
                  />
                </div>
              )}

              {/* Switches */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar advertencia de IVA</Label>
                    <p className="text-xs text-muted-foreground">
                      Cuando el IVA es 0%, mostrar nota explicativa
                    </p>
                  </div>
                  <Switch
                    checked={formData.show_tax_warning}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        show_tax_warning: checked,
                      }))
                    }
                    disabled={!isAdmin}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar {taxIdLabel} en recibo</Label>
                    <p className="text-xs text-muted-foreground">
                      Incluir identificacion fiscal
                    </p>
                  </div>
                  <Switch
                    checked={formData.show_tax_id_on_invoice}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        show_tax_id_on_invoice: checked,
                      }))
                    }
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              {formData.default_tax_rate === 0 && formData.show_tax_warning && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      IVA configurado en 0%
                    </p>
                    <p className="text-xs text-amber-700">
                      {formData.tax_country === "ES"
                        ? "Los servicios sanitarios estan exentos de IVA segun Art. 20.Uno.3 LIVA. Verifique con su asesor fiscal."
                        : "Se mostrara un aviso en los recibos indicando que no incluyen IVA. Consulte con su contador."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Text Content Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Contenido</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_header_text">
                    Texto de Encabezado (opcional)
                  </Label>
                  <Input
                    id="invoice_header_text"
                    value={formData.invoice_header_text}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        invoice_header_text: e.target.value,
                      }))
                    }
                    placeholder="Ej: Especialistas en Odontologia General"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_footer_text">Texto de Pie</Label>
                  <Input
                    id="invoice_footer_text"
                    value={formData.invoice_footer_text}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        invoice_footer_text: e.target.value,
                      }))
                    }
                    placeholder="Gracias por su preferencia"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_terms">
                    Terminos y Condiciones (opcional)
                  </Label>
                  <Textarea
                    id="invoice_terms"
                    value={formData.invoice_terms}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        invoice_terms: e.target.value,
                      }))
                    }
                    placeholder="Condiciones de pago, politicas de reembolso, etc."
                    rows={2}
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? "Ocultar Vista Previa" : "Ver Vista Previa"}
              </Button>

              <Button
                type="submit"
                disabled={!isAdmin || updateSettings.isPending}
              >
                {updateSettings.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del Recibo</CardTitle>
            <CardDescription>
              Asi se vera un recibo con la configuracion actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden max-w-md mx-auto">
              <PaymentReceipt
                ref={previewRef}
                payment={samplePayment}
                patient={samplePatient}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default InvoiceSettings;
