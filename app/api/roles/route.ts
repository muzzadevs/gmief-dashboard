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

// GET: Listar todos los roles
export async function GET(req: Request) {
  const token = getToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isSuperAdmin) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const roles = await prisma.rol.findMany({
    include: {
      cargos: {
        include: { cargo: { select: { id: true, cargo: true } } },
      },
      _count: { select: { permisos: true } },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ ok: true, data: roles });
}

// POST: Crear un nuevo rol
export async function POST(req: Request) {
  const token = getToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isSuperAdmin) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const { nombre, descripcion } = await req.json();
  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ ok: false, error: "El nombre es obligatorio" }, { status: 400 });
  }

  const existing = await prisma.rol.findUnique({ where: { nombre: nombre.trim() } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "Ya existe un rol con ese nombre" }, { status: 409 });
  }

  const rol = await prisma.rol.create({
    data: {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, data: rol });
}
