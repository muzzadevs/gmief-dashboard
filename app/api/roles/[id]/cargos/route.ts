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

// GET: Obtener los cargos asignados a un rol
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

  const [todosCargos, asignados] = await Promise.all([
    prisma.cargo.findMany({ orderBy: { id: "asc" } }),
    prisma.rolCargo.findMany({
      where: { rol_id: rolId },
      select: { cargo_id: true },
    }),
  ]);

  const asignadoIds = new Set(asignados.map((a) => a.cargo_id));

  return NextResponse.json({
    ok: true,
    data: {
      cargos: todosCargos.map((c) => ({
        id: c.id,
        cargo: c.cargo,
        asignado: asignadoIds.has(c.id),
      })),
    },
  });
}

// PUT: Reemplazar los cargos de un rol
// Body: { cargoIds: number[] }
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
  const { cargoIds } = await req.json();

  if (!Array.isArray(cargoIds)) {
    return NextResponse.json({ ok: false, error: "Formato inválido" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.rolCargo.deleteMany({ where: { rol_id: rolId } });

    if (cargoIds.length > 0) {
      await tx.rolCargo.createMany({
        data: cargoIds.map((cargoId: number) => ({
          rol_id: rolId,
          cargo_id: cargoId,
        })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
