import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No autenticado
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // No es superadmin
  if (!user.is_superadmin) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
