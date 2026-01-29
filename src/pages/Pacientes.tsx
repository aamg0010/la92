import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  FileText,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  lastVisit: string;
  nextAppointment?: string;
  totalVisits: number;
  status: "active" | "inactive" | "new";
  balance: number;
}

const patients: Patient[] = [
  {
    id: "1",
    name: "Carlos Mendoza Pérez",
    email: "carlos.mendoza@email.com",
    phone: "+57 300 123 4567",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    lastVisit: "2024-01-28",
    nextAppointment: "2024-02-15 10:00",
    totalVisits: 12,
    status: "active",
    balance: 0,
  },
  {
    id: "2",
    name: "Ana Lucía Torres García",
    email: "ana.torres@email.com",
    phone: "+57 301 234 5678",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    lastVisit: "2024-01-25",
    totalVisits: 8,
    status: "active",
    balance: 250000,
  },
  {
    id: "3",
    name: "Roberto Jiménez Silva",
    email: "roberto.j@email.com",
    phone: "+57 302 345 6789",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    lastVisit: "2024-01-20",
    nextAppointment: "2024-02-10 14:00",
    totalVisits: 5,
    status: "active",
    balance: 0,
  },
  {
    id: "4",
    name: "María Fernanda Ruiz López",
    email: "maria.ruiz@email.com",
    phone: "+57 303 456 7890",
    lastVisit: "2023-12-15",
    totalVisits: 3,
    status: "inactive",
    balance: 150000,
  },
  {
    id: "5",
    name: "José García López",
    email: "jose.garcia@email.com",
    phone: "+57 304 567 8901",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    lastVisit: "2024-01-29",
    totalVisits: 1,
    status: "new",
    balance: 0,
  },
  {
    id: "6",
    name: "Laura Martínez Rodríguez",
    email: "laura.m@email.com",
    phone: "+57 305 678 9012",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    lastVisit: "2024-01-22",
    nextAppointment: "2024-02-18 11:00",
    totalVisits: 15,
    status: "active",
    balance: 0,
  },
];

const statusConfig = {
  active: { label: "Activo", className: "status-confirmed" },
  inactive: { label: "Inactivo", className: "bg-muted text-muted-foreground" },
  new: { label: "Nuevo", className: "bg-accent/10 text-accent border border-accent/20" },
};

const Pacientes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patients[0]);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 h-[calc(100vh-2rem)]">
        <div className="flex gap-6 h-full">
          {/* Patient List */}
          <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col">
            <div className="card-elevated flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 lg:p-6 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-display font-bold text-foreground">
                    Pacientes
                  </h1>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo
                  </Button>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar paciente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Patient List */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={cn(
                      "flex items-center gap-4 p-4 border-b border-border cursor-pointer transition-colors",
                      selectedPatient?.id === patient.id
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={patient.avatar} alt={patient.name} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                        {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">
                          {patient.name}
                        </p>
                        <Badge variant="outline" className={cn("text-xs shrink-0", statusConfig[patient.status].className)}>
                          {statusConfig[patient.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {patient.phone}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Detail */}
          {selectedPatient && (
            <div className="hidden lg:flex flex-1 flex-col">
              <div className="card-elevated flex-1 overflow-y-auto scrollbar-thin">
                {/* Patient Header */}
                <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                        <AvatarImage src={selectedPatient.avatar} alt={selectedPatient.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                          {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-display font-bold text-foreground">
                          {selectedPatient.name}
                        </h2>
                        <Badge variant="outline" className={cn("mt-2", statusConfig[selectedPatient.status].className)}>
                          {statusConfig[selectedPatient.status].label}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="p-6 border-b border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Teléfono</p>
                        <p className="font-medium text-foreground">{selectedPatient.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground truncate">{selectedPatient.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-6 border-b border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Resumen</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <p className="text-2xl font-display font-bold text-foreground">{selectedPatient.totalVisits}</p>
                      <p className="text-xs text-muted-foreground mt-1">Visitas totales</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <p className="text-lg font-display font-bold text-foreground">{formatDate(selectedPatient.lastVisit)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Última visita</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <p className="text-lg font-display font-bold text-foreground">
                        {selectedPatient.nextAppointment 
                          ? formatDate(selectedPatient.nextAppointment.split(' ')[0])
                          : "—"
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Próxima cita</p>
                    </div>
                    <div className={cn(
                      "text-center p-4 rounded-xl",
                      selectedPatient.balance > 0 ? "bg-destructive/10" : "bg-success/10"
                    )}>
                      <p className={cn(
                        "text-lg font-display font-bold",
                        selectedPatient.balance > 0 ? "text-destructive" : "text-success"
                      )}>
                        {formatCurrency(selectedPatient.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Saldo pendiente</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Acciones</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button variant="outline" className="flex-col h-auto py-4">
                      <Calendar className="w-5 h-5 mb-2 text-primary" />
                      <span className="text-xs">Agendar Cita</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-auto py-4">
                      <FileText className="w-5 h-5 mb-2 text-primary" />
                      <span className="text-xs">Historia Clínica</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-auto py-4">
                      <Phone className="w-5 h-5 mb-2 text-primary" />
                      <span className="text-xs">Llamar</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-auto py-4">
                      <Mail className="w-5 h-5 mb-2 text-primary" />
                      <span className="text-xs">Enviar Email</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Pacientes;
