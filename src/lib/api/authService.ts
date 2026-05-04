/**
 * Authentication Service for JWT-based auth
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  role?: string;
  is_superadmin?: boolean;
}

export interface ClinicInfo {
  clinic_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  role: string;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  clinic_id?: string;
  clinic_name?: string;
  clinic_slug?: string;
  needs_clinic_selection?: boolean;
  available_clinics?: ClinicInfo[];
}

export interface AuthResponse {
  data: {
    user: User | null;
    session: AuthSession | null;
  };
  error: Error | null;
}

class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    // Try to restore session from localStorage
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');

    if (token && userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch {
        this.clearSession();
      }
    }
  }

  private saveSession(user: User, token: string, clinicData?: {
    clinic_id?: string;
    clinic_name?: string;
    clinic_slug?: string;
  }): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    if (clinicData?.clinic_id) {
      localStorage.setItem('clinic_id', clinicData.clinic_id);
      localStorage.setItem('clinic_name', clinicData.clinic_name || '');
      localStorage.setItem('clinic_slug', clinicData.clinic_slug || '');
    }
    this.currentUser = user;
    this.notifyListeners();
  }

  private clearSession(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('clinic_id');
    localStorage.removeItem('clinic_name');
    localStorage.removeItem('clinic_slug');
    this.currentUser = null;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.currentUser);

    return {
      unsubscribe: () => {
        this.listeners.delete(callback);
      },
    };
  }

  async signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/rpc/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          p_email: credentials.email,
          p_password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error de autenticación');
      }

      const result = await response.json();

      if (!result || !result.token) {
        throw new Error('Credenciales inválidas');
      }

      const user: User = {
        id: result.user_id,
        email: result.email || credentials.email,
        role: result.role,
        is_superadmin: result.is_superadmin || false,
      };

      const clinicData = result.clinic_id ? {
        clinic_id: result.clinic_id,
        clinic_name: result.clinic_name,
        clinic_slug: result.clinic_slug,
      } : undefined;

      this.saveSession(user, result.token, clinicData);

      // Parse available clinics for multi-clinic users
      const availableClinics: ClinicInfo[] = result.clinics || [];

      return {
        data: {
          user,
          session: {
            user,
            access_token: result.token,
            clinic_id: result.clinic_id,
            clinic_name: result.clinic_name,
            clinic_slug: result.clinic_slug,
            needs_clinic_selection: result.needs_clinic_selection || false,
            available_clinics: availableClinics,
          },
        },
        error: null,
      };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: error as Error,
      };
    }
  }

  async signUp(credentials: {
    email: string;
    password: string;
    licenseCode: string;
    role?: string;
    options?: {
      data?: {
        full_name?: string;
      };
    };
  }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/rpc/register_with_license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          p_email: credentials.email,
          p_password: credentials.password,
          p_full_name: credentials.options?.data?.full_name || '',
          p_license_code: credentials.licenseCode,
          p_role: credentials.role || 'doctor',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear cuenta');
      }

      const result = await response.json();

      if (!result || !result.token) {
        throw new Error('Error al crear cuenta');
      }

      const user: User = {
        id: result.user_id,
        email: credentials.email,
        role: result.role,
      };

      const clinicData = result.clinic_id ? {
        clinic_id: result.clinic_id,
        clinic_name: result.clinic_name,
        clinic_slug: result.clinic_slug,
      } : undefined;

      this.saveSession(user, result.token, clinicData);

      return {
        data: {
          user,
          session: {
            user,
            access_token: result.token,
            clinic_id: result.clinic_id,
            clinic_name: result.clinic_name,
            clinic_slug: result.clinic_slug,
          },
        },
        error: null,
      };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: error as Error,
      };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const token = localStorage.getItem('auth_token');

      if (token) {
        await fetch(`${API_URL}/rpc/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': token,
          },
        }).catch(() => {
          // Ignore errors - we'll clear session anyway
        });
      }

      this.clearSession();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async selectClinic(clinicId: string): Promise<{ data: ClinicInfo | null; error: Error | null }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No hay sesión activa');

      const response = await fetch(`${API_URL}/rpc/select_clinic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token,
        },
        body: JSON.stringify({ p_clinic_id: clinicId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al seleccionar clínica');
      }

      const result = await response.json();

      // Update localStorage with selected clinic
      localStorage.setItem('clinic_id', result.clinic_id);
      localStorage.setItem('clinic_name', result.clinic_name || '');
      localStorage.setItem('clinic_slug', result.clinic_slug || '');

      // Update user role based on clinic role
      if (this.currentUser) {
        this.currentUser.role = result.role;
        localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
      }

      this.notifyListeners();

      return {
        data: {
          clinic_id: result.clinic_id,
          name: result.clinic_name,
          slug: result.clinic_slug,
          logo_url: result.clinic_logo_url,
          role: result.role,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getUser(): Promise<{ data: { user: User | null }; error: Error | null }> {
    const token = localStorage.getItem('auth_token');

    if (!token || !this.currentUser) {
      return { data: { user: null }, error: null };
    }

    try {
      const response = await fetch(`${API_URL}/rpc/get_current_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token,
        },
      });

      if (!response.ok) {
        this.clearSession();
        return { data: { user: null }, error: null };
      }

      const userData = await response.json();
      if (userData && userData.id) {
        this.currentUser = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          is_superadmin: userData.is_superadmin || false,
        };
        localStorage.setItem('auth_user', JSON.stringify(this.currentUser));

        // Update clinic info if present
        if (userData.clinic_id) {
          localStorage.setItem('clinic_id', userData.clinic_id);
          localStorage.setItem('clinic_name', userData.clinic_name || '');
          localStorage.setItem('clinic_slug', userData.clinic_slug || '');
        }
      } else {
        this.clearSession();
        return { data: { user: null }, error: null };
      }

      return { data: { user: this.currentUser }, error: null };
    } catch {
      return { data: { user: this.currentUser }, error: null };
    }
  }

  async getSession(): Promise<{ data: { session: AuthSession | null }; error: Error | null }> {
    const token = localStorage.getItem('auth_token');

    if (!token || !this.currentUser) {
      return { data: { session: null }, error: null };
    }

    return {
      data: {
        session: {
          user: this.currentUser,
          access_token: token,
        },
      },
      error: null,
    };
  }

  async updateUser(updates: {
    password?: string;
    data?: Record<string, unknown>;
  }): Promise<{ data: { user: User | null }; error: Error | null }> {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`${API_URL}/rpc/update_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token,
        },
        body: JSON.stringify({
          p_password: updates.password,
          p_data: updates.data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar usuario');
      }

      return { data: { user: this.currentUser }, error: null };
    } catch (error) {
      return { data: { user: null }, error: error as Error };
    }
  }

  async resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch(`${API_URL}/rpc/request_password_reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_email: email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al enviar email de recuperación');
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Get current user synchronously (from cache)
  get user(): User | null {
    return this.currentUser;
  }
}

export const authService = new AuthService();
export default authService;
