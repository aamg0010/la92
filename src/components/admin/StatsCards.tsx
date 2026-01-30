import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, UserCog } from "lucide-react";
import type { AdminUser } from "@/hooks/useAdminUsers";

interface StatsCardsProps {
  users: AdminUser[] | undefined;
}

export function StatsCards({ users }: StatsCardsProps) {
  const stats = {
    total: users?.length || 0,
    admins: users?.filter(u => u.role === "admin").length || 0,
    doctors: users?.filter(u => u.role === "doctor").length || 0,
    assistants: users?.filter(u => u.role === "assistant").length || 0,
    accountants: users?.filter(u => u.role === "accountant").length || 0,
    noRole: users?.filter(u => !u.role).length || 0,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Usuarios</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-xs text-muted-foreground">Administradores</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.doctors}</p>
              <p className="text-xs text-muted-foreground">Odontólogos</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.assistants}</p>
              <p className="text-xs text-muted-foreground">Auxiliares</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.accountants}</p>
              <p className="text-xs text-muted-foreground">Contabilidad</p>
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
              <p className="text-2xl font-bold">{stats.noRole}</p>
              <p className="text-xs text-muted-foreground">Sin Rol</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
