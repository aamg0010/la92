import { useAdminClinics, useUpdateLicense, useGenerateLicenseCode } from "@/hooks/useAdminClinics";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, CalendarPlus, AlertTriangle, CheckCircle, Key, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AdminClinic } from "@/hooks/useAdminClinics";

const DURATIONS = [
  { value: 0.5, label: "15 dias" },
  { value: 1, label: "1 mes" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "1 ano" },
  { value: 24, label: "2 anos" },
];

const PLANS = [
  { value: "demo", label: "Demo", users: 3 },
  { value: "basic", label: "Basico", users: 5 },
  { value: "professional", label: "Profesional", users: 10 },
  { value: "enterprise", label: "Enterprise", users: 50 },
];

export default function AdminLicenses() {
  const { data: clinics, isLoading } = useAdminClinics();
  const updateLicense = useUpdateLicense();
  const generateCode = useGenerateLicenseCode();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState<AdminClinic | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editMaxUsers, setEditMaxUsers] = useState(5);
  const [extendMonths, setExtendMonths] = useState<number | null>(null);
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [showCodeDialog, setShowCodeDialog] = useState<AdminClinic | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copiado", description: "Codigo copiado al portapapeles" });
  };

  const handleGenerateCode = async (licenseId: string) => {
    await generateCode.mutateAsync(licenseId);
  };

  const activeLicenses = clinics?.filter(c => c.license && !c.license.is_expired).length || 0;
  const expiringLicenses = clinics?.filter(c => c.license && c.license.days_remaining <= 30 && c.license.days_remaining > 0).length || 0;
  const expiredLicenses = clinics?.filter(c => c.license?.is_expired).length || 0;

  const handleSave = async () => {
    if (!showEdit?.license) return;
    const currentExpiresAt = showEdit.license.expires_at?.split("T")[0];
    await updateLicense.mutateAsync({
      license_id: showEdit.license.id,
      plan: editPlan !== showEdit.license.plan ? editPlan : undefined,
      max_users: editMaxUsers !== showEdit.license.max_users ? editMaxUsers : undefined,
      months_extend: extendMonths || undefined,
      expires_at: editExpiresAt !== currentExpiresAt ? editExpiresAt : undefined,
    });
    setShowEdit(null);
  };

  const openEditDialog = (clinic: AdminClinic) => {
    setShowEdit(clinic);
    setEditPlan(clinic.license?.plan || "basic");
    setEditMaxUsers(clinic.license?.max_users || 5);
    setExtendMonths(null);
    setEditExpiresAt(clinic.license?.expires_at?.split("T")[0] || "");
  };

  const getLicenseStatus = (clinic: AdminClinic) => {
    if (!clinic.license) return { label: "Sin licencia", variant: "destructive" as const, color: "text-red-400" };
    if (clinic.license.is_expired) return { label: "Expirada", variant: "destructive" as const, color: "text-red-400" };
    if (clinic.license.days_remaining <= 30) return { label: `${clinic.license.days_remaining} dias`, variant: "secondary" as const, color: "text-amber-400" };
    return { label: "Activa", variant: "default" as const, color: "text-green-400" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Gestion de Licencias</h1>
        <p className="text-slate-400">Administra las licencias de las clinicas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeLicenses}</p>
                <p className="text-xs text-slate-400">Licencias Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{expiringLicenses}</p>
                <p className="text-xs text-slate-400">Por Vencer (30 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <CreditCard className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{expiredLicenses}</p>
                <p className="text-xs text-slate-400">Licencias Expiradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Licenses Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Licencias por Clinica</CardTitle>
          <CardDescription className="text-slate-400">
            Estado de las licencias de cada clinica registrada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Clinica</TableHead>
                  <TableHead className="text-slate-400">Codigo de Registro</TableHead>
                  <TableHead className="text-slate-400">Plan</TableHead>
                  <TableHead className="text-slate-400">Usuarios</TableHead>
                  <TableHead className="text-slate-400">Expiracion</TableHead>
                  <TableHead className="text-slate-400">Estado</TableHead>
                  <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics?.map((clinic) => {
                  const status = getLicenseStatus(clinic);
                  return (
                    <TableRow key={clinic.id} className="border-slate-700">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{clinic.name}</p>
                          <p className="text-xs text-slate-400">{clinic.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {clinic.license?.license_code ? (
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-slate-900 rounded text-primary font-mono text-sm">
                              {clinic.license.license_code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-white"
                              onClick={() => copyToClipboard(clinic.license!.license_code!)}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <span className="text-xs text-slate-500">
                              {clinic.license.code_uses}/{clinic.license.code_max_uses}
                            </span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:text-white"
                            onClick={() => clinic.license && handleGenerateCode(clinic.license.id)}
                            disabled={!clinic.license || generateCode.isPending}
                          >
                            {generateCode.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Key className="w-4 h-4 mr-1" />
                            )}
                            Generar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                        variant={clinic.license?.plan === "demo" ? "secondary" : "outline"}
                        className={`capitalize ${
                          clinic.license?.plan === "demo"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "text-slate-300 border-slate-600"
                        }`}
                      >
                        {clinic.license?.plan || "—"}
                      </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {clinic.user_count}/{clinic.license?.max_users || "—"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {clinic.license
                          ? new Date(clinic.license.expires_at).toLocaleDateString("es-CO")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {clinic.license?.license_code && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                            onClick={() => clinic.license && handleGenerateCode(clinic.license.id)}
                            disabled={generateCode.isPending}
                            title="Regenerar codigo"
                          >
                            <RefreshCw className={`w-4 h-4 ${generateCode.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-300 hover:text-white"
                          onClick={() => openEditDialog(clinic)}
                          disabled={!clinic.license}
                        >
                          <CalendarPlus className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!clinics || clinics.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      No hay clinicas registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit License Dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Licencia</DialogTitle>
            <DialogDescription className="text-slate-400">
              Licencia de {showEdit?.name}
              {showEdit?.license && (
                <span className="block mt-1">
                  Expira: {new Date(showEdit.license.expires_at).toLocaleDateString("es-CO")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Plan */}
            <div className="space-y-2">
              <Label className="text-slate-300">Plan</Label>
              <Select value={editPlan} onValueChange={(v) => {
                setEditPlan(v);
                const plan = PLANS.find(p => p.value === v);
                if (plan) setEditMaxUsers(plan.users);
              }}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PLANS.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-slate-300">
                      {p.label} ({p.users} usuarios)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max Users */}
            <div className="space-y-2">
              <Label className="text-slate-300">Max Usuarios</Label>
              <input
                type="number"
                min={1}
                value={editMaxUsers}
                onChange={(e) => setEditMaxUsers(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-white"
              />
            </div>

            {/* Expires At */}
            <div className="space-y-2">
              <Label className="text-slate-300">Fecha de Expiracion</Label>
              <input
                type="date"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-white"
              />
            </div>

            {/* Extend Duration */}
            <div className="space-y-2">
              <Label className="text-slate-300">Extender (opcional)</Label>
              <Select
                value={extendMonths ? String(extendMonths) : "none"}
                onValueChange={(v) => setExtendMonths(v === "none" ? null : Number(v))}
              >
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue placeholder="Sin extension" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none" className="text-slate-400">Sin extension</SelectItem>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)} className="text-slate-300">
                      + {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)} className="border-slate-600 text-slate-300">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateLicense.isPending}>
              {updateLicense.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
