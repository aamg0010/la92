import { useState } from "react";
import { useAdminUsers, useUpdateUserRole, useDeleteUserRole, type AdminUser } from "@/hooks/useAdminUsers";
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
  Trash2,
  Save,
  Users,
} from "lucide-react";
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
  
  const { data: users, isLoading } = useAdminUsers();
  const updateRoleMutation = useUpdateUserRole();
  const deleteRoleMutation = useDeleteUserRole();

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

  const handleDeleteRole = async (userId: string) => {
    await deleteRoleMutation.mutateAsync(userId);
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
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
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
                      <Avatar className="w-10 h-10">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email || "—"}</p>
                      </div>
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
                      
                      {user.role && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción quitará el rol de {ROLE_LABELS[user.role]} a {user.full_name}.
                                El usuario perderá acceso a las funciones asociadas a este rol.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRole(user.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar Rol
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
