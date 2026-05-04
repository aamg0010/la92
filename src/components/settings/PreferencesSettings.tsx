import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Settings2, Save, Moon, Sun, Monitor, Bell, Volume2, Check } from "lucide-react";
import { useUserPreferences, useUpdateUserPreferences } from "@/hooks/useSettings";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "next-themes";

export function PreferencesSettings() {
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreferences = useUpdateUserPreferences();
  const { theme: currentTheme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    theme: "system",
    language: "es",
    notifications_enabled: true,
    email_notifications: true,
    sound_enabled: true,
    compact_mode: false,
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        theme: preferences.theme || "system",
        language: preferences.language || "es",
        notifications_enabled: preferences.notifications_enabled ?? true,
        email_notifications: preferences.email_notifications ?? true,
        sound_enabled: preferences.sound_enabled ?? true,
        compact_mode: preferences.compact_mode ?? false,
      });
      // Aplicar tema guardado
      if (preferences.theme) {
        setTheme(preferences.theme);
      }
    }
  }, [preferences, setTheme]);

  const handleThemeChange = (newTheme: string) => {
    setFormData({ ...formData, theme: newTheme });
    setTheme(newTheme); // Aplicar inmediatamente
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences.mutate(formData);
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
            <Settings2 className="w-5 h-5" />
            Apariencia
          </CardTitle>
          <CardDescription>
            Personaliza cómo se ve la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Tema de la aplicación</Label>
              <RadioGroup
                value={formData.theme}
                onValueChange={handleThemeChange}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="light"
                    id="theme-light"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="theme-light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Sun className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Claro</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="dark"
                    id="theme-dark"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="theme-dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Moon className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Oscuro</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="system"
                    id="theme-system"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="theme-system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Monitor className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Sistema</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo compacto</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce el espaciado para mostrar más contenido
                </p>
              </div>
              <Switch
                checked={formData.compact_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, compact_mode: checked })}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updatePreferences.isPending}>
                {updatePreferences.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo y cuándo quieres recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones en la app</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe alertas sobre citas, pagos y más
                </p>
              </div>
              <Switch
                checked={formData.notifications_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, notifications_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones por email</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe un resumen diario por correo electrónico
                </p>
              </div>
              <Switch
                checked={formData.email_notifications}
                onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <Label>Sonidos</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reproduce sonidos para nuevas notificaciones
                </p>
              </div>
              <Switch
                checked={formData.sound_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, sound_enabled: checked })}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updatePreferences.isPending}>
                {updatePreferences.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
