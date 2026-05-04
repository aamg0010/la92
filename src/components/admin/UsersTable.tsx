import { useState } from "react";
import { useAdminUsers, useUpdateUserRole, useToggleUserActive, useCreateClinicUser, type AdminUser } from "@/hooks/useAdminUsers";
import { ROLE_LABELS, type AppRole } from "@/hooks/useUserRole";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Loader2,
  Save,
  Users,
  UserCheck,
  UserX,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  doctor: "bg-primary/10 text-primary border-primary/20",
  assistant: "bg-accent/10 text-accent border-accent/20",
  accountant: "bg-success/10 text-success border-success/20",
};

export function UsersTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingChanges, setPendingChanges] = useState<Record<string, AppRole>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "doctor" as AppRole,
    specialty: "",
  });

  const { data: users, isLoading } = useAdminUsers();
  const updateRoleMutation = useUpdateUserRole();
  const toggleActiveMutation = useToggleUserActive();
  const createUserMutation = useCreateClinicUser();

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.fullName) return;

    await createUserMutation.mutateAsync({
      email: newUser.email,
      password: newUser.password,
      fullName: newUser.fullName,
      role: newUser.role,
      specialty: newUser.specialty || undefined,
    });

    setShowCreateDialog(false);
    setNewUser({ email: "", password: "", fullName: "", role: "doctor", specialty: "" });
  };

  const filteredUsers = users?.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    setPendingChanges(prev => ({ ...prev, [userId]: newRole }));
  };

  const saveRoleChange = async (userId: string) => {
    const newRole = pendingChanges[userId];
    if (newRole) {
      await updateRoleMutation.mutateAsync({ userId, newRole });
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    await toggleActiveMutation.mutateAsync({ userId, isActive: !currentStatus });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display">Usuarios del Sistema</CardTitle>
            <CardDescription>
              Administra los roles y permisos de cada usuario
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Agrega un nuevo usuario a tu clínica
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Nombre Completo *</Label>
                    <Input
                      id="fullName"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      placeholder="Dr. Juan Pérez"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="doctor">Odontólogo</SelectItem>
                        <SelectItem value="assistant">Auxiliar</SelectItem>
                        <SelectItem value="accountant">Contabilidad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newUser.role === "doctor" && (
                    <div className="grid gap-2">
                      <Label htmlFor="specialty">Especialidad</Label>
                      <Input
                        id="specialty"
                        value={newUser.specialty}
                        onChange={(e) => setNewUser({ ...newUser, specialty: e.target.value })}
                        placeholder="Ortodoncia, Endodoncia, etc."
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={createUserMutation.isPending || !newUser.email || !newUser.password || !newUser.fullName}
                  >
                    {createUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Crear Usuario
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Rol Actual</TableHead>
              <TableHead>Cambiar Rol</TableHead>
              <TableHead>Fecha Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const hasPendingChange = pendingChanges[user.user_id] !== undefined;
              const currentRole = pendingChanges[user.user_id] || user.role;
              
              return (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className={cn("w-10 h-10", !user.is_active && "opacity-50")}>
                        {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={cn("font-medium", !user.is_active && "text-muted-foreground line-through")}>
                          {user.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.is_active ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
                          <UserCheck className="w-3 h-3" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground gap-1">
                          <UserX className="w-3 h-3" />
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role ? (
                      <Badge 
                        variant="outline" 
                        className={cn("border", ROLE_COLORS[user.role])}
                      >
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Sin rol asignado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={currentRole || ""}
                      onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="doctor">Odontólogo</SelectItem>
                        <SelectItem value="assistant">Auxiliar</SelectItem>
                        <SelectItem value="accountant">Contabilidad</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(parseISO(user.created_at), "d MMM yyyy", { locale: es })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPendingChange && (
                        <Button
                          size="sm"
                          onClick={() => saveRoleChange(user.user_id)}
                          disabled={updateRoleMutation.isPending}
                        >
                          {updateRoleMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-1" />
                              Guardar
                            </>
                          )}
                        </Button>
                      )}

                      {/* Switch para habilitar/deshabilitar usuario */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.is_active}
                              disabled={toggleActiveMutation.isPending || user.role === 'admin'}
                              className="cursor-pointer"
                            />
                          </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {user.is_active ? "¿Deshabilitar usuario?" : "¿Habilitar usuario?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {user.is_active
                                ? `${user.full_name} no podrá acceder al sistema. Su historial y registros se mantendrán para trazabilidad.`
                                : `${user.full_name} podrá acceder nuevamente al sistema con su rol de ${user.role ? ROLE_LABELS[user.role] : 'sin asignar'}.`
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleToggleActive(user.user_id, user.is_active)}
                              className={user.is_active
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : "bg-success text-success-foreground hover:bg-success/90"
                              }
                            >
                              {user.is_active ? "Deshabilitar" : "Habilitar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No se encontraron usuarios" : "No hay usuarios registrados"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
