import { useAdminClinics } from "@/hooks/useAdminClinics";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CreditCard, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: clinics, isLoading: loadingClinics } = useAdminClinics();
  const { data: users, isLoading: loadingUsers } = useAdminUsers();

  const totalClinics = clinics?.length || 0;
  const activeClinics = clinics?.filter(c => c.is_active && !c.license?.is_expired).length || 0;
  const expiringLicenses = clinics?.filter(c => c.license && c.license.days_remaining <= 30 && c.license.days_remaining > 0).length || 0;
  const expiredLicenses = clinics?.filter(c => c.license?.is_expired).length || 0;
  const totalUsers = users?.length || 0;

  const stats = [
    {
      title: "Total Clinicas",
      value: totalClinics,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      link: "/admin/clinics",
    },
    {
      title: "Clinicas Activas",
      value: activeClinics,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      link: "/admin/clinics",
    },
    {
      title: "Total Usuarios",
      value: totalUsers,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      link: "/admin/users",
    },
    {
      title: "Licencias por Vencer",
      value: expiringLicenses,
      icon: AlertTriangle,
      color: expiringLicenses > 0 ? "text-amber-500" : "text-slate-500",
      bgColor: expiringLicenses > 0 ? "bg-amber-500/10" : "bg-slate-500/10",
      link: "/admin/licenses",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Resumen de la plataforma dentry!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {loadingClinics || loadingUsers ? "..." : stat.value}
                    </p>
                    <p className="text-sm text-slate-400">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Acciones Rapidas</CardTitle>
            <CardDescription className="text-slate-400">
              Operaciones frecuentes de administracion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/clinics">
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                <Building2 className="w-4 h-4 mr-2" />
                Crear Nueva Clinica
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                <Users className="w-4 h-4 mr-2" />
                Gestionar Usuarios
              </Button>
            </Link>
            <Link to="/admin/licenses">
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Revisar Licencias
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Alertas</CardTitle>
            <CardDescription className="text-slate-400">
              Situaciones que requieren atencion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiredLicenses > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">
                    {expiredLicenses} licencia(s) expirada(s)
                  </p>
                  <p className="text-xs text-slate-400">
                    Clinicas sin acceso al sistema
                  </p>
                </div>
              </div>
            )}
            {expiringLicenses > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    {expiringLicenses} licencia(s) por vencer
                  </p>
                  <p className="text-xs text-slate-400">
                    Vencen en los proximos 30 dias
                  </p>
                </div>
              </div>
            )}
            {expiredLicenses === 0 && expiringLicenses === 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-400">
                    Todo en orden
                  </p>
                  <p className="text-xs text-slate-400">
                    No hay alertas pendientes
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Clinics */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Clinicas Recientes</CardTitle>
            <CardDescription className="text-slate-400">
              Ultimas clinicas registradas en la plataforma
            </CardDescription>
          </div>
          <Link to="/admin/clinics">
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
              Ver todas
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingClinics ? (
            <p className="text-slate-400 text-center py-4">Cargando...</p>
          ) : clinics && clinics.length > 0 ? (
            <div className="space-y-3">
              {clinics.slice(0, 5).map((clinic) => (
                <div
                  key={clinic.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{clinic.name}</p>
                      <p className="text-xs text-slate-400">{clinic.slug}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{clinic.user_count} usuarios</p>
                    <p className="text-xs text-slate-400">
                      {clinic.license?.plan || "Sin plan"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">No hay clinicas registradas</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
