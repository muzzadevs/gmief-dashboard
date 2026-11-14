import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { compararCargos } from "@/lib/cargos";
import { registrarAuditoria } from "@/lib/auditoria";

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

// GET: Obtener un rol con sus permisos y cargos
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isSuperAdmin) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const { id } = await params;
  const rol = await prisma.rol.findUnique({
    where: { id: Number(id) },
    include: {
      permisos: {
        include: {
          modulo: { select: { id: true, nombre: true } },
          permiso: { select: { id: true, clave: true, nombre: true } },
        },
      },
      cargos: {
        include: { cargo: { select: { id: true, cargo: true } } },
      },
    },
  });

  if (!rol) {
    return NextResponse.json({ ok: false, error: "Rol no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      ...rol,
      cargos: [...rol.cargos].sort((a, b) =>
        compararCargos(a.cargo.cargo, b.cargo.cargo)
      ),
    },
  });
}

// PUT: Actualizar nombre y descripción del rol
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

  const rol = await prisma.rol.findUnique({ where: { id: Number(id) } });
  if (!rol) {
    return NextResponse.json({ ok: false, error: "Rol no encontrado" }, { status: 404 });
  }

  if (nombre && nombre.trim() !== rol.nombre) {
    const existing = await prisma.rol.findUnique({ where: { nombre: nombre.trim() } });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Ya existe un rol con ese nombre" }, { status: 409 });
    }
  }

  const updated = await prisma.rol.update({
    where: { id: Number(id) },
    data: {
      nombre: nombre?.trim() || rol.nombre,
      descripcion: descripcion !== undefined ? (descripcion?.trim() || null) : rol.descripcion,
    },
  });

  await registrarAuditoria(req, {
    accion: "EDITAR",
    entidad: "Rol",
    entidadId: updated.id,
    resumen: `Actualizó el rol ${updated.nombre}`,
    campos: ["nombre", "descripcion"],
    cambios: {
      ...(rol.nombre !== updated.nombre
        ? { nombre: { anterior: rol.nombre, nuevo: updated.nombre } }
        : {}),
      ...(rol.descripcion !== updated.descripcion
        ? {
            descripcion: {
              anterior: rol.descripcion,
              nuevo: updated.descripcion,
            },
          }
        : {}),
    },
  });

  return NextResponse.json({ ok: true, data: updated });
}

// DELETE: Eliminar un rol (solo si no es de sistema)
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
  const rol = await prisma.rol.findUnique({ where: { id: Number(id) } });

  if (!rol) {
    return NextResponse.json({ ok: false, error: "Rol no encontrado" }, { status: 404 });
  }

  if (rol.es_sistema) {
    return NextResponse.json(
      { ok: false, error: "No se pueden eliminar roles del sistema" },
      { status: 400 }
    );
  }

  await prisma.rol.delete({ where: { id: Number(id) } });
  await registrarAuditoria(req, {
    accion: "ELIMINAR",
    entidad: "Rol",
    entidadId: rol.id,
    resumen: `Eliminó el rol ${rol.nombre}`,
    campos: ["rol"],
  });
  return NextResponse.json({ ok: true });
}
