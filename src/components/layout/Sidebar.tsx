import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Receipt,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: Users, label: "Pacientes", path: "/pacientes" },
  { icon: FileText, label: "Tratamientos", path: "/tratamientos" },
  { icon: TrendingUp, label: "Rentabilidad", path: "/finanzas" },
  { icon: Receipt, label: "Facturación", path: "/facturacion", badge: "DIAN" },
  { icon: Wallet, label: "Cobros", path: "/cobros" },
  { icon: Sparkles, label: "Asistente IA", path: "/asistente-ia", isAI: true },
  { icon: MessageSquare, label: "Mensajes", path: "/mensajes" },
  { icon: Settings, label: "Configuración", path: "/configuracion" },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 overflow-hidden transition-all duration-300",
          isCollapsed && "opacity-0 w-0"
        )}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-sidebar-primary-foreground">92</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-display text-lg font-semibold text-sidebar-primary-foreground truncate">
              La 92
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate">
              Consultorio Odontológico
            </span>
          </div>
        </div>
        
        {isCollapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
            <span className="text-xl font-bold text-sidebar-primary-foreground">92</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const linkContent = (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item group relative",
                isActive && "active",
                item.isAI && !isActive && "text-accent hover:text-accent"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground",
                  item.isAI && !isActive && "text-accent"
                )} 
              />
              <span
                className={cn(
                  "transition-all duration-300 truncate",
                  isCollapsed ? "opacity-0 w-0" : "opacity-100"
                )}
              >
                {item.label}
              </span>
              {item.isAI && (
                <span className={cn(
                  "ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent",
                  isCollapsed && "hidden"
                )}>
                  IA
                </span>
              )}
              {item.badge && !item.isAI && (
                <span className={cn(
                  "ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success",
                  isCollapsed && "hidden"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-sans">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer",
          isCollapsed && "justify-center"
        )}>
          <Avatar className="w-9 h-9 ring-2 ring-sidebar-primary ring-offset-2 ring-offset-sidebar">
            <AvatarImage src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=faces" alt="Dra. Ana María Rios Grajales" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">AR</AvatarFallback>
          </Avatar>
          <div className={cn(
            "flex-1 min-w-0 transition-all duration-300",
            isCollapsed && "hidden"
          )}>
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              Dra. Ana María Rios
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              Odontóloga General
            </p>
          </div>
          <LogOut className={cn(
            "w-4 h-4 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors",
            isCollapsed && "hidden"
          )} />
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-medium flex items-center justify-center hover:bg-muted transition-colors z-50"
        aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
}
