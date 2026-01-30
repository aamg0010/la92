import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Save, Clock } from "lucide-react";
import { useClinicSettings, useUpdateClinicSettings } from "@/hooks/useSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS_OF_WEEK = [
  { id: "monday", label: "Lunes" },
  { id: "tuesday", label: "Martes" },
  { id: "wednesday", label: "Miércoles" },
  { id: "thursday", label: "Jueves" },
  { id: "friday", label: "Viernes" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
];

export function ClinicSettings() {
  const { data: settings, isLoading } = useClinicSettings();
  const { data: role } = useUserRole();
  const updateSettings = useUpdateClinicSettings();
  const isAdmin = role === "admin";

  const [formData, setFormData] = useState({
    clinic_name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    tax_id: "",
    opening_time: "08:00",
    closing_time: "18:00",
    working_days: [] as string[],
    timezone: "America/Bogota",
    currency: "COP",
    date_format: "DD/MM/YYYY",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        clinic_name: settings.clinic_name || "",
        address: settings.address || "",
        city: settings.city || "",
        phone: settings.phone || "",
        email: settings.email || "",
        website: settings.website || "",
        tax_id: settings.tax_id || "",
        opening_time: settings.opening_time || "08:00",
        closing_time: settings.closing_time || "18:00",
        working_days: settings.working_days || [],
        timezone: settings.timezone || "America/Bogota",
        currency: settings.currency || "COP",
        date_format: settings.date_format || "DD/MM/YYYY",
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  const toggleDay = (dayId: string) => {
    setFormData((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(dayId)
        ? prev.working_days.filter((d) => d !== dayId)
        : [...prev.working_days, dayId],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Información del Consultorio
          </CardTitle>
          <CardDescription>
            Configura los datos generales de tu consultorio dental
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clinic_name">Nombre del consultorio</Label>
                <Input
                  id="clinic_name"
                  value={formData.clinic_name}
                  onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                  disabled={!isAdmin}
                  placeholder="Clínica Dental Sonrisas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">NIT / RUT</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  disabled={!isAdmin}
                  placeholder="900123456-1"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isAdmin}
                  placeholder="Calle 50 #30-20, Consultorio 301"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!isAdmin}
                  placeholder="Medellín"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isAdmin}
                  placeholder="+57 604 123 4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isAdmin}
                  placeholder="contacto@clinica.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Sitio web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!isAdmin}
                  placeholder="https://www.clinica.com"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end">
                <Button type="submit" disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horarios de Atención
          </CardTitle>
          <CardDescription>
            Define los días y horarios de atención del consultorio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="opening_time">Hora de apertura</Label>
                <Input
                  id="opening_time"
                  type="time"
                  value={formData.opening_time}
                  onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing_time">Hora de cierre</Label>
                <Input
                  id="closing_time"
                  type="time"
                  value={formData.closing_time}
                  onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Días laborales</Label>
              <div className="flex flex-wrap gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={formData.working_days.includes(day.id)}
                      onCheckedChange={() => toggleDay(day.id)}
                      disabled={!isAdmin}
                    />
                    <Label htmlFor={day.id} className="font-normal cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona horaria</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Bogota">Colombia (GMT-5)</SelectItem>
                    <SelectItem value="America/Mexico_City">México (GMT-6)</SelectItem>
                    <SelectItem value="America/Lima">Perú (GMT-5)</SelectItem>
                    <SelectItem value="America/Buenos_Aires">Argentina (GMT-3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    <SelectItem value="PEN">PEN - Sol Peruano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_format">Formato de fecha</Label>
                <Select
                  value={formData.date_format}
                  onValueChange={(value) => setFormData({ ...formData, date_format: value })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end">
                <Button type="submit" disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {!isAdmin && (
        <p className="text-sm text-muted-foreground text-center">
          Solo los administradores pueden modificar la configuración del consultorio.
        </p>
      )}
    </div>
  );
}
