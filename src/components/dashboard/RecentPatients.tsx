import { ChevronRight, Phone, Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePatients } from "@/hooks/usePatients";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";

export function RecentPatients() {
  const { data: patients, isLoading } = usePatients();
  const navigate = useNavigate();

  const queryKeys = useMemo(() => [["patients"]], []);
  useRealtimeSubscription("patients", queryKeys);

  const recentPatients = patients?.slice(0, 5) || [];

  return (
    <div className="card-elevated p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold text-foreground">
          Pacientes Recientes
        </h3>
        <Button variant="ghost" size="sm" className="text-sm text-primary" onClick={() => navigate("/pacientes")}>
          Ver todos
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !recentPatients.length ? (
          <p className="text-center text-muted-foreground py-8">No hay pacientes registrados</p>
        ) : (
          recentPatients.map((patient) => {
            const name = `${patient.first_name} ${patient.last_name}`;
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
            const lastVisit = formatDistanceToNow(new Date(patient.created_at), { 
              addSuffix: true, 
              locale: es 
            });

            return (
              <div
                key={patient.id}
                className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => navigate("/pacientes")}
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{name}</p>
                  <p className="text-sm text-muted-foreground">
                    Registrado {lastVisit}
                  </p>
                  {patient.phone && (
                    <p className="text-sm text-muted-foreground">{patient.phone}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {patient.phone && (
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => { e.stopPropagation(); window.open(`tel:${patient.phone}`); }}>
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                  {patient.email && (
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => { e.stopPropagation(); window.open(`mailto:${patient.email}`); }}>
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
