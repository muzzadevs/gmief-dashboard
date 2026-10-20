// ── Tipos de autenticación ──

export interface JwtPayload {
  /** ID del ministerio en BD (null para admin maestro) */
  ministerioId: number | null;
  /** Username usado para login */
  username: string;
  /** true si es el admin maestro fuera de la tabla ministerios */
  isSuperAdmin: boolean;
  /** true si debe cambiar la contraseña al entrar */
  mustChangePassword: boolean;
  /** Timestamp de emisión (epoch seconds) */
  iat?: number;
  /** Timestamp de expiración (epoch seconds) */
  exp?: number;
}

export interface LoginResponse {
  ok: boolean;
  token?: string;
  user?: UserInfo;
  mustChangePassword?: boolean;
  error?: string;
}

export interface UserInfo {
  ministerioId: number | null;
  username: string;
  nombre: string;
  apellidos: string | null;
  isSuperAdmin: boolean;
  zonaId: number | null;
  subzonaId: number | null;
  permisos: PermisosResueltos;
}

/** Mapa moduloId → array de claves de permiso que tiene el usuario */
export type PermisosResueltos = Record<number, string[]>;

export const PERMISO_EDITAR_POR_ZONA = "editarporzona";

export function tienePermisoEditarPorZona(permisos: PermisosResueltos): boolean {
  return Object.values(permisos).some((claves) =>
    claves.includes(PERMISO_EDITAR_POR_ZONA)
  );
}

// ── Tipos de roles y permisos ──

export interface RolInfo {
  id: number;
  nombre: string;
  descripcion: string | null;
  es_sistema: boolean;
}

export interface PermisoInfo {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
  es_sistema: boolean;
  orden: number;
}

export interface RolModuloPermisoInfo {
  moduloId: number;
  moduloNombre: string;
  permisos: string[]; // claves de permisos concedidos
}

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  apellidos: string | null;
  username: string | null;
  codigo: string | null;
  tipo: string;
  activo: boolean;
  must_change_password: boolean;
  cargos: string[];
  roles: string[];
}
