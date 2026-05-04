import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Loader2, ChevronsUpDown, Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateAppointment, useDoctors } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

const appointmentSchema = z.object({
  patient_id: z.string().optional(),
  is_emergency: z.boolean().default(false),
  emergency_name: z.string().optional(),
  emergency_phone: z.string().optional(),
  assigned_doctor_id: z.string().optional(),
  appointment_date: z.string().min(1, "Selecciona una fecha"),
  start_time: z.string().min(1, "Selecciona la hora de inicio"),
  end_time: z.string().min(1, "Selecciona la hora de fin"),
  treatment_type: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  // Si no es urgencia, requiere paciente
  if (!data.is_emergency && !data.patient_id) {
    return false;
  }
  // Si es urgencia, requiere nombre
  if (data.is_emergency && !data.emergency_name) {
    return false;
  }
  return true;
}, {
  message: "Selecciona un paciente o ingresa datos de urgencia",
  path: ["patient_id"],
}).refine((data) => {
  const appointmentDateTime = new Date(`${data.appointment_date}T${data.start_time}`);
  const now = new Date();
  return appointmentDateTime > now;
}, {
  message: "No se pueden agendar citas en fechas u horas pasadas",
  path: ["appointment_date"],
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const TREATMENT_TYPES = [
  "Limpieza Dental",
  "Blanqueamiento",
  "Extracción",
  "Endodoncia",
  "Ortodoncia",
  "Prótesis",
  "Implante",
  "Cirugía",
  "Control",
  "Valoración Inicial",
  "Urgencia",
  "Otro",
];

const TIME_SLOTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00",
];

interface NewAppointmentDialogProps {
  trigger?: React.ReactNode;
  defaultDate?: string;
  defaultTime?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

// Obtener fecha de hoy en formato YYYY-MM-DD
const getTodayString = () => format(new Date(), "yyyy-MM-dd");

// Filtrar slots de tiempo que ya pasaron si la fecha es hoy
const getAvailableTimeSlots = (selectedDate: string) => {
  const today = getTodayString();
  if (selectedDate !== today) return TIME_SLOTS;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return TIME_SLOTS.filter(slot => {
    const [hours, minutes] = slot.split(":").map(Number);
    return hours > currentHour || (hours === currentHour && minutes > currentMinute);
  });
};

export function NewAppointmentDialog({
  trigger,
  defaultDate,
  defaultTime,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess
}: NewAppointmentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  const createAppointment = useCreateAppointment();
  const { data: patients = [] } = usePatients();
  const { data: doctors = [] } = useDoctors();
  const { user } = useAuth();

  const today = getTodayString();

  const getEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endMinutes = minutes + 30;
    const endHours = hours + Math.floor(endMinutes / 60);
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  };

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: "",
      is_emergency: false,
      emergency_name: "",
      emergency_phone: "",
      assigned_doctor_id: "",
      appointment_date: defaultDate || format(new Date(), "yyyy-MM-dd"),
      start_time: defaultTime || "09:00",
      end_time: defaultTime ? getEndTime(defaultTime) : "09:30",
      treatment_type: "",
      notes: "",
    },
  });

  // Reset form when dialog opens with new defaults
  useState(() => {
    if (open && (defaultDate || defaultTime)) {
      form.reset({
        patient_id: "",
        is_emergency: false,
        emergency_name: "",
        emergency_phone: "",
        assigned_doctor_id: "",
        appointment_date: defaultDate || format(new Date(), "yyyy-MM-dd"),
        start_time: defaultTime || "09:00",
        end_time: defaultTime ? getEndTime(defaultTime) : "09:30",
        treatment_type: "",
        notes: "",
      });
    }
  });

  const selectedPatientId = form.watch("patient_id");
  const selectedDate = form.watch("appointment_date");
  const isEmergency = form.watch("is_emergency");
  const selectedPatient = useMemo(() =>
    patients.find(p => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );
  const availableTimeSlots = useMemo(() =>
    getAvailableTimeSlots(selectedDate),
    [selectedDate]
  );

  const onSubmit = async (data: AppointmentFormData) => {
    if (!user) return;

    try {
      await createAppointment.mutateAsync({
        patient_id: data.is_emergency ? null : (data.patient_id || null),
        doctor_id: user.id,
        assigned_doctor_id: data.assigned_doctor_id || null,
        appointment_date: data.appointment_date,
        start_time: data.start_time,
        end_time: data.end_time,
        treatment_type: data.treatment_type || (data.is_emergency ? "Urgencia" : null),
        notes: data.notes || null,
        emergency_name: data.is_emergency ? data.emergency_name : null,
        emergency_phone: data.is_emergency ? data.emergency_phone : null,
        status: "scheduled",
        attendance_status: "pending",
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Agendar Nueva Cita
          </DialogTitle>
          <DialogDescription>
            Completa los datos para programar una cita con el paciente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Emergency toggle */}
            <FormField
              control={form.control}
              name="is_emergency"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-warning/5 border-warning/20">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-warning font-medium">
                      Cita de urgencia (paciente sin registrar)
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Marca esta opción si el paciente no está registrado en el sistema
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Patient Selection - only if not emergency */}
            {!isEmergency && (
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Paciente *</FormLabel>
                    <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedPatient
                              ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                              : "Buscar paciente..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar por nombre o documento..." />
                          <CommandList>
                            <CommandEmpty>No se encontraron pacientes.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {patients.map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  value={`${patient.first_name} ${patient.last_name} ${patient.document_number}`}
                                  onSelect={() => {
                                    form.setValue("patient_id", patient.id);
                                    setPatientSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      patient.id === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div>
                                    <p className="font-medium">
                                      {patient.first_name} {patient.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {patient.document_type}: {patient.document_number}
                                    </p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Emergency patient fields - only if is emergency */}
            {isEmergency && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-warning/5 border border-warning/20">
                <FormField
                  control={form.control}
                  name="emergency_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Paciente *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="3001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Doctor Selection */}
            <FormField
              control={form.control}
              name="assigned_doctor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odontólogo Asignado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar odontólogo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.user_id} value={doctor.user_id}>
                          {doctor.full_name} {doctor.specialty && `(${doctor.specialty})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="appointment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
                  <FormControl>
                    <Input type="date" min={today} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Inicio *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-64">
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Fin *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-64">
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Treatment Type */}
            <FormField
              control={form.control}
              name="treatment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Tratamiento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tratamiento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TREATMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones adicionales..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAppointment.isPending}>
                {createAppointment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Agendar Cita"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
