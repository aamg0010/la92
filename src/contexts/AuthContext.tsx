import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService, User, AuthSession, ClinicInfo } from "@/lib/api/authService";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";

type AppRole = "admin" | "doctor" | "assistant" | "accountant" | "staff";

interface ClinicState {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  clinic: ClinicState | null;
  needsClinicSelection: boolean;
  availableClinics: ClinicInfo[];
  selectClinic: (clinicId: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, licenseCode: string, role?: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; needsClinicSelection?: boolean; clinics?: ClinicInfo[] }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [clinic, setClinic] = useState<ClinicState | null>(null);
  const [needsClinicSelection, setNeedsClinicSelection] = useState(false);
  const [availableClinics, setAvailableClinics] = useState<ClinicInfo[]>([]);
  const { toast } = useToast();

  // Restore clinic info from localStorage
  const restoreClinic = () => {
    const clinicId = localStorage.getItem('clinic_id');
    const clinicName = localStorage.getItem('clinic_name');
    const clinicSlug = localStorage.getItem('clinic_slug');
    if (clinicId) {
      setClinic({ id: clinicId, name: clinicName || '', slug: clinicSlug || '' });
    }
  };

  useEffect(() => {
    const { unsubscribe } = authService.onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        const token = localStorage.getItem('auth_token');
        setSession(token ? { user, access_token: token } : null);
        restoreClinic();
      } else {
        setSession(null);
        setClinic(null);
        setNeedsClinicSelection(false);
        setAvailableClinics([]);
      }
      setLoading(false);
    });

    authService.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      restoreClinic();
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, licenseCode: string, role: AppRole = "doctor") => {
    try {
      const { data, error } = await authService.signUp({
        email,
        password,
        licenseCode,
        role,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Set clinic info from registration response
      if (data.session?.clinic_id) {
        setClinic({
          id: data.session.clinic_id,
          name: data.session.clinic_name || '',
          slug: data.session.clinic_slug || '',
        });
      }

      toast({
        title: "Cuenta creada",
        description: "Tu cuenta ha sido creada exitosamente.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await authService.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const sess = data.session;

      if (sess?.needs_clinic_selection && sess.available_clinics?.length) {
        setNeedsClinicSelection(true);
        setAvailableClinics(sess.available_clinics);
        return { error: null, needsClinicSelection: true, clinics: sess.available_clinics };
      }

      // Single clinic or superadmin - auto-selected
      if (sess?.clinic_id) {
        setClinic({
          id: sess.clinic_id,
          name: sess.clinic_name || '',
          slug: sess.clinic_slug || '',
        });
      }
      setNeedsClinicSelection(false);

      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión correctamente.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const selectClinicFn = async (clinicId: string) => {
    try {
      const { data, error } = await authService.selectClinic(clinicId);
      if (error) throw error;

      if (data) {
        setClinic({
          id: data.clinic_id,
          name: data.name,
          slug: data.slug,
          logo_url: data.logo_url,
        });
      }
      setNeedsClinicSelection(false);
      setAvailableClinics([]);

      toast({
        title: "Bienvenido",
        description: `Has ingresado a ${data?.name || 'la clínica'}.`,
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setClinic(null);
    setNeedsClinicSelection(false);
    setAvailableClinics([]);
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    });
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, clinic, needsClinicSelection, availableClinics,
      selectClinic: selectClinicFn, signUp, signIn, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
