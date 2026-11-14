import { Prisma } from "@/generated/prisma/client";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AccionAuditoria =
  | "CREAR"
  | "EDITAR"
  | "ELIMINAR"
  | "BAJA"
  | "REACTIVAR"
  | "ASIGNAR"
  | "APROBAR"
  | "EXPEDIR"
  | "CAMBIO_PASSWORD"
  | "PASSWORD_RESET";

interface EntradaAuditoria {
  accion: AccionAuditoria;
  entidad: string;
  entidadId?: string | number | null;
  identificacion?: string;
  resumen: string;
  campos?: string[];
  cambios?: Record<string, { anterior: string | null; nuevo: string | null }>;
  detalles?: Prisma.InputJsonObject;
}

function getToken(request: Request): string | null {
  const cookieToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  return cookieToken || bearerToken || null;
}

const CAMPOS_SENSIBLES =
  /dni|nie|password|contrase|imagen|blob|token|secret|hash|telefono|email|direccion|fecha_nac|_id$|^id$/i;

function etiquetaMinisterio(ministerio: {
  nombre: string;
  apellidos: string | null;
  codigo: string | null;
}): string {
  const nombre = [ministerio.nombre, ministerio.apellidos].filter(Boolean).join(" ");
  return ministerio.codigo ? `${nombre} · Código ${ministerio.codigo}` : nombre;
}

export async function resolverIdentificacionAuditoria(
  entidad: string,
  entidadId: string | number | null | undefined
): Promise<string | null> {
  if (entidadId == null) return null;
  const id = Number(entidadId);
  if (!Number.isSafeInteger(id) || id < 1) return null;

  if (
    ["Ministerio", "Candidato", "Usuario", "Cargos de ministerio", "Imagen de ministerio"].includes(
      entidad
    )
  ) {
    const ministerio = await prisma.ministerio.findUnique({
      where: { id },
      select: { nombre: true, apellidos: true, codigo: true },
    });
    return ministerio ? etiquetaMinisterio(ministerio) : null;
  }

  if (entidad === "Iglesia") {
    const iglesia = await prisma.iglesia.findUnique({
      where: { id },
      select: { nombre: true, zona: { select: { codigo: true } } },
    });
    return iglesia ? `${iglesia.nombre} · Zona ${iglesia.zona.codigo}` : null;
  }

  if (entidad === "Zona") {
    const zona = await prisma.zona.findUnique({
      where: { id },
      select: { nombre: true, codigo: true },
    });
    return zona ? `${zona.nombre} · Código ${zona.codigo}` : null;
  }

  if (entidad === "Subzona") {
    const subzona = await prisma.subzona.findUnique({
      where: { id },
      select: { nombre: true, zona: { select: { nombre: true } } },
    });
    return subzona ? `${subzona.nombre} · Zona ${subzona.zona.nombre}` : null;
  }

  if (["Rol", "Permisos de rol", "Cargos de rol"].includes(entidad)) {
    const rol = await prisma.rol.findUnique({ where: { id }, select: { nombre: true } });
    return rol?.nombre ?? null;
  }

  if (entidad === "Permiso") {
    const permiso = await prisma.permiso.findUnique({
      where: { id },
      select: { nombre: true, clave: true },
    });
    return permiso ? `${permiso.nombre} · ${permiso.clave}` : null;
  }

  if (entidad === "Histórico de ministerio") {
    const historico = await prisma.ministerioHistorico.findUnique({
      where: { id },
      select: {
        ministerio: { select: { nombre: true, apellidos: true, codigo: true } },
      },
    });
    return historico ? etiquetaMinisterio(historico.ministerio) : null;
  }

  if (entidad === "Credencial") {
    const credencial = await prisma.solicitudCredencialItem.findUnique({
      where: { id },
      select: {
        ministerio: { select: { nombre: true, apellidos: true, codigo: true } },
      },
    });
    return credencial ? etiquetaMinisterio(credencial.ministerio) : null;
  }

  if (entidad === "Solicitud de credenciales") {
    const solicitud = await prisma.solicitudCredencial.findUnique({
      where: { id },
      select: {
        items: {
          select: {
            ministerio: { select: { nombre: true, apellidos: true, codigo: true } },
          },
        },
      },
    });
    return solicitud
      ? solicitud.items.map((item) => etiquetaMinisterio(item.ministerio)).join(", ") ||
          "Sin personas asignadas"
      : null;
  }

  return null;
}

export async function registrarAuditoria(
  request: Request,
  entrada: EntradaAuditoria
): Promise<void> {
  const payload = verifyToken(getToken(request) || "");
  if (!payload) {
    throw new Error("No se pudo identificar al usuario para registrar la auditoría");
  }

  const actor = payload.ministerioId
    ? await prisma.ministerio.findUnique({
        where: { id: payload.ministerioId },
        select: { nombre: true, apellidos: true },
      })
    : null;
  const actorNombre = payload.isSuperAdmin
    ? "Administrador"
    : [actor?.nombre, actor?.apellidos].filter(Boolean).join(" ") || payload.username;
  const identificacion =
    entrada.identificacion ??
    (await resolverIdentificacionAuditoria(entrada.entidad, entrada.entidadId));
  const detalles: Prisma.InputJsonObject = {
    ...(entrada.detalles ?? {}),
    ...(identificacion ? { identificacion } : {}),
    ...(entrada.cambios
      ? {
          cambios: Object.fromEntries(
            Object.entries(entrada.cambios).filter(([campo]) => !CAMPOS_SENSIBLES.test(campo))
          ),
        }
      : {}),
    ...(entrada.campos
      ? {
          campos: [...new Set(entrada.campos)]
            .filter((campo) => !CAMPOS_SENSIBLES.test(campo))
            .sort(),
        }
      : {}),
  };

  await prisma.auditoria.create({
    data: {
      actor_id: payload.ministerioId,
      actor_username: payload.username,
      actor_nombre: actorNombre.slice(0, 150),
      accion: entrada.accion,
      entidad: entrada.entidad.slice(0, 100),
      entidad_id: entrada.entidadId == null ? null : String(entrada.entidadId).slice(0, 100),
      resumen: entrada.resumen.slice(0, 500),
      detalles,
      metodo: request.method.slice(0, 10),
      ruta: new URL(request.url).pathname.slice(0, 255),
    },
  });
}
