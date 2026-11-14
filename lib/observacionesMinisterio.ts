import { NextResponse } from "next/server";
import { COOKIE_NAME, resolverPermisos, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERMISOS_EDITAR_POR_ZONA } from "@/types/auth";

type ContextoObservaciones = {
  zonaId: number | null;
  autorId: number | null;
  autorNombre: string;
  autorUsername: string;
};

type ResultadoAccesoObservaciones =
  | { ok: true; contexto: ContextoObservaciones }
  | { ok: false; response: NextResponse };

function obtenerToken(request: Request): string | null {
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

export async function verificarAccesoObservaciones(
  request: Request
): Promise<ResultadoAccesoObservaciones> {
  const payload = verifyToken(obtenerToken(request) || "");
  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "NO_AUTH" }, { status: 401 }),
    };
  }

  if (payload.isSuperAdmin) {
    return {
      ok: true,
      contexto: {
        zonaId: null,
        autorId: null,
        autorNombre: "Administrador Sistema",
        autorUsername: payload.username,
      },
    };
  }

  if (!payload.ministerioId) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 }),
    };
  }

  const [ministerio, modulo] = await Promise.all([
    prisma.ministerio.findUnique({
      where: { id: payload.ministerioId },
      select: {
        activo: true,
        nombre: true,
        apellidos: true,
        username: true,
        iglesia: { select: { zona_id: true } },
      },
    }),
    prisma.modulo.findFirst({
      where: { href: "/modulos/gestion-ministerios", activo: true },
      select: { id: true },
    }),
  ]);

  if (!ministerio?.activo || !modulo) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 }),
    };
  }

  const permisos = await resolverPermisos(payload.ministerioId);
  const tienePermisoZona = PERMISOS_EDITAR_POR_ZONA.some((permiso) =>
    permisos[modulo.id]?.includes(permiso)
  );
  if (!tienePermisoZona) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    contexto: {
      zonaId: ministerio.iglesia.zona_id,
      autorId: payload.ministerioId,
      autorNombre:
        [ministerio.nombre, ministerio.apellidos].filter(Boolean).join(" ") ||
        payload.username,
      autorUsername: ministerio.username || payload.username,
    },
  };
}

export function leerTextoObservacion(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("observacion" in body)) return null;
  const observacion = body.observacion;
  if (typeof observacion !== "string") return null;
  const texto = observacion.trim();
  return texto.length > 0 && texto.length <= 255 ? texto : null;
}
