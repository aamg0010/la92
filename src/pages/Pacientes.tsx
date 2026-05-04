import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Filter,
  Edit,
  Phone,
  Mail,
  Calendar,
  FileText,
  ChevronRight,
  Loader2,
  UserPlus,
  ClipboardList,
  User,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatients, type Patient } from "@/hooks/usePatients";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { NewPatientDialog } from "@/components/patients/NewPatientDialog";
import { NewAppointmentDialog } from "@/components/appointments/NewAppointmentDialog";
import { ClinicalHistoryPanel } from "@/components/patients/ClinicalHistoryPanel";
import { ClinicalHistoryDialog } from "@/components/patients/ClinicalHistoryDialog";
import { ClinicalQuickActionsPanel } from "@/components/patients/ClinicalQuickActionsPanel";
import { OdontogramPanel } from "@/components/patients/OdontogramPanel";
import { EditPatientDialog } from "@/components/patients/EditPatientDialog";

const getPatientStatus = (patient: Patient): "active" | "inactive" | "new" => {
  const daysSinceCreated = differenceInDays(new Date(), parseISO(patient.created_at));
  if (daysSinceCreated <= 30) return "new";

  if (patient.updated_at) {
    const daysSinceUpdate = differenceInDays(new Date(), parseISO(patient.updated_at));
    if (daysSinceUpdate > 180) return "inactive";
  }

  return "active";
};

const statusConfig = {
  active: { label: "Activo", className: "status-confirmed" },
  inactive: { label: "Inactivo", className: "bg-muted text-muted-foreground" },
  new: { label: "Nuevo", className: "bg-accent/10 text-accent border border-accent/20" },
};

