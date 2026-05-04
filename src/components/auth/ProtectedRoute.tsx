import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, hasPermission, type AppRole } from "@/hooks/useUserRole";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { data: role, isLoading: roleLoading } = useUserRole();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Superadmin bypasses all role restrictions
  if (user.is_superadmin) {
    return <>{children}</>;
  }

  // Check role-based access
  if (role && !hasPermission(role, location.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Acceso Restringido</h1>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a esta sección. 
            Contacta al administrador si crees que deberías tener acceso.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  // Check specific required roles if provided
  if (requiredRoles && role && !requiredRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Rol Insuficiente</h1>
          <p className="text-muted-foreground">
            Esta sección requiere permisos específicos que no tienes asignados.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
