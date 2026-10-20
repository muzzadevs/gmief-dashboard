import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, resolverPermisos, COOKIE_NAME } from "@/lib/auth";
import type { UserInfo } from "@/types/auth";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieToken = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const token = cookieToken || bearerToken;
  if (!token) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "Token inválido o expirado" }, { status: 401 });
  }

  // Super admin
  if (payload.isSuperAdmin) {
    const modulos = await prisma.modulo.findMany({ where: { activo: true }, select: { id: true } });
    const permisos = await prisma.permiso.findMany({ select: { clave: true } });
    const permisosClaves = permisos.map((p) => p.clave);
    const allPermisos: Record<number, string[]> = {};
    for (const m of modulos) {
      allPermisos[m.id] = permisosClaves;
    }

    const user: UserInfo = {
      ministerioId: null,
      username: payload.username,
      nombre: "Administrador",
      apellidos: "Sistema",
      isSuperAdmin: true,
      zonaId: null,
      subzonaId: null,
      permisos: allPermisos,
    };
    return NextResponse.json({ ok: true, user });
  }

  // Ministerio normal
  const ministerio = await prisma.ministerio.findUnique({
    where: { id: payload.ministerioId! },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      username: true,
      must_change_password: true,
      iglesia: { select: { zona_id: true, subzona_id: true } },
    },
  });

  if (!ministerio) {
    return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
  }

  const permisos = await resolverPermisos(ministerio.id);

  const user: UserInfo = {
    ministerioId: ministerio.id,
    username: ministerio.username!,
    nombre: ministerio.nombre,
    apellidos: ministerio.apellidos,
    isSuperAdmin: false,
    zonaId: ministerio.iglesia.zona_id,
    subzonaId: ministerio.iglesia.subzona_id,
    permisos,
  };

  return NextResponse.json({ ok: true, user, mustChangePassword: ministerio.must_change_password });
}