const Pacientes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState("");

  const { data: patients, isLoading } = usePatients();

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!searchQuery) return patients;

    const query = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.first_name.toLowerCase().includes(query) ||
        p.last_name.toLowerCase().includes(query) ||
        p.document_number.includes(query) ||
        p.phone.includes(query) ||
        (p.email && p.email.toLowerCase().includes(query))
    );
  }, [patients, searchQuery]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId || !patients) return patients?.[0] || null;
    return patients.find((p) => p.id === selectedPatientId) || patients[0] || null;
  }, [selectedPatientId, patients]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(parseISO(dateStr), "d MMM yyyy", { locale: es });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 h-[calc(100vh-2rem)]">
        <div className="flex gap-6 h-full">
          <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col">
            <div className="card-elevated flex-1 flex flex-col overflow-hidden">
              <div className="p-4 lg:p-6 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-display font-bold text-foreground">Pacientes</h1>
                  <NewPatientDialog />
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

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {filteredPatients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                    <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No se encontraron pacientes" : "No hay pacientes registrados"}
                    </p>
                    <Button className="mt-4" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar primer paciente
                    </Button>
                  </div>
                ) : (
                  filteredPatients.map((patient) => {
                    const status = getPatientStatus(patient);
                    const fullName = `${patient.first_name} ${patient.last_name}`;
                    const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2);

                    return (
                      <div
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setSelectedTooth("");
                        }}
                        className={cn(
                          "flex items-center gap-4 p-4 border-b border-border cursor-pointer transition-colors",
                          selectedPatient?.id === patient.id
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">{fullName}</p>
                            <Badge variant="outline" className={cn("text-xs shrink-0", statusConfig[status].className)}>
                              {statusConfig[status].label}
                            </Badge>
                          </div>
                          {patient.phone ? (
                            <a
                              href={`https://wa.me/${patient.phone.replace(/[^\d]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-[#25D366] hover:underline flex items-center gap-1 truncate"
                            >
                              <MessageCircle className="w-3 h-3 shrink-0" />
                              {patient.phone}
                            </a>
                          ) : (
                            <p className="text-sm text-muted-foreground truncate">Sin teléfono</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {selectedPatient && (
            <div className="hidden lg:flex flex-1 flex-col">
              <div className="card-elevated flex-1 overflow-y-auto scrollbar-thin">
                <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                          {`${selectedPatient.first_name} ${selectedPatient.last_name}`.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-display font-bold text-foreground">
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={cn(statusConfig[getPatientStatus(selectedPatient)].className)}>
                            {statusConfig[getPatientStatus(selectedPatient)].label}
                          </Badge>
                          {(selectedPatient as Patient & { clinical_history_code?: string }).clinical_history_code && (
                            <Badge variant="secondary" className="font-mono text-xs">
                              <ClipboardList className="w-3 h-3 mr-1" />
                              HC: {(selectedPatient as Patient & { clinical_history_code?: string }).clinical_history_code}
                            </Badge>
                          )}
                          {selectedTooth ? <Badge variant="outline">Pieza {selectedTooth}</Badge> : null}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>

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
                        <p className="font-medium text-foreground truncate">{selectedPatient.email || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-b border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Información Personal</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Documento</p>
                      <p className="font-medium text-foreground">{selectedPatient.document_type}: {selectedPatient.document_number}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Fecha de nacimiento</p>
                      <p className="font-medium text-foreground">{formatDate(selectedPatient.birth_date)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Género</p>
                      <p className="font-medium text-foreground">{selectedPatient.gender || "—"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Ciudad</p>
                      <p className="font-medium text-foreground">{selectedPatient.city || "—"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                      <p className="text-xs text-muted-foreground">Dirección</p>
                      <p className="font-medium text-foreground">{selectedPatient.address || "—"}</p>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="info" className="flex-1 flex flex-col">
                  <div className="px-6 border-b border-border">
                    <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                      <TabsTrigger value="info" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Información
                      </TabsTrigger>
                      <TabsTrigger value="history" className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Historia Clínica
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="info" className="flex-1 overflow-y-auto scrollbar-thin m-0 p-6">
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-4">Acciones</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <NewAppointmentDialog
                          trigger={
                            <Button variant="outline" className="flex-col h-auto py-4 w-full">
                              <Calendar className="w-5 h-5 mb-2 text-primary" />
                              <span className="text-xs">Agendar Cita</span>
                            </Button>
                          }
                        />
                        <ClinicalHistoryDialog
                          patientId={selectedPatient.id}
                          patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                          trigger={
                            <Button variant="outline" className="flex-col h-auto py-4 w-full">
                              <FileText className="w-5 h-5 mb-2 text-primary" />
                              <span className="text-xs">Nuevo Registro</span>
                            </Button>
                          }
                        />
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

                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-4">Resumen</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-xl bg-muted/50">
                          <p className="text-lg font-display font-bold text-foreground">{formatDate(selectedPatient.created_at)}</p>
                          <p className="text-xs text-muted-foreground mt-1">Fecha de registro</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-muted/50">
                          <p className="text-lg font-display font-bold text-foreground">{selectedPatient.health_insurance || "—"}</p>
                          <p className="text-xs text-muted-foreground mt-1">EPS / Aseguradora</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-muted/50">
                          <p className="text-lg font-display font-bold text-foreground">{formatDate(selectedPatient.updated_at)}</p>
                          <p className="text-xs text-muted-foreground mt-1">Última actualización</p>
                        </div>
                      </div>
                    </div>

                    {selectedPatient.notes && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Notas</h3>
                        <p className="text-sm text-foreground">{selectedPatient.notes}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="flex-1 overflow-y-auto scrollbar-thin m-0 p-6">
                    <div className="space-y-6">
                      <OdontogramPanel
                        patientId={selectedPatient.id}
                        patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                        selectedTooth={selectedTooth}
                        onSelectTooth={setSelectedTooth}
                      />
                      <ClinicalQuickActionsPanel
                        patientId={selectedPatient.id}
                        patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                        selectedTooth={selectedTooth}
                        onSelectedToothChange={setSelectedTooth}
                      />
                      <ClinicalHistoryPanel
                        patientId={selectedPatient.id}
                        patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <EditPatientDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                patient={selectedPatient}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Pacientes;

