import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  PERMISO_EDITAR_POR_ZONA,
  type JwtPayload,
  type PermisosResueltos,
} from "@/types/auth";
import { prisma } from "@/lib/prisma";

// ── Constantes ──

export const DEFAULT_PASSWORD = "filadelfiaconecta";
export const SUPERADMIN_USERNAME = "admin";
export const SUPERADMIN_PASSWORD = "KaleDorKayikoVizarraga";
export const JWT_EXPIRATION = "7d";
export const COOKIE_NAME = "fc_auth_token";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días en segundos
const BCRYPT_ROUNDS = 10;

export interface ZonaScope {
  zonaId: number;
  subzonaId: number | null;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurada en las variables de entorno.");
  }
  return secret;
}

// ── Password hashing ──

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── JWT ──

export function generateToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRATION });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

// ── Super admin check ──

export function isSuperAdminCredentials(username: string, password: string): boolean {
  return username === SUPERADMIN_USERNAME && password === SUPERADMIN_PASSWORD;
}

// ── Resolver permisos de un ministerio ──

export async function resolverPermisos(ministerioId: number): Promise<PermisosResueltos> {
  // 1. Obtener cargo_ids del ministerio
  const cargos = await prisma.ministerioCargo.findMany({
    where: { ministerio_id: ministerioId },
    select: { cargo_id: true },
  });
  const cargoIds = cargos.map((c) => c.cargo_id);

  if (cargoIds.length === 0) return {};

  // 2. Obtener rol_ids de esos cargos
  const rolCargos = await prisma.rolCargo.findMany({
    where: { cargo_id: { in: cargoIds } },
    select: { rol_id: true },
  });
  const rolIds = [...new Set(rolCargos.map((rc) => rc.rol_id))];

  if (rolIds.length === 0) return {};

  // 3. Obtener permisos de esos roles
  const asignaciones = await prisma.rolModuloPermiso.findMany({
    where: { rol_id: { in: rolIds } },
    include: {
      permiso: { select: { clave: true } },
    },
  });

  // 4. Merge por módulo (unión de permisos)
  const merged: PermisosResueltos = {};
  for (const a of asignaciones) {
    if (!merged[a.modulo_id]) {
      merged[a.modulo_id] = [];
    }
    if (!merged[a.modulo_id].includes(a.permiso.clave)) {
      merged[a.modulo_id].push(a.permiso.clave);
    }
  }

  return merged;
}

export async function resolverAlcanceZona(request: Request): Promise<ZonaScope | null> {
  const cookieToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const payload = verifyToken(cookieToken || bearerToken || "");

  if (!payload || payload.isSuperAdmin || payload.ministerioId === null) {
    return null;
  }

  const modulo = await prisma.modulo.findFirst({
    where: { href: "/modulos/gestion-ministerios" },
    select: { id: true },
  });
  if (!modulo) {
    throw new Error("No se encontró el módulo de Gestión de Ministerios.");
  }

  const permisos = await resolverPermisos(payload.ministerioId);
  if (!permisos[modulo.id]?.includes(PERMISO_EDITAR_POR_ZONA)) {
    return null;
  }

  const ministerio = await prisma.ministerio.findUnique({
    where: { id: payload.ministerioId },
    select: {
      iglesia: { select: { zona_id: true, subzona_id: true } },
    },
  });

  if (!ministerio) {
    throw new Error("No se encontró el ministerio del usuario autenticado.");
  }

  return {
    zonaId: ministerio.iglesia.zona_id,
    subzonaId: ministerio.iglesia.subzona_id,
  };
}

export async function ministerioDentroDeAlcance(
  scope: ZonaScope | null,
  ministerioId: number
): Promise<boolean> {
  if (!scope) return true;

  const ministerio = await prisma.ministerio.findFirst({
    where: {
      id: ministerioId,
      iglesia: {
        zona_id: scope.zonaId,
        ...(scope.subzonaId ? { subzona_id: scope.subzonaId } : {}),
      },
    },
    select: { id: true },
  });
  return ministerio !== null;
}

// ── Generar username para candidatos ──

/**
 * Normaliza un nombre para usar como parte de username:
 * mayúsculas, sin acentos, sin caracteres especiales, sin espacios
 */
export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^A-Za-z0-9]/g, "")   // solo alfanuméricos
    .toUpperCase();
}

/**
 * Genera el código/username temporal para un candidato.
 * Formato: CODIGOZONA + NOMBRE_NORMALIZADO + ID_EN_BD
 */
export function generarCodigoCandidato(codigoZona: string, nombre: string, idBdd: number): string {
  const nombreNorm = normalizarNombre(nombre);
  return `${codigoZona.toUpperCase()}${nombreNorm}${idBdd}`;
}

// ── Cookie helpers ──

export function buildAuthCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    `SameSite=Lax`,
    `HttpOnly`,
  ];
  if (isProduction) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function buildClearAuthCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
}
