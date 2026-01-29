import { Clock, User, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patientName: string;
  patientAvatar?: string;
  time: string;
  duration: string;
  treatment: string;
  status: "confirmed" | "pending" | "in-progress" | "completed";
}

const statusConfig = {
  confirmed: { label: "Confirmada", className: "status-confirmed" },
  pending: { label: "Pendiente", className: "status-pending" },
  "in-progress": { label: "En curso", className: "bg-primary/10 text-primary border border-primary/20" },
  completed: { label: "Completada", className: "bg-muted text-muted-foreground" },
};

const appointments: Appointment[] = [
  {
    id: "1",
    patientName: "Carlos Mendoza",
    patientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    time: "09:00",
    duration: "30 min",
    treatment: "Limpieza dental",
    status: "completed",
  },
  {
    id: "2",
    patientName: "Ana Lucía Torres",
    patientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    time: "10:00",
    duration: "1 hora",
    treatment: "Blanqueamiento",
    status: "in-progress",
  },
  {
    id: "3",
    patientName: "Roberto Jiménez",
    patientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    time: "11:30",
    duration: "45 min",
    treatment: "Extracción molar",
    status: "confirmed",
  },
  {
    id: "4",
    patientName: "María Fernanda Ruiz",
    time: "14:00",
    duration: "30 min",
    treatment: "Revisión ortodoncia",
    status: "pending",
  },
  {
    id: "5",
    patientName: "José García López",
    patientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
    time: "15:30",
    duration: "1 hora",
    treatment: "Endodoncia",
    status: "confirmed",
  },
];

export function TodayAppointments() {
  return (
    <div className="card-elevated p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Citas de Hoy
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-sm">
          Ver agenda completa
        </Button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
        {appointments.map((apt, index) => (
          <div
            key={apt.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all cursor-pointer group",
              apt.status === "in-progress" && "ring-2 ring-primary/30 bg-primary/5"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Avatar className="w-11 h-11">
              <AvatarImage src={apt.patientAvatar} alt={apt.patientName} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
                {apt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">
                  {apt.patientName}
                </p>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs shrink-0", statusConfig[apt.status].className)}
                >
                  {statusConfig[apt.status].label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {apt.treatment}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-foreground font-medium">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {apt.time}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{apt.duration}</p>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
