import { useState } from "react";
import {
  useAdminClinics,
  useCreateClinic,
  useUpdateLicense,
  useToggleClinicActive,
  type AdminClinic,
} from "@/hooks/useAdminClinics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Plus,
  Loader2,
  CalendarPlus,
  Power,
  Users,
  Shield,
  Copy,
  Check,
  Mail,
} from "lucide-react";

const PLANS = [
  { value: "demo", label: "Demo (15 dias)", users: 3 },
  { value: "basic", label: "Basico", users: 5 },
  { value: "professional", label: "Profesional", users: 10 },
  { value: "enterprise", label: "Enterprise", users: 50 },
];

const DURATIONS = [
  { value: 0.5, label: "15 dias (Demo)" },
  { value: 1, label: "1 mes" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "1 ano" },
  { value: 24, label: "2 anos" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getLicenseStatus(clinic: AdminClinic) {
  if (!clinic.license) return { label: "Sin licencia", variant: "destructive" as const };
  if (clinic.license.is_expired) return { label: "Expirada", variant: "destructive" as const };
  if (clinic.license.days_remaining <= 30) return { label: `${clinic.license.days_remaining}d`, variant: "secondary" as const };
  return { label: "Activa", variant: "default" as const };
}

export function ClinicsPanel() {
  const { data: clinics, isLoading } = useAdminClinics();
  const createClinic = useCreateClinic();
  const updateLicense = useUpdateLicense();
  const toggleActive = useToggleClinicActive();

  const [showCreate, setShowCreate] = useState(false);
  const [showExtend, setShowExtend] = useState<AdminClinic | null>(null);
  const [showToggle, setShowToggle] = useState<AdminClinic | null>(null);
  const [createdClinic, setCreatedClinic] = useState<{
    clinic_name: string;
    license_code: string;
    admin_email: string;
    admin_name?: string;
    plan: string;
    expires_at: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newPlan, setNewPlan] = useState("basic");
  const [newMaxUsers, setNewMaxUsers] = useState(5);
  const [newMonths, setNewMonths] = useState(12);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");

  // Extend form state
  const [extendMonths, setExtendMonths] = useState(12);

  const handleNameChange = (name: string) => {
    setNewName(name);
    setNewSlug(slugify(name));
  };

  const handlePlanChange = (plan: string) => {
    setNewPlan(plan);
    const planDef = PLANS.find((p) => p.value === plan);
    if (planDef) {
      setNewMaxUsers(planDef.users);
      // Auto-set 15 days for demo plan
      if (plan === "demo") {
        setNewMonths(0.5);
      }
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim() || !newAdminEmail.trim()) return;
    const result = await createClinic.mutateAsync({
      name: newName.trim(),
      slug: newSlug.trim(),
      admin_email: newAdminEmail.trim(),
      admin_name: newAdminName.trim() || undefined,
      plan: newPlan,
      max_users: newMaxUsers,
      months: newMonths,
    });
    setShowCreate(false);
    setCreatedClinic(result);
    setNewName("");
    setNewSlug("");
    setNewPlan("basic");
    setNewMaxUsers(5);
    setNewMonths(12);
    setNewAdminEmail("");
    setNewAdminName("");
  };

  const handleCopyLicenseInfo = () => {
    if (!createdClinic) return;
    const text = `Bienvenido a Clinident!

Clinica: ${createdClinic.clinic_name}
Codigo de Licencia: ${createdClinic.license_code}
Plan: ${createdClinic.plan}
Valido hasta: ${new Date(createdClinic.expires_at).toLocaleDateString("es-CO")}

Para activar su cuenta:
1. Vaya a https://clinident.trycompany.es
2. Haga clic en "Registrarse"
3. Use el codigo de licencia: ${createdClinic.license_code}
4. Complete sus datos con el email: ${createdClinic.admin_email}

Soporte: info@trycompany.eu`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!createdClinic) return;
    const text = encodeURIComponent(`Bienvenido a Clinident!

Clinica: ${createdClinic.clinic_name}
Codigo de Licencia: ${createdClinic.license_code}
Plan: ${createdClinic.plan}

Para activar: https://clinident.trycompany.es
Use el codigo: ${createdClinic.license_code}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleExtend = async () => {
    if (!showExtend?.license) return;
    await updateLicense.mutateAsync({
      license_id: showExtend.license.id,
      months_extend: extendMonths,
    });
    setShowExtend(null);
  };

  const handleToggle = async () => {
    if (!showToggle) return;
    await toggleActive.mutateAsync({
      clinic_id: showToggle.id,
      is_active: !showToggle.is_active,
    });
    setShowToggle(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clinics?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Clinicas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clinics?.filter((c) => c.is_active && !c.license?.is_expired).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Licencias Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clinics?.reduce((sum, c) => sum + c.user_count, 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Usuarios Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Clinicas Registradas</CardTitle>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Clinica
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinica</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics?.map((clinic) => {
                const licStatus = getLicenseStatus(clinic);
                return (
                  <TableRow key={clinic.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{clinic.name}</p>
                        <p className="text-xs text-muted-foreground">{clinic.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={clinic.license?.plan === "demo" ? "secondary" : "outline"}
                        className={`capitalize ${clinic.license?.plan === "demo" ? "bg-amber-500/20 text-amber-600 border-amber-500/30" : ""}`}
                      >
                        {clinic.license?.plan || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {clinic.user_count}/{clinic.license?.max_users || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={licStatus.variant}>{licStatus.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {clinic.license
                        ? new Date(clinic.license.expires_at).toLocaleDateString("es-CO")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={clinic.is_active ? "default" : "secondary"}>
                        {clinic.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ver/Enviar código de licencia"
                        onClick={() => {
                          if (clinic.license) {
                            setCreatedClinic({
                              clinic_name: clinic.name,
                              license_code: clinic.license.license_code || "",
                              admin_email: clinic.license.admin_email || "",
                              admin_name: clinic.license.admin_name,
                              plan: clinic.license.plan,
                              expires_at: clinic.license.expires_at,
                            });
                          }
                        }}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Extender licencia"
                        onClick={() => {
                          setShowExtend(clinic);
                          setExtendMonths(12);
                        }}
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={clinic.is_active ? "Desactivar" : "Activar"}
                        onClick={() => setShowToggle(clinic)}
                      >
                        <Power className={`w-4 h-4 ${clinic.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!clinics || clinics.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay clinicas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Clinic Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Clinica</DialogTitle>
            <DialogDescription>
              Crea una nueva clinica con su schema de base de datos y licencia.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la clinica</Label>
              <Input
                placeholder="Consultorio Dental ABC"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                placeholder="consultorio-abc"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Schema: clinic_{newSlug.replace(/-/g, "_") || "..."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nombre del administrador</Label>
              <Input
                placeholder="Dr. Juan Pérez"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email del administrador *</Label>
              <Input
                type="email"
                placeholder="admin@clinica.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se enviará un email con las instrucciones de activación
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={newPlan} onValueChange={handlePlanChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max usuarios</Label>
                <Input
                  type="number"
                  min={1}
                  value={newMaxUsers}
                  onChange={(e) => setNewMaxUsers(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duracion</Label>
              <Select value={String(newMonths)} onValueChange={(v) => setNewMonths(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || !newSlug.trim() || !newAdminEmail.trim() || createClinic.isPending}
            >
              {createClinic.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Crear Clinica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend License Dialog */}
      <Dialog open={!!showExtend} onOpenChange={() => setShowExtend(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Extender Licencia</DialogTitle>
            <DialogDescription>
              Extender la licencia de {showExtend?.name}
              {showExtend?.license && (
                <span className="block mt-1">
                  Expira actualmente: {new Date(showExtend.license.expires_at).toLocaleDateString("es-CO")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Meses a extender</Label>
              <Select value={String(extendMonths)} onValueChange={(v) => setExtendMonths(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtend(null)}>
              Cancelar
            </Button>
            <Button onClick={handleExtend} disabled={updateLicense.isPending}>
              {updateLicense.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Extender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Active Confirmation */}
      <AlertDialog open={!!showToggle} onOpenChange={() => setShowToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showToggle?.is_active ? "Desactivar" : "Activar"} clinica
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showToggle?.is_active
                ? `Los ${showToggle?.user_count || 0} usuarios de "${showToggle?.name}" perderan acceso al sistema.`
                : `Los usuarios de "${showToggle?.name}" podran acceder al sistema nuevamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              className={showToggle?.is_active ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {showToggle?.is_active ? "Desactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Created Clinic Result Dialog */}
      <Dialog open={!!createdClinic} onOpenChange={() => setCreatedClinic(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              Clinica Creada Exitosamente
            </DialogTitle>
            <DialogDescription>
              Envie esta informacion al administrador de la clinica
            </DialogDescription>
          </DialogHeader>

          {createdClinic && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Clinica</p>
                  <p className="font-medium">{createdClinic.clinic_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Codigo de Licencia</p>
                  <p className="font-mono text-lg font-bold text-primary">
                    {createdClinic.license_code}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="font-medium capitalize">{createdClinic.plan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valido hasta</p>
                    <p className="font-medium">
                      {new Date(createdClinic.expires_at).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email administrador</p>
                  <p className="font-medium">{createdClinic.admin_email}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleCopyLicenseInfo}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado!" : "Copiar Info"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-green-600 hover:text-green-700"
                  onClick={handleSendWhatsApp}
                >
                  <Mail className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                El email automatico se enviara cuando se configure SMTP
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCreatedClinic(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
