import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Clock,
  MapPin,
  Shield,
  TrendingUp,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useTimeTrackingSettings, TimeTrackingSettings } from '@/hooks/useTimeTracking';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface TimeSettingsPanelProps {
  className?: string;
}

export function TimeSettingsPanel({ className }: TimeSettingsPanelProps) {
  const { user } = useAuth();
  const { settings, isLoading, error, updateSettings, isUpdating } = useTimeTrackingSettings();

  const [formData, setFormData] = useState<Partial<TimeTrackingSettings>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Inicializar formulario cuando llegan los settings
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Solo admins pueden ver este panel
  if (user?.role !== 'admin') {
    return null;
  }

  const handleChange = (field: keyof TimeTrackingSettings, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    try {
      setSaveError(null);
      await updateSettings(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error instanceof Error ? error.message : 'Error al cargar configuracion'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuracion de Fichaje
        </CardTitle>
        <CardDescription>
          Configura las reglas y parametros del control horario para tu clinica
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Horario laboral */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium mb-4">
            <Clock className="h-4 w-4" />
            Horario Laboral Estandar
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="work_start_time">Hora de entrada</Label>
              <Input
                id="work_start_time"
                type="time"
                value={formData.work_start_time || '09:00'}
                onChange={(e) => handleChange('work_start_time', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_end_time">Hora de salida</Label>
              <Input
                id="work_end_time"
                type="time"
                value={formData.work_end_time || '18:00'}
                onChange={(e) => handleChange('work_end_time', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break_duration_minutes">Duracion pausa (min)</Label>
              <Input
                id="break_duration_minutes"
                type="number"
                min="0"
                max="180"
                value={formData.break_duration_minutes || 60}
                onChange={(e) => handleChange('break_duration_minutes', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Tolerancias */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Tolerancias
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="late_tolerance_minutes">
                Tolerancia llegada tarde (min)
              </Label>
              <Input
                id="late_tolerance_minutes"
                type="number"
                min="0"
                max="60"
                value={formData.late_tolerance_minutes || 10}
                onChange={(e) => handleChange('late_tolerance_minutes', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minutos de margen antes de marcar como llegada tarde
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="early_leave_tolerance_minutes">
                Tolerancia salida anticipada (min)
              </Label>
              <Input
                id="early_leave_tolerance_minutes"
                type="number"
                min="0"
                max="60"
                value={formData.early_leave_tolerance_minutes || 10}
                onChange={(e) => handleChange('early_leave_tolerance_minutes', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minutos de margen antes de marcar como salida anticipada
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Horas extra */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium mb-4">
            <TrendingUp className="h-4 w-4" />
            Horas Extra
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overtime_threshold_daily_hours">
                Umbral diario (horas)
              </Label>
              <Input
                id="overtime_threshold_daily_hours"
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={formData.overtime_threshold_daily_hours || 8}
                onChange={(e) => handleChange('overtime_threshold_daily_hours', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Horas trabajadas a partir de las cuales se consideran extra
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtime_threshold_weekly_hours">
                Umbral semanal (horas)
              </Label>
              <Input
                id="overtime_threshold_weekly_hours"
                type="number"
                min="1"
                max="168"
                step="0.5"
                value={formData.overtime_threshold_weekly_hours || 40}
                onChange={(e) => handleChange('overtime_threshold_weekly_hours', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Opciones de seguridad */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium mb-4">
            <MapPin className="h-4 w-4" />
            Seguridad y Validacion
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requerir geolocalizacion</Label>
                <p className="text-xs text-muted-foreground">
                  Solicitar ubicacion GPS al fichar
                </p>
              </div>
              <Switch
                checked={formData.require_geolocation || false}
                onCheckedChange={(checked) => handleChange('require_geolocation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir entradas manuales</Label>
                <p className="text-xs text-muted-foreground">
                  Permitir registrar fichajes manualmente
                </p>
              </div>
              <Switch
                checked={formData.allow_manual_entries ?? true}
                onCheckedChange={(checked) => handleChange('allow_manual_entries', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requerir aprobacion de manager</Label>
                <p className="text-xs text-muted-foreground">
                  Las entradas manuales requieren aprobacion
                </p>
              </div>
              <Switch
                checked={formData.require_manager_approval || false}
                onCheckedChange={(checked) => handleChange('require_manager_approval', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Boton guardar */}
        <div className="flex items-center justify-between">
          <div>
            {saveStatus === 'success' && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Configuracion guardada
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {saveError || 'Error al guardar'}
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
