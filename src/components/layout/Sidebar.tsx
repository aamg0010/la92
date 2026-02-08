import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoImage from "@/assets/logo-la92.png";
import { 
  Calendar, 
  Users, 
  LayoutDashboard, 
  Settings, 
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Receipt,
  Wallet,
  Package,
  Factory,
  Shield,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, useUserProfile, ROLE_LABELS, hasPermission, type AppRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: Users, label: "Pacientes", path: "/pacientes" },
  { icon: FileText, label: "Tratamientos", path: "/tratamientos" },
  { icon: Package, label: "Inventario", path: "/inventario" },
  { icon: Factory, label: "Laboratorios", path: "/laboratorios" },
  { icon: TrendingUp, label: "Rentabilidad", path: "/finanzas" },
  { icon: Receipt, label: "Facturación", path: "/facturacion", badge: "DIAN" },
  { icon: Wallet, label: "Cobros", path: "/cobros" },
  { icon: Sparkles, label: "Asistente IA", path: "/asistente-ia", isAI: true },
  { icon: Settings, label: "Configuración", path: "/configuracion" },
  { icon: Shield, label: "Administración", path: "/administracion", adminOnly: true },
];

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  doctor: "bg-primary/10 text-primary border-primary/20",
  assistant: "bg-accent/10 text-accent border-accent/20",
  accountant: "bg-success/10 text-success border-success/20",
};

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const filteredMenuItems = menuItems.filter(item => 
    hasPermission(role, item.path)
  );

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  const userName = profile?.full_name || user?.email?.split('@')[0] || "Usuario";
  const roleLabel = role ? ROLE_LABELS[role] : "Sin rol";

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
          <img 
            src={logoImage} 
            alt="La 92" 
            className="w-12 h-12 rounded-xl object-contain flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-display text-lg font-semibold text-sidebar-primary-foreground truncate">
              La 92
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate">
              Odontología Integral
            </span>
          </div>
        </div>
        
        {isCollapsed && (
          <img 
            src={logoImage} 
            alt="La 92" 
            className="w-10 h-10 rounded-xl object-contain mx-auto"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {roleLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-sidebar-foreground/50" />
          </div>
        ) : (
          filteredMenuItems.map((item) => {
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
          })
        )}
      </nav>

      {/* User Profile Section */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer",
                isCollapsed && "justify-center"
              )}
            >
              <Avatar className="w-9 h-9 ring-2 ring-sidebar-primary ring-offset-2 ring-offset-sidebar">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {profileLoading ? "..." : userInitials}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "flex-1 min-w-0 text-left transition-all duration-300",
                isCollapsed && "hidden"
              )}>
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profileLoading ? "Cargando..." : userName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {role && (
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] px-1.5 py-0 h-4 border", ROLE_COLORS[role])}
                    >
                      {roleLabel}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {role && (
                  <Badge 
                    variant="outline" 
                    className={cn("w-fit text-xs mt-1", ROLE_COLORS[role])}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {roleLabel}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
