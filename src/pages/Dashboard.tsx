import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TodayAppointments } from "@/components/dashboard/TodayAppointments";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { AIAssistantWidget } from "@/components/dashboard/AIAssistantWidget";
import { Calendar, Users, TrendingUp, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const today = new Date();
  const greeting = today.getHours() < 12 ? "Buenos días" : today.getHours() < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              {greeting}, <span className="text-gradient-primary">Dra. María</span>
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
            <Button variant="outline" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-glow">
              <Calendar className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Citas Hoy"
            value={8}
            subtitle="3 confirmadas, 2 pendientes"
            icon={Calendar}
            variant="primary"
          />
          <StatsCard
            title="Pacientes Nuevos"
            value={12}
            subtitle="Este mes"
            icon={Users}
            trend={{ value: 15, isPositive: true }}
            variant="success"
          />
          <StatsCard
            title="Ingresos del Mes"
            value="$4.2M"
            subtitle="Meta: $5M"
            icon={TrendingUp}
            trend={{ value: 8, isPositive: true }}
            variant="accent"
          />
          <StatsCard
            title="Próxima Cita"
            value="10:00"
            subtitle="Ana Lucía Torres"
            icon={Clock}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Today's Appointments - Takes 2 columns */}
          <div className="xl:col-span-2">
            <TodayAppointments />
          </div>

          {/* Right Sidebar - Takes 1 column */}
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
