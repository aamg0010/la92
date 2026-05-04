import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ClinicInfo } from "@/lib/api/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { Loader2, Mail, Lock, User, Briefcase, Building2, ArrowLeft, Key } from "lucide-react";

type UserRole = "admin" | "doctor" | "assistant" | "accountant";

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrador", description: "Acceso completo al sistema" },
  { value: "doctor", label: "Odontólogo", description: "Gestión de pacientes y citas" },
  { value: "assistant", label: "Auxiliar", description: "Soporte en consultorio" },
  { value: "accountant", label: "Contabilidad", description: "Gestión financiera" },
];

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("doctor");
  const [licenseCode, setLicenseCode] = useState("");
  const [error, setError] = useState("");
  const [showClinicSelector, setShowClinicSelector] = useState(false);
  const [clinicOptions, setClinicOptions] = useState<ClinicInfo[]>([]);

  const { signIn, signUp, selectClinic } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn(loginEmail, loginPassword);

    if (result.error) {
      setError(result.error.message);
      setIsLoading(false);
    } else if (result.needsClinicSelection && result.clinics?.length) {
      setClinicOptions(result.clinics);
      setShowClinicSelector(true);
      setIsLoading(false);
    } else {
      // Superadmin sin clinica va al panel admin, los demas al dashboard
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const hasClinic = !!localStorage.getItem('clinic_id');
      if (user.is_superadmin && !hasClinic) {
        navigate("/administracion");
      } else {
        navigate("/dashboard");
      }
    }
  };

  const handleSelectClinic = async (clinicId: string) => {
    setIsLoading(true);
    setError("");

    const { error } = await selectClinic(clinicId);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      navigate("/dashboard");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!licenseCode.trim()) {
      setError("Debes ingresar el código de licencia proporcionado por tu clínica");
      setIsLoading(false);
      return;
    }

    if (registerPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(registerEmail, registerPassword, registerName, licenseCode, registerRole);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      navigate("/dashboard");
    }
  };

  if (showClinicSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => { setShowClinicSelector(false); setClinicOptions([]); }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl">Selecciona tu clínica</CardTitle>
                  <CardDescription>
                    Tienes acceso a varias clínicas. Selecciona con cuál deseas trabajar.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}
              {clinicOptions.map((c) => (
                <button
                  key={c.clinic_id}
                  onClick={() => handleSelectClinic(c.clinic_id)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{c.role}</p>
                  </div>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <Card className="border-border/50 shadow-xl">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle className="text-xl">Bienvenido de vuelta</CardTitle>
                  <CardDescription>
                    Ingresa tus credenciales para acceder al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="doctor@clinica.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ingresando...
                      </>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardHeader>
                  <CardTitle className="text-xl">Crear cuenta</CardTitle>
                  <CardDescription>
                    Ingresa el código de licencia proporcionado por tu clínica
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="license-code">Código de Licencia</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="license-code"
                        type="text"
                        placeholder="DENT-XXXX-XXXX"
                        value={licenseCode}
                        onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                        className="pl-10 font-mono uppercase"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Solicita este código al administrador de tu clínica
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Dr. Juan Pérez"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="doctor@clinica.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-role">Rol en la clínica</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <Select value={registerRole} onValueChange={(value: UserRole) => setRegisterRole(value)}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Selecciona tu rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div>
                                <span className="font-medium">{role.label}</span>
                                <span className="text-muted-foreground ml-2 text-xs">
                                  — {role.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      "Crear Cuenta"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Al continuar, aceptas nuestros términos de servicio
        </p>
      </div>
    </div>
  );
};

export default Auth;
