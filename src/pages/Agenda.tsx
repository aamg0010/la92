import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MoreHorizontal,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00"
];

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Appointment {
  id: string;
  patientName: string;
  patientAvatar?: string;
  treatment: string;
  startTime: string;
  duration: number; // in 30min slots
  status: "confirmed" | "pending" | "in-progress";
  day: number; // 0-5 for Mon-Sat
}

const appointments: Appointment[] = [
  {
    id: "1",
    patientName: "Carlos Mendoza",
    patientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    treatment: "Limpieza dental",
    startTime: "09:00",
    duration: 2,
    status: "confirmed",
    day: 0,
  },
  {
    id: "2",
    patientName: "Ana Lucía Torres",
    patientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    treatment: "Blanqueamiento",
    startTime: "10:00",
    duration: 4,
    status: "in-progress",
    day: 0,
  },
  {
    id: "3",
    patientName: "Roberto Jiménez",
    patientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    treatment: "Extracción",
    startTime: "14:00",
    duration: 3,
    status: "pending",
    day: 0,
  },
  {
    id: "4",
    patientName: "María Ruiz",
    treatment: "Ortodoncia",
    startTime: "09:30",
    duration: 2,
    status: "confirmed",
    day: 1,
  },
  {
    id: "5",
    patientName: "José García",
    patientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    treatment: "Endodoncia",
    startTime: "11:00",
    duration: 4,
    status: "confirmed",
    day: 2,
  },
  {
    id: "6",
    patientName: "Laura Martínez",
    patientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    treatment: "Revisión",
    startTime: "15:00",
    duration: 2,
    status: "pending",
    day: 3,
  },
  {
    id: "7",
    patientName: "Pedro Sánchez",
    treatment: "Implante",
    startTime: "10:00",
    duration: 6,
    status: "confirmed",
    day: 4,
  },
];

const statusColors = {
  confirmed: "calendar-event-primary",
  pending: "calendar-event-accent",
  "in-progress": "calendar-event-success",
};

const Agenda = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [view, setView] = useState<"week" | "day">("week");

  const getWeekDates = () => {
    const start = new Date(currentWeek);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();

  const getAppointmentPosition = (apt: Appointment) => {
    const timeIndex = timeSlots.indexOf(apt.startTime);
    return {
      top: timeIndex * 48, // 48px per slot
      height: apt.duration * 48 - 4,
    };
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
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[140px] text-center">
                  {weekDates[0].toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - {weekDates[5].toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cita
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-auto scrollbar-thin">
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
                  {timeSlots.map((time, i) => (
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
                  const dayAppointments = appointments.filter(apt => apt.day === dayIndex);
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
                        const { top, height } = getAppointmentPosition(apt);
                        return (
                          <div
                            key={apt.id}
                            className={cn(
                              "absolute left-1 right-1 rounded-lg p-2 cursor-pointer overflow-hidden",
                              statusColors[apt.status]
                            )}
                            style={{ top: `${top}px`, height: `${height}px` }}
                          >
                            <div className="flex items-start gap-2">
                              <Avatar className="w-6 h-6 shrink-0">
                                <AvatarImage src={apt.patientAvatar} />
                                <AvatarFallback className="text-[10px] bg-card">
                                  {apt.patientName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs truncate">
                                  {apt.patientName}
                                </p>
                                <p className="text-[10px] opacity-80 truncate">
                                  {apt.treatment}
                                </p>
                                <p className="text-[10px] opacity-70 mt-0.5">
                                  {apt.startTime}
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Agenda;
