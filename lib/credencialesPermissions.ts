import { NextResponse } from "next/server";
import { COOKIE_NAME, resolverPermisos, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CredencialesPermission = "crear" | "solicitar";

export async function requireCredencialesPermission(
  request: Request,
  permission: CredencialesPermission
): Promise<NextResponse | null> {
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
  const token = cookieToken || bearerToken;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    return NextResponse.json({ ok: false, error: "NO_AUTH" }, { status: 401 });
  }

  if (payload.isSuperAdmin) return null;

  if (!payload.ministerioId) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const [ministerio, modulo] = await Promise.all([
    prisma.ministerio.findUnique({
      where: { id: payload.ministerioId },
      select: { activo: true },
    }),
    prisma.modulo.findFirst({
      where: { href: "/modulos/gestor-credenciales", activo: true },
      select: { id: true },
    }),
  ]);

  if (!ministerio?.activo || !modulo) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const permisos = await resolverPermisos(payload.ministerioId);
  if (!permisos[modulo.id]?.includes(permission)) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  return null;
}
