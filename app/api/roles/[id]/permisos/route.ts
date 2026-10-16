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

// GET: Obtener la matriz de permisos de un rol (módulo × permiso)
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
  const rolId = Number(id);

  const [modulos, permisos, asignados] = await Promise.all([
    prisma.modulo.findMany({ where: { activo: true }, orderBy: { orden: "asc" } }),
    prisma.permiso.findMany({ orderBy: { orden: "asc" } }),
    prisma.rolModuloPermiso.findMany({
      where: { rol_id: rolId },
      select: { modulo_id: true, permiso_id: true },
    }),
  ]);

  // Construir set de asignados para lookup rápido
  const asignadoSet = new Set(
    asignados.map((a) => `${a.modulo_id}-${a.permiso_id}`)
  );

  return NextResponse.json({
    ok: true,
    data: {
      modulos: modulos.map((m) => ({ id: m.id, nombre: m.nombre })),
      permisos: permisos.map((p) => ({ id: p.id, clave: p.clave, nombre: p.nombre, es_sistema: p.es_sistema })),
      asignados: asignados.map((a) => ({ modulo_id: a.modulo_id, permiso_id: a.permiso_id })),
      // Matriz: para cada módulo, qué permisos tiene activos
      matriz: modulos.map((m) => ({
        modulo_id: m.id,
        modulo_nombre: m.nombre,
        permisos: permisos.map((p) => ({
          permiso_id: p.id,
          permiso_clave: p.clave,
          permiso_nombre: p.nombre,
          activo: asignadoSet.has(`${m.id}-${p.id}`),
        })),
      })),
    },
  });
}

// PUT: Reemplazar todos los permisos de un rol
// Body: { permisos: [{ modulo_id: number, permiso_id: number }] }
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
  const rolId = Number(id);
  const { permisos } = await req.json();

  if (!Array.isArray(permisos)) {
    return NextResponse.json({ ok: false, error: "Formato inválido" }, { status: 400 });
  }

  // Transacción: borrar todos los permisos actuales y re-crear
  await prisma.$transaction(async (tx) => {
    await tx.rolModuloPermiso.deleteMany({ where: { rol_id: rolId } });

    if (permisos.length > 0) {
      await tx.rolModuloPermiso.createMany({
        data: permisos.map((p: { modulo_id: number; permiso_id: number }) => ({
          rol_id: rolId,
          modulo_id: p.modulo_id,
          permiso_id: p.permiso_id,
        })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
