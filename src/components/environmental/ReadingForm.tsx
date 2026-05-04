/**
 * ReadingForm.tsx
 * Formulario para registrar lecturas de temperatura y humedad
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Thermometer, Droplets, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserRole";
import {
  useCreateReading,
  useUpdateReading,
  type EnvironmentalReading,
  type Shift,
  SHIFTS,
  NORMAL_RANGES,
  isTemperatureNormal,
  isHumidityNormal,
  getCurrentShift,
} from "@/hooks/useEnvironmentalMonitoring";

// Opciones de responsable
const RESPONSIBLE_OPTIONS = [
  { value: "Recepcionista", label: "Recepcionista" },
  { value: "Odontólogo", label: "Odontólogo" },
] as const;

// Calcular turno automáticamente según la hora
function getShiftFromTime(time: string): Shift {
  if (!time) return "AM";
  const [hours] = time.split(":").map(Number);
  // 06:00-11:59 = AM, 12:00-20:00 = PM
  if (hours >= 6 && hours < 12) return "AM";
  return "PM";
}

interface ReadingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reading?: EnvironmentalReading | null;
}

export function ReadingForm({ open, onOpenChange, reading }: ReadingFormProps) {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const createReading = useCreateReading();
  const updateReading = useUpdateReading();

  const isEditing = !!reading;
  const today = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const [formData, setFormData] = useState({
    reading_date: today,
    reading_time: currentTime,
    shift: getShiftFromTime(currentTime) as Shift,
    temperature: "",
    humidity: "",
    user_name: "Recepcionista",
    notes: "",
  });

  // Reset form when dialog opens/closes or reading changes
  useEffect(() => {
    if (open) {
      if (reading) {
        setFormData({
          reading_date: reading.reading_date,
          reading_time: reading.reading_time.slice(0, 5), // Remove seconds
          shift: reading.shift,
          temperature: String(reading.temperature),
          humidity: String(reading.humidity),
          user_name: reading.user_name,
          notes: reading.notes || "",
        });
      } else {
        setFormData({
          reading_date: today,
          reading_time: currentTime,
          shift: getShiftFromTime(currentTime),
          temperature: "",
          humidity: "",
          user_name: "Recepcionista",
          notes: "",
        });
      }
    }
  }, [open, reading, profile, user, today, currentTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      reading_date: formData.reading_date,
      reading_time: formData.reading_time,
      shift: formData.shift,
      temperature: parseFloat(formData.temperature),
      humidity: parseFloat(formData.humidity),
      user_name: formData.user_name,
      user_id: user?.id,
      notes: formData.notes || undefined,
    };

    if (isEditing && reading) {
      await updateReading.mutateAsync({ id: reading.id, data });
    } else {
      await createReading.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const temperatureValue = parseFloat(formData.temperature);
  const humidityValue = parseFloat(formData.humidity);
  const tempNormal = !isNaN(temperatureValue) && isTemperatureNormal(temperatureValue);
  const humidityNormal = !isNaN(humidityValue) && isHumidityNormal(humidityValue);

  const isLoading = createReading.isPending || updateReading.isPending;
  const isValid =
    formData.reading_date &&
    formData.reading_time &&
    formData.shift &&
    formData.temperature &&
    formData.humidity &&
    formData.user_name &&
    !isNaN(temperatureValue) &&
    !isNaN(humidityValue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            {isEditing ? "Editar Lectura" : "Registrar Lectura Ambiental"}
          </DialogTitle>
          <DialogDescription>
            Registra la temperatura y humedad del consultorio. Rango normal: Temp. 18-24 C, Humedad
            40-60%.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reading_date">Fecha</Label>
              <Input
                id="reading_date"
                type="date"
                value={formData.reading_date}
                onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
                max={today}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reading_time">Hora</Label>
              <Input
                id="reading_time"
                type="time"
                value={formData.reading_time}
                onChange={(e) => {
                  const newTime = e.target.value;
                  const newShift = getShiftFromTime(newTime);
                  setFormData({ ...formData, reading_time: newTime, shift: newShift });
                }}
                required
              />
            </div>
          </div>

          {/* Shift (calculado automáticamente) */}
          <div className="space-y-2">
            <Label>Turno (automático según hora)</Label>
            <div className="flex items-center gap-2">
              <Badge variant={formData.shift === "AM" ? "default" : "secondary"} className="text-sm px-3 py-1">
                {formData.shift} - {SHIFTS[formData.shift].label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ({SHIFTS[formData.shift].timeRange})
              </span>
            </div>
          </div>

          {/* Temperature and Humidity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature" className="flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                Temperatura (C)
              </Label>
              <div className="relative">
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="-10"
                  max="50"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  className={cn(
                    "pr-12",
                    formData.temperature &&
                      (tempNormal
                        ? "border-green-500 focus-visible:ring-green-500"
                        : "border-red-500 focus-visible:ring-red-500")
                  )}
                  placeholder="22.5"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  C
                </span>
              </div>
              {formData.temperature && (
                <div className="flex items-center gap-1 text-xs">
                  {tempNormal ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-green-600">Normal</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span className="text-red-600">
                        Fuera de rango ({NORMAL_RANGES.temperature.min}-
                        {NORMAL_RANGES.temperature.max} C)
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="humidity" className="flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Humedad (%)
              </Label>
              <div className="relative">
                <Input
                  id="humidity"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.humidity}
                  onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                  className={cn(
                    "pr-12",
                    formData.humidity &&
                      (humidityNormal
                        ? "border-green-500 focus-visible:ring-green-500"
                        : "border-red-500 focus-visible:ring-red-500")
                  )}
                  placeholder="50.0"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
              {formData.humidity && (
                <div className="flex items-center gap-1 text-xs">
                  {humidityNormal ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-green-600">Normal</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span className="text-red-600">
                        Fuera de rango ({NORMAL_RANGES.humidity.min}-{NORMAL_RANGES.humidity.max}%)
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Responsible Person */}
          <div className="space-y-2">
            <Label htmlFor="user_name">Responsable</Label>
            <Select
              value={formData.user_name}
              onValueChange={(v) => setFormData({ ...formData, user_name: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona responsable" />
              </SelectTrigger>
              <SelectContent>
                {RESPONSIBLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej: Se ajusto el termostato, ventana abierta, etc."
              rows={2}
            />
          </div>

          {/* Status Preview */}
          {formData.temperature && formData.humidity && (
            <div
              className={cn(
                "p-3 rounded-lg border",
                tempNormal && humidityNormal
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado de la lectura:</span>
                <Badge variant={tempNormal && humidityNormal ? "default" : "destructive"}>
                  {tempNormal && humidityNormal ? "Normal" : "Fuera de rango"}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !isValid}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Registrar Lectura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
