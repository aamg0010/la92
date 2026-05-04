import { useState } from "react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Users, Loader2, Shield, Building2, UserCheck, UserX } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  doctor: "Odontologo",
  assistant: "Auxiliar",
  accountant: "Contabilidad",
  superadmin: "Superadmin",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  doctor: "bg-green-500/10 text-green-400 border-green-500/20",
  assistant: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  accountant: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  superadmin: "bg-red-500/10 text-red-400 border-red-500/20",
};

type FilterStatus = "all" | "active" | "inactive";

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("active");

  const filteredUsers = users?.filter(u => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return u.is_active;
    return !u.is_active;
  }) || [];

  const superadmins = filteredUsers.filter(u => u.is_superadmin);
  const regularUsers = filteredUsers.filter(u => !u.is_superadmin);

  const totalActive = users?.filter(u => u.is_active).length || 0;
  const totalInactive = users?.filter(u => !u.is_active).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Usuarios del Sistema</h1>
        <p className="text-slate-400">Todos los usuarios registrados en la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users?.length || 0}</p>
                <p className="text-xs text-slate-400">Total Usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalActive}</p>
                <p className="text-xs text-slate-400">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-500/10">
                <UserX className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalInactive}</p>
                <p className="text-xs text-slate-400">Inactivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{superadmins.length}</p>
                <p className="text-xs text-slate-400">Superadmins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filterStatus === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("active")}
          className={filterStatus !== "active" ? "border-slate-600 text-slate-300" : ""}
        >
          <UserCheck className="w-4 h-4 mr-1" />
          Activos ({totalActive})
        </Button>
        <Button
          variant={filterStatus === "inactive" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("inactive")}
          className={filterStatus !== "inactive" ? "border-slate-600 text-slate-300" : ""}
        >
          <UserX className="w-4 h-4 mr-1" />
          Inactivos ({totalInactive})
        </Button>
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
          className={filterStatus !== "all" ? "border-slate-600 text-slate-300" : ""}
        >
          <Users className="w-4 h-4 mr-1" />
          Todos ({users?.length || 0})
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Usuarios</CardTitle>
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
                  <TableHead className="text-slate-400">Usuario</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Rol</TableHead>
                  <TableHead className="text-slate-400">Clinica</TableHead>
                  <TableHead className="text-slate-400">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id} className="border-slate-700">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white font-medium">
                          {user.full_name || "Sin nombre"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ROLE_COLORS[user.is_superadmin ? 'superadmin' : (user.role || 'doctor')]}
                      >
                        {user.is_superadmin ? (
                          <><Shield className="w-3 h-3 mr-1" /> Superadmin</>
                        ) : (
                          ROLE_LABELS[user.role || 'doctor']
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {user.clinic_name || (user.is_superadmin ? "Todas" : "Sin asignar")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      {filterStatus === "active" && "No hay usuarios activos"}
                      {filterStatus === "inactive" && "No hay usuarios inactivos"}
                      {filterStatus === "all" && "No hay usuarios registrados"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
