import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppointments } from "@/hooks/useAppointments";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { NewAppointmentDialog } from "@/components/appointments/NewAppointmentDialog";

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
              <div className="min-w-[800px]">
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
                        {timeSlots.map((_, i) => (
                          <div
                            key={i}
                            className="h-12 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
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
                                "absolute left-1 right-1 rounded-lg p-2 cursor-pointer overflow-hidden",
                                statusColors[apt.status] || statusColors.scheduled
                              )}
                              style={{ top: `${top}px`, height: `${height}px` }}
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
    </MainLayout>
  );
};

export default Agenda;
