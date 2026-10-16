import { create } from "zustand";
import type { UserInfo, PermisosResueltos } from "@/types/auth";

const TOKEN_KEY = "__fc_auth_token";
const USER_KEY = "__fc_auth_user";

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** Guarda token + user info tras login exitoso */
  login: (token: string, user: UserInfo) => void;

  /** Limpia todo y redirige al login */
  logout: () => Promise<void>;

  /** Restaura sesión de localStorage (llamar al montar la app) */
  restoreSession: () => boolean;

  /** Devuelve el token actual */
  getToken: () => string | null;

  /** Comprueba si el usuario tiene un permiso concreto en un módulo */
  hasPermission: (moduloId: number, permisoClave: string) => boolean;

  /** Comprueba si el usuario tiene al menos permiso "ver" en un módulo */
  canAccessModule: (moduloId: number) => boolean;

  /** Actualiza los permisos del usuario (tras cambio de rol/cargos) */
  updatePermisos: (permisos: PermisosResueltos) => void;

  /** Marca que el cambio de password fue completado */
  markPasswordChanged: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (token: string, user: UserInfo) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    // Llamar a la API para borrar la cookie
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Si falla el fetch, igual limpiamos local
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  restoreSession: () => {
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return false;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (!token || !userStr) {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return false;
    }

    // Comprobar expiración del JWT sin verificar firma (solo decode)
    try {
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("Invalid JWT");
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expirado
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        return false;
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return false;
    }

    const user: UserInfo = JSON.parse(userStr);
    set({ token, user, isAuthenticated: true, isLoading: false });
    return true;
  },

  getToken: () => get().token,

  hasPermission: (moduloId: number, permisoClave: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    const permisos = user.permisos[moduloId];
    return permisos ? permisos.includes(permisoClave) : false;
  },

  canAccessModule: (moduloId: number) => {
    const { user } = get();
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    const permisos = user.permisos[moduloId];
    return permisos ? permisos.includes("ver") : false;
  },

  updatePermisos: (permisos: PermisosResueltos) => {
    const { user } = get();
    if (!user) return;
    const updatedUser = { ...user, permisos };
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
    set({ user: updatedUser });
  },

  markPasswordChanged: () => {
    const { user, token } = get();
    if (!user || !token) return;
    // Actualizar la info local (el token JWT sigue con mustChangePassword=true
    // hasta que se renueve, pero el frontend ya no mostrará el modal)
    const updatedUser = { ...user };
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
    set({ user: updatedUser });
  },
}));
