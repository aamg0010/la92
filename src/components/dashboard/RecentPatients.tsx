import { ChevronRight, Phone, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  name: string;
  avatar?: string;
  lastVisit: string;
  nextAppointment?: string;
  phone: string;
}

const patients: Patient[] = [
  {
    id: "1",
    name: "Carmen Rodríguez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
    lastVisit: "Hace 2 días",
    nextAppointment: "15 Feb, 10:00",
    phone: "+57 300 123 4567",
  },
  {
    id: "2",
    name: "Miguel Ángel Sánchez",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    lastVisit: "Hace 5 días",
    phone: "+57 301 234 5678",
  },
  {
    id: "3",
    name: "Laura Martínez",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
    lastVisit: "Hace 1 semana",
    nextAppointment: "18 Feb, 14:30",
    phone: "+57 302 345 6789",
  },
  {
    id: "4",
    name: "Andrés Felipe Castro",
    lastVisit: "Hace 2 semanas",
    phone: "+57 303 456 7890",
  },
];

export function RecentPatients() {
  return (
    <div className="card-elevated p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold text-foreground">
          Pacientes Recientes
        </h3>
        <Button variant="ghost" size="sm" className="text-sm text-primary">
          Ver todos
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-4">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <Avatar className="w-12 h-12">
              <AvatarImage src={patient.avatar} alt={patient.name} />
              <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {patient.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Última visita: {patient.lastVisit}
              </p>
              {patient.nextAppointment && (
                <p className="text-sm text-primary font-medium">
                  Próxima cita: {patient.nextAppointment}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Phone className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
