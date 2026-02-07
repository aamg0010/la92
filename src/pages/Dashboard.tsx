import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TodayAppointments } from "@/components/dashboard/TodayAppointments";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { AIAssistantWidget } from "@/components/dashboard/AIAssistantWidget";
import { Calendar, Users, TrendingUp, Clock, Bell, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppointmentsByDate, useTodayAppointmentsCount } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { useLowStockItems } from "@/hooks/useInventory";
import { useRealtimeMultiSubscription } from "@/hooks/useRealtimeSubscription";
import { useUserProfile } from "@/hooks/useUserRole";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const greeting = today.getHours() < 12 ? "Buenos días" : today.getHours() < 18 ? "Buenas tardes" : "Buenas noches";
  const navigate = useNavigate();

  // Real data hooks
  const { data: todayCount } = useTodayAppointmentsCount();
  const { data: todayAppointments } = useAppointmentsByDate(todayStr);
  const { data: patients } = usePatients();
  const { data: lowStockItems } = useLowStockItems();
  const { data: profile } = useUserProfile();

  // Realtime subscriptions for dashboard
  const subscriptions = useMemo(() => [
    { table: "appointments" as const, queryKeys: [["appointments"], ["appointments", "count", todayStr], ["appointments", "date", todayStr]] },
    { table: "patients" as const, queryKeys: [["patients"]] },
    { table: "inventory_items" as const, queryKeys: [["inventory-items"], ["low-stock-items"]] },
    { table: "payments" as const, queryKeys: [["payments"], ["financial-metrics"]] },
  ], [todayStr]);
  useRealtimeMultiSubscription(subscriptions);

  // Compute stats
  const confirmedCount = todayAppointments?.filter(a => a.status === "confirmed").length || 0;
  const pendingCount = todayAppointments?.filter(a => a.status === "pending" || a.status === "scheduled").length || 0;

  // New patients this month
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const newPatientsThisMonth = patients?.filter(p => p.created_at >= monthStart).length || 0;

  // Next appointment
  const now = today.toTimeString().slice(0, 5);
  const nextAppointment = todayAppointments?.find(a => a.start_time > now && a.status !== "cancelled");

  const displayName = profile?.full_name || "Doctor(a)";

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              {greeting}, <span className="text-gradient-primary">{displayName}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {today.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button className="bg-primary hover:bg-primary/90 shadow-glow" onClick={() => navigate("/agenda")}>
              <Calendar className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Citas Hoy"
            value={todayCount ?? 0}
            subtitle={`${confirmedCount} confirmadas, ${pendingCount} pendientes`}
            icon={Calendar}
            variant="primary"
          />
          <StatsCard
            title="Pacientes Nuevos"
            value={newPatientsThisMonth}
            subtitle="Este mes"
            icon={Users}
            variant="success"
          />
          <StatsCard
            title="Stock Bajo"
            value={lowStockItems?.length ?? 0}
            subtitle="Artículos por reabastecer"
            icon={Package}
            variant={lowStockItems?.length ? "accent" : "default"}
          />
          <StatsCard
            title="Próxima Cita"
            value={nextAppointment ? nextAppointment.start_time.slice(0, 5) : "—"}
            subtitle={nextAppointment?.patient 
              ? `${nextAppointment.patient.first_name} ${nextAppointment.patient.last_name}`
              : "Sin citas pendientes"
            }
            icon={Clock}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <TodayAppointments />
          </div>
          <div className="space-y-6">
            <AIAssistantWidget />
            <RecentPatients />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
