import { Clock, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppointmentsByDate } from "@/hooks/useAppointments";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendada", className: "bg-muted text-muted-foreground" },
  confirmed: { label: "Confirmada", className: "status-confirmed" },
  pending: { label: "Pendiente", className: "status-pending" },
  "in-progress": { label: "En curso", className: "bg-primary/10 text-primary border border-primary/20" },
  completed: { label: "Completada", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
  "no-show": { label: "No asistió", className: "bg-destructive/10 text-destructive" },
};

export function TodayAppointments() {
  const today = new Date().toISOString().split("T")[0];
  const { data: appointments, isLoading } = useAppointmentsByDate(today);
  const navigate = useNavigate();

  const queryKeys = useMemo(() => [["appointments"]], []);
  useRealtimeSubscription("appointments", queryKeys);

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
        <Button variant="outline" size="sm" className="text-sm" onClick={() => navigate("/agenda")}>
          Ver agenda completa
        </Button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !appointments?.length ? (
          <p className="text-center text-muted-foreground py-8">No hay citas programadas para hoy</p>
        ) : (
          appointments.map((apt, index) => {
            const patientName = apt.patient 
              ? `${apt.patient.first_name} ${apt.patient.last_name}` 
              : "Paciente";
            const initials = patientName.split(' ').map(n => n[0]).join('').slice(0, 2);
            const status = statusConfig[apt.status] || statusConfig.scheduled;

            return (
              <div
                key={apt.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all cursor-pointer group",
                  apt.status === "in-progress" && "ring-2 ring-primary/30 bg-primary/5"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Avatar className="w-11 h-11">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{patientName}</p>
                    <Badge variant="outline" className={cn("text-xs shrink-0", status.className)}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {apt.treatment_type || "Sin tratamiento especificado"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-foreground font-medium">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {apt.start_time?.slice(0, 5)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                  </p>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
