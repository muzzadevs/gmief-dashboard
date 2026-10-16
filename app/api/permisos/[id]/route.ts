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

// PUT: Actualizar nombre/descripción de un permiso
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isSuperAdmin) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const { id } = await params;
  const { nombre, descripcion } = await req.json();

  const updated = await prisma.permiso.update({
    where: { id: Number(id) },
    data: {
      ...(nombre ? { nombre: nombre.trim() } : {}),
      ...(descripcion !== undefined ? { descripcion: descripcion?.trim() || null } : {}),
    },
  });

  return NextResponse.json({ ok: true, data: updated });
}

// DELETE: Eliminar un permiso (solo si no es de sistema)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isSuperAdmin) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const { id } = await params;
  const permiso = await prisma.permiso.findUnique({ where: { id: Number(id) } });

  if (!permiso) {
    return NextResponse.json({ ok: false, error: "Permiso no encontrado" }, { status: 404 });
  }

  if (permiso.es_sistema) {
    return NextResponse.json(
      { ok: false, error: "No se pueden eliminar permisos del sistema" },
      { status: 400 }
    );
  }

  // Eliminar en cascada las asignaciones y el permiso
  await prisma.$transaction(async (tx) => {
    await tx.rolModuloPermiso.deleteMany({ where: { permiso_id: Number(id) } });
    await tx.permiso.delete({ where: { id: Number(id) } });
  });

  return NextResponse.json({ ok: true });
}
