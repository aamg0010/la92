import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Loader2,
  Trash2,
  X,
  Eye,
  Phone,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppointments, useDeleteAppointment, useUpdateAttendance, type Appointment } from "@/hooks/useAppointments";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { es } from "date-fns/locale";
import { NewAppointmentDialog } from "@/components/appointments/NewAppointmentDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00"
];

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const statusColors: Record<string, string> = {
  scheduled: "calendar-event-primary",
  confirmed: "calendar-event-primary",
  pending: "calendar-event-accent",
  "in-progress": "calendar-event-success",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const Agenda = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [view, setView] = useState<"week" | "day">("week");
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newAppointmentData, setNewAppointmentData] = useState<{ date: string; time: string } | null>(null);

  const deleteAppointment = useDeleteAppointment();
  const updateAttendance = useUpdateAttendance();

  const weekStart = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return start;
  }, [currentWeek]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const startDate = format(weekDates[0], "yyyy-MM-dd");
  const endDate = format(weekDates[5], "yyyy-MM-dd");

  const { data: appointments, isLoading } = useAppointments(startDate, endDate);

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeek(prev => addDays(prev, direction === "prev" ? -7 : 7));
  };

  const getAppointmentPosition = (startTime: string, endTime: string) => {
    const startIndex = timeSlots.indexOf(startTime.slice(0, 5));
    const endIndex = timeSlots.indexOf(endTime.slice(0, 5));
    const duration = endIndex - startIndex;
    
    return {
      top: startIndex * 48,
      height: Math.max(duration, 1) * 48 - 4,
    };
  };

  const getAppointmentsForDay = (date: Date) => {
    if (!appointments) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    await deleteAppointment.mutateAsync(appointmentToDelete.id);
    setAppointmentToDelete(null);
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 h-[calc(100vh-2rem)]">
        <div className="card-elevated h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                Agenda
              </h1>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button 
                  variant={view === "day" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setView("day")}
                  className="text-xs"
                >
                  Día
                </Button>
                <Button 
                  variant={view === "week" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setView("week")}
                  className="text-xs"
                >
                  Semana
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateWeek("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[180px] text-center">
                  {format(weekDates[0], "d MMM", { locale: es })} - {format(weekDates[5], "d MMM yyyy", { locale: es })}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateWeek("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <NewAppointmentDialog
                trigger={
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Cita
                  </Button>
                }
              />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-auto scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="min-w-[600px] lg:min-w-[800px]">
                {/* Day Headers */}
                <div className="grid grid-cols-[80px_repeat(6,1fr)] sticky top-0 bg-card z-10 border-b border-border">
                  <div className="p-3" />
                  {weekDates.map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={i}
                        className={cn(
                          "p-3 text-center border-l border-border",
                          isToday && "bg-primary/5"
                        )}
                      >
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          {weekDays[i]}
                        </p>
                        <p className={cn(
                          "text-xl font-semibold mt-1",
                          isToday ? "text-primary" : "text-foreground"
                        )}>
                          {date.getDate()}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Time Grid */}
                <div className="grid grid-cols-[80px_repeat(6,1fr)] relative">
                  {/* Time Labels */}
                  <div className="border-r border-border">
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="h-12 flex items-start justify-end pr-3 -mt-2 text-xs text-muted-foreground"
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  {weekDates.map((date, dayIndex) => {
                    const dayAppointments = getAppointmentsForDay(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "relative border-l border-border",
                          isToday && "bg-primary/5"
                        )}
                      >
                        {/* Hour Lines */}
                        {timeSlots.map((time, i) => (
                          <div
                            key={i}
                            className="h-12 border-b border-border/50 hover:bg-primary/10 transition-colors cursor-pointer"
                            onClick={() => {
                              const dateStr = format(date, "yyyy-MM-dd");
                              setNewAppointmentData({ date: dateStr, time });
                            }}
                            title={`Crear cita: ${format(date, "d MMM", { locale: es })} a las ${time}`}
                          />
                        ))}

                        {/* Appointments */}
                        {dayAppointments.map((apt) => {
                          const { top, height } = getAppointmentPosition(apt.start_time, apt.end_time);
                          const patientName = apt.patient 
                            ? `${apt.patient.first_name} ${apt.patient.last_name}`
                            : "Paciente";
                          const initials = patientName.split(' ').map(n => n[0]).join('').slice(0, 2);
                          
                          return (
                            <div
                              key={apt.id}
                              className={cn(
                                "absolute left-1 right-1 rounded-lg p-2 cursor-pointer overflow-hidden group",
                                statusColors[apt.status] || statusColors.scheduled
                              )}
                              style={{ top: `${top}px`, height: `${height}px` }}
                              onClick={() => setSelectedAppointment(apt)}
                            >
                              <div className="flex items-start gap-2">
                                <Avatar className="w-6 h-6 shrink-0">
                                  <AvatarFallback className="text-[10px] bg-card">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-xs truncate">
                                    {patientName}
                                  </p>
                                  <p className="text-[10px] opacity-80 truncate">
                                    {apt.treatment_type || "Consulta"}
                                  </p>
                                  <p className="text-[10px] opacity-70 mt-0.5">
                                    {apt.start_time.slice(0, 5)}
                                  </p>
                                </div>
                                {/* Botón eliminar - visible on hover */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAppointmentToDelete(apt);
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                                  title="Eliminar cita"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!appointmentToDelete} onOpenChange={(open) => !open && setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cita</AlertDialogTitle>
            <AlertDialogDescription>
              {appointmentToDelete && (
                <>
                  ¿Estás seguro de que deseas eliminar la cita de{" "}
                  <strong>
                    {appointmentToDelete.patient
                      ? `${appointmentToDelete.patient.first_name} ${appointmentToDelete.patient.last_name}`
                      : "este paciente"}
                  </strong>{" "}
                  programada para el{" "}
                  <strong>
                    {format(new Date(appointmentToDelete.appointment_date), "d 'de' MMMM", { locale: es })}
                  </strong>{" "}
                  a las <strong>{appointmentToDelete.start_time.slice(0, 5)}</strong>?
                  <br /><br />
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAppointment.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de detalle de cita */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Detalle de la Cita
            </DialogTitle>
            <DialogDescription>
              Información completa de la cita programada
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Información del paciente */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {selectedAppointment.emergency_name ? "Paciente (Urgencia)" : "Paciente"}
                </h4>
                <p className="text-lg font-medium">
                  {selectedAppointment.patient
                    ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}`
                    : selectedAppointment.emergency_name || "Paciente no especificado"}
                </p>
                {(selectedAppointment.patient?.phone || selectedAppointment.emergency_phone) && (
                  <a
                    href={`https://wa.me/${(selectedAppointment.patient?.phone || selectedAppointment.emergency_phone || '').replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#25D366] hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {selectedAppointment.patient?.phone || selectedAppointment.emergency_phone}
                  </a>
                )}
                {selectedAppointment.emergency_name && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                    Urgencia - Paciente sin registrar
                  </Badge>
                )}
              </div>

              {/* Estado de asistencia */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Marcar Asistencia
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedAppointment.attendance_status === "attended" ? "default" : "outline"}
                    className={selectedAppointment.attendance_status === "attended" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => {
                      updateAttendance.mutate({ id: selectedAppointment.id, attendance_status: "attended" });
                      setSelectedAppointment({ ...selectedAppointment, attendance_status: "attended" });
                    }}
                    disabled={updateAttendance.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Asistió
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedAppointment.attendance_status === "no_show" ? "default" : "outline"}
                    className={selectedAppointment.attendance_status === "no_show" ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => {
                      updateAttendance.mutate({ id: selectedAppointment.id, attendance_status: "no_show" });
                      setSelectedAppointment({ ...selectedAppointment, attendance_status: "no_show" });
                    }}
                    disabled={updateAttendance.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    No Asistió
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedAppointment.attendance_status === "cancelled" ? "default" : "outline"}
                    className={selectedAppointment.attendance_status === "cancelled" ? "bg-gray-600 hover:bg-gray-700" : ""}
                    onClick={() => {
                      updateAttendance.mutate({ id: selectedAppointment.id, attendance_status: "cancelled" });
                      setSelectedAppointment({ ...selectedAppointment, attendance_status: "cancelled" });
                    }}
                    disabled={updateAttendance.isPending}
                  >
                    Cancelada
                  </Button>
                </div>
              </div>

              {/* Fecha y hora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Fecha</p>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.appointment_date), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Hora</p>
                  <p className="font-medium">
                    {selectedAppointment.start_time.slice(0, 5)} - {selectedAppointment.end_time.slice(0, 5)}
                  </p>
                </div>
              </div>

              {/* Tratamiento */}
              {selectedAppointment.treatment_type && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase">Tratamiento</p>
                  <p className="font-medium text-primary">{selectedAppointment.treatment_type}</p>
                </div>
              )}

              {/* Notas */}
              {selectedAppointment.notes && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Notas</p>
                  <p className="text-sm mt-1">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedAppointment(null);
                    // TODO: Abrir dialog de edición
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => {
                    setAppointmentToDelete(selectedAppointment);
                    setSelectedAppointment(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de nueva cita con fecha/hora preset */}
      <NewAppointmentDialog
        open={!!newAppointmentData}
        onOpenChange={(open) => !open && setNewAppointmentData(null)}
        defaultDate={newAppointmentData?.date}
        defaultTime={newAppointmentData?.time}
        onSuccess={() => setNewAppointmentData(null)}
      />
    </MainLayout>
  );
};

export default Agenda;
