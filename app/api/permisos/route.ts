import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

function getToken(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieToken = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return cookieToken || bearerToken || null;
}

// GET: Listar todos los permisos disponibles
export async function GET(req: Request) {
  const token = getToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isSuperAdmin) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const permisos = await prisma.permiso.findMany({ orderBy: { orden: "asc" } });
  return NextResponse.json({ ok: true, data: permisos });
}

// POST: Crear un nuevo permiso
export async function POST(req: Request) {
  const token = getToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isSuperAdmin) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const { clave, nombre, descripcion } = await req.json();

  if (!clave || !nombre) {
    return NextResponse.json({ ok: false, error: "Clave y nombre son obligatorios" }, { status: 400 });
  }

  const claveNorm = clave.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");

  const existing = await prisma.permiso.findUnique({ where: { clave: claveNorm } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "Ya existe un permiso con esa clave" }, { status: 409 });
  }

  // Obtener el máximo orden actual
  const maxOrden = await prisma.permiso.aggregate({ _max: { orden: true } });

  const permiso = await prisma.permiso.create({
    data: {
      clave: claveNorm,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      orden: (maxOrden._max.orden ?? 0) + 1,
    },
  });

  return NextResponse.json({ ok: true, data: permiso });
}
