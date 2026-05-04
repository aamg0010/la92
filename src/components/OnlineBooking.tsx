import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Sparkles,
  MessageCircle
} from "lucide-react";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// Servicios disponibles para agendar
const bookingServices = [
  { id: "limpieza", name: "Limpieza Dental", duration: 30 },
  { id: "blanqueamiento", name: "Blanqueamiento", duration: 60 },
  { id: "consulta", name: "Consulta General", duration: 30 },
  { id: "ortodoncia", name: "Consulta Ortodoncia", duration: 45 },
  { id: "diseno", name: "Valoración Diseño de Sonrisa", duration: 45 },
  { id: "otro", name: "Otro tratamiento", duration: 30 },
];

// Horarios de atención
const OPENING_HOUR = 9;
const CLOSING_HOUR = 18;
const SLOT_DURATION = 30; // minutos

// Generar slots de tiempo
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

// Formatear fecha para mostrar
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  };
  return date.toLocaleDateString('es-CO', options);
}

// Obtener días disponibles (próximas 2 semanas, sin domingos)
function getAvailableDays(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Excluir domingos (0)
    if (date.getDay() !== 0) {
      // Los sábados solo hasta las 12pm (se maneja en los slots)
      days.push(date);
    }
  }
  return days;
}

// WhatsApp URL para confirmación
const WHATSAPP_BASE = "https://wa.me/573206433524";

interface OnlineBookingProps {
  onClose?: () => void;
}

