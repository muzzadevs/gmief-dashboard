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
  resumen: string;
  campos?: string[];
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

const CAMPOS_SENSIBLES = /dni|nie|password|contrase|imagen|blob|token|secret|hash/i;

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
  const detalles: Prisma.InputJsonObject = {
    ...(entrada.detalles ?? {}),
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
