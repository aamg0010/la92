import { Plus, UserPlus, CalendarPlus, FileText, Receipt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actions = [
  {
    icon: CalendarPlus,
    label: "Nueva Cita",
    description: "Agendar paciente",
    variant: "primary" as const,
  },
  {
    icon: UserPlus,
    label: "Nuevo Paciente",
    description: "Registrar paciente",
    variant: "default" as const,
  },
  {
    icon: FileText,
    label: "Historia Clínica",
    description: "Crear expediente",
    variant: "default" as const,
  },
  {
    icon: Receipt,
    label: "Nuevo Pago",
    description: "Registrar cobro",
    variant: "default" as const,
  },
  {
    icon: Sparkles,
    label: "Consultar IA",
    description: "Asistente dental",
    variant: "accent" as const,
  },
];

const buttonVariants = {
  default: "bg-card hover:bg-muted border-border hover:border-primary/30",
  primary: "bg-primary/10 hover:bg-primary/20 border-primary/30 hover:border-primary/50",
  accent: "bg-accent/10 hover:bg-accent/20 border-accent/30 hover:border-accent/50",
};

const iconVariants = {
  default: "bg-muted text-muted-foreground group-hover:text-primary",
  primary: "bg-primary/20 text-primary",
  accent: "bg-accent/20 text-accent",
};

export function QuickActions() {
  return (
    <div className="card-elevated p-6">
      <h3 className="font-display text-xl font-semibold text-foreground mb-4">
        Acciones Rápidas
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              className={cn(
                "group flex flex-col items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-medium",
                buttonVariants[action.variant]
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                iconVariants[action.variant]
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm text-foreground">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