export default function OnlineBooking({ onClose }: OnlineBookingProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"date" | "time" | "service" | "info" | "confirm">("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  const availableDays = useMemo(() => getAvailableDays(), []);
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // Obtener citas existentes para la fecha seleccionada
  const { data: existingAppointments } = useQuery({
    queryKey: ["appointments", "public", selectedDate?.toISOString().split("T")[0]],
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateStr = selectedDate.toISOString().split("T")[0];
      const { data, error } = await api
        .from<{ start_time: string; end_time: string }>("appointments")
        .select("start_time, end_time")
        .eq("appointment_date", dateStr)
        .neq("status", "cancelled");

      if (error) {
        console.error("Error fetching appointments:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!selectedDate,
  });

  // Filtrar slots ocupados
  const availableSlots = useMemo(() => {
    if (!selectedDate) return timeSlots;

    const isSaturday = selectedDate.getDay() === 6;
    let slots = timeSlots;

    // Sábados solo hasta las 12pm
    if (isSaturday) {
      slots = slots.filter(slot => {
        const hour = parseInt(slot.split(":")[0]);
        return hour < 12;
      });
    }

    // Filtrar slots ocupados
    if (existingAppointments && existingAppointments.length > 0) {
      slots = slots.filter(slot => {
        const slotTime = slot;
        return !existingAppointments.some(apt => {
          const startTime = apt.start_time.substring(0, 5);
          const endTime = apt.end_time.substring(0, 5);
          return slotTime >= startTime && slotTime < endTime;
        });
      });
    }

    return slots;
  }, [selectedDate, timeSlots, existingAppointments]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !formData.name || !formData.phone) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa todos los campos.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const serviceName = bookingServices.find(s => s.id === selectedService)?.name || selectedService;
      const dateStr = selectedDate.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const message = `SOLICITUD DE CITA ONLINE\n\nFecha: ${dateStr}\nHora: ${selectedTime}\nServicio: ${serviceName}\n\nPendiente de confirmación.`;

      const { error } = await api.from("contact_messages").insert({
        name: formData.name.trim(),
        email: `${formData.phone.trim().replace(/\s/g, "")}@booking.la92.com`,
        phone: formData.phone.trim(),
        subject: `Cita Online: ${formatDate(selectedDate)} ${selectedTime} - ${serviceName}`,
        message: message
      });

      if (error) throw error;

      setBookingComplete(true);
      toast({
        title: "¡Solicitud enviada!",
        description: "Te contactaremos para confirmar tu cita."
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud. Intenta por WhatsApp.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppConfirmUrl = () => {
    if (!selectedDate || !selectedTime || !selectedService) return WHATSAPP_BASE;
    const serviceName = bookingServices.find(s => s.id === selectedService)?.name || selectedService;
    const dateStr = formatDate(selectedDate);
    const text = encodeURIComponent(
      `Hola, quiero confirmar mi cita:\n📅 ${dateStr}\n🕐 ${selectedTime}\n💊 ${serviceName}\n👤 ${formData.name}\n📱 ${formData.phone}`
    );
    return `${WHATSAPP_BASE}?text=${text}`;
  };

  const goBack = () => {
    if (step === "time") setStep("date");
    else if (step === "service") setStep("time");
    else if (step === "info") setStep("service");
    else if (step === "confirm") setStep("info");
  };

  const goNext = () => {
    if (step === "date" && selectedDate) setStep("time");
    else if (step === "time" && selectedTime) setStep("service");
    else if (step === "service" && selectedService) setStep("info");
    else if (step === "info" && formData.name && formData.phone) setStep("confirm");
  };

  if (bookingComplete) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white dark:bg-slate-900">
        <CardContent className="pt-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">¡Solicitud Recibida!</h3>
          <p className="text-muted-foreground mb-6">
            Te contactaremos pronto para confirmar tu cita del{" "}
            <strong>{selectedDate && formatDate(selectedDate)}</strong> a las{" "}
            <strong>{selectedTime}</strong>.
          </p>

          <div className="space-y-3">
            <a href={getWhatsAppConfirmUrl()} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full gap-2 bg-green-500 hover:bg-green-600">
                <MessageCircle className="w-4 h-4" />
                Confirmar por WhatsApp
              </Button>
            </a>
            <Button variant="outline" onClick={() => {
              setBookingComplete(false);
              setStep("date");
              setSelectedDate(null);
              setSelectedTime(null);
              setSelectedService(null);
              setFormData({ name: "", phone: "" });
            }}>
              Agendar otra cita
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-slate-900">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Agenda Online</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">24/7</Badge>
        </div>
        <CardDescription>
          {step === "date" && "Selecciona una fecha"}
          {step === "time" && "Selecciona un horario"}
          {step === "service" && "¿Qué servicio necesitas?"}
          {step === "info" && "Tus datos de contacto"}
          {step === "confirm" && "Confirma tu cita"}
        </CardDescription>

        {/* Progress indicator */}
        <div className="flex gap-1 mt-3">
          {["date", "time", "service", "info", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                ["date", "time", "service", "info", "confirm"].indexOf(step) >= i
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step 1: Date Selection */}
        {step === "date" && (
          <div className="grid grid-cols-3 gap-2">
            {availableDays.slice(0, 12).map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  selectedDate?.toDateString() === date.toDateString()
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString('es-CO', { weekday: 'short' })}
                </div>
                <div className="text-lg font-semibold">{date.getDate()}</div>
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString('es-CO', { month: 'short' })}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Time Selection */}
        {step === "time" && (
          <div>
            <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {selectedDate && formatDate(selectedDate)}
              {selectedDate?.getDay() === 6 && (
                <Badge variant="outline" className="text-xs">Sábado: hasta 12pm</Badge>
              )}
            </div>

            {availableSlots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hay horarios disponibles este día</p>
                <Button variant="link" onClick={() => setStep("date")}>
                  Elegir otra fecha
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      selectedTime === time
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Service Selection */}
        {step === "service" && (
          <div className="space-y-2">
            {bookingServices.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                  selectedService === service.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Sparkles className={`w-5 h-5 ${
                  selectedService === service.id ? "text-primary" : "text-muted-foreground"
                }`} />
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ~{service.duration} min
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 4: Contact Info */}
        {step === "info" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking-name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombre completo
              </Label>
              <Input
                id="booking-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                WhatsApp / Teléfono
              </Label>
              <Input
                id="booking-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="320 643 3524"
              />
            </div>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha:</span>
                <span className="font-medium">{selectedDate && formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hora:</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servicio:</span>
                <span className="font-medium">
                  {bookingServices.find(s => s.id === selectedService)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="font-medium">{formData.phone}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Te contactaremos para confirmar disponibilidad
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 pt-2">
          {step !== "date" && (
            <Button variant="outline" onClick={goBack} className="gap-1">
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </Button>
          )}

          {step !== "confirm" ? (
            <Button
              className="flex-1 gap-1"
              onClick={goNext}
              disabled={
                (step === "date" && !selectedDate) ||
                (step === "time" && !selectedTime) ||
                (step === "service" && !selectedService) ||
                (step === "info" && (!formData.name || !formData.phone))
              }
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              className="flex-1 gap-2 bg-green-500 hover:bg-green-600"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Cita
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
