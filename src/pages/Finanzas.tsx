import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Clock,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
}

const MetricCard = ({ title, value, change, changeLabel, icon: Icon, trend }: MetricCardProps) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-display font-bold text-foreground">{value}</p>
        <div className={cn(
          "mt-2 inline-flex items-center gap-1 text-sm font-medium",
          trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
        )}>
          {trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : trend === "down" ? <ArrowDownRight className="w-4 h-4" /> : null}
          <span>{change > 0 ? "+" : ""}{change}%</span>
          <span className="text-muted-foreground font-normal">{changeLabel}</span>
        </div>
      </div>
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        trend === "up" ? "bg-success/10 text-success" : 
        trend === "down" ? "bg-destructive/10 text-destructive" : 
        "bg-primary/10 text-primary"
      )}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const productivityData = [
  { doctor: "Dra. Ana María Rios", procedures: 45, revenue: 4250000, efficiency: 92 },
  { doctor: "Dr. Carlos Mejía", procedures: 38, revenue: 3100000, efficiency: 85 },
  { doctor: "Dra. Laura Gómez", procedures: 42, revenue: 3800000, efficiency: 88 },
];

const serviceBreakdown = [
  { name: "Ortodoncia", percentage: 35, revenue: 3500000, color: "bg-primary" },
  { name: "Endodoncia", percentage: 25, revenue: 2500000, color: "bg-accent" },
  { name: "Blanqueamiento", percentage: 20, revenue: 2000000, color: "bg-success" },
  { name: "Limpieza", percentage: 12, revenue: 1200000, color: "bg-warning" },
  { name: "Otros", percentage: 8, revenue: 800000, color: "bg-muted-foreground" },
];

const Finanzas = () => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              Rentabilidad y Productividad
            </h1>
            <p className="text-muted-foreground mt-1">
              Análisis financiero del Consultorio Odontológico La 92
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Este mes
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Ingresos del Mes"
            value={formatCurrency(12500000)}
            change={15}
            changeLabel="vs mes anterior"
            icon={DollarSign}
            trend="up"
          />
          <MetricCard
            title="Pacientes Atendidos"
            value="127"
            change={8}
            changeLabel="vs mes anterior"
            icon={Users}
            trend="up"
          />
          <MetricCard
            title="Procedimientos"
            value="185"
            change={-3}
            changeLabel="vs mes anterior"
            icon={Calendar}
            trend="down"
          />
          <MetricCard
            title="Ticket Promedio"
            value={formatCurrency(98425)}
            change={12}
            changeLabel="vs mes anterior"
            icon={Target}
            trend="up"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-semibold text-foreground">
                Tendencia de Ingresos
              </h3>
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="h-64 flex items-end gap-2">
              {[65, 78, 82, 70, 85, 92, 88, 95, 100, 98, 105, 110].map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-primary to-primary/70 rounded-t-md transition-all hover:from-primary/90 hover:to-primary/60"
                    style={{ height: `${value * 2}px` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-semibold text-foreground">
                Ingresos por Servicio
              </h3>
              <PieChart className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {serviceBreakdown.map((service) => (
                <div key={service.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{service.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{formatCurrency(service.revenue)}</span>
                      <span className="font-semibold text-foreground">{service.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all", service.color)}
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Productivity Table */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-semibold text-foreground">
              Productividad por Profesional
            </h3>
            <Button variant="outline" size="sm">Ver detalles</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Profesional</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Procedimientos</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Ingresos Generados</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Eficiencia</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {productivityData.map((item, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-medium text-foreground">{item.doctor}</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-foreground">{item.procedures}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-foreground">{formatCurrency(item.revenue)}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              item.efficiency >= 90 ? "bg-success" : 
                              item.efficiency >= 80 ? "bg-warning" : "bg-destructive"
                            )}
                            style={{ width: `${item.efficiency}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground">{item.efficiency}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        item.efficiency >= 90 ? "bg-success/10 text-success" : 
                        item.efficiency >= 80 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                      )}>
                        {item.efficiency >= 90 ? "Excelente" : item.efficiency >= 80 ? "Bueno" : "Mejorar"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-elevated p-6 text-center">
            <Clock className="w-8 h-8 mx-auto text-primary mb-3" />
            <p className="text-2xl font-display font-bold text-foreground">45 min</p>
            <p className="text-sm text-muted-foreground">Tiempo promedio por cita</p>
          </div>
          <div className="card-elevated p-6 text-center">
            <Target className="w-8 h-8 mx-auto text-success mb-3" />
            <p className="text-2xl font-display font-bold text-foreground">87%</p>
            <p className="text-sm text-muted-foreground">Tasa de ocupación</p>
          </div>
          <div className="card-elevated p-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-accent mb-3" />
            <p className="text-2xl font-display font-bold text-foreground">94%</p>
            <p className="text-sm text-muted-foreground">Pacientes recurrentes</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Finanzas;
