import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Buscar ministerios globalmente por nombre, apellidos, alias o código
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  try {
    const ministerios = await prisma.ministerio.findMany({
      where: {
        activo: true,
        tipo: "MINISTERIO",
        OR: [
          { nombre: { contains: query } },
          { apellidos: { contains: query } },
          { alias: { contains: query } },
          { codigo: { contains: query } },
        ],
      },
      include: {
        iglesia: {
          include: {
            zona: { select: { nombre: true, codigo: true } },
          },
        },
        cargos: {
          include: {
            cargo: { select: { cargo: true } },
          },
        },
      },
      take: 100,
      orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
    });

    const result = ministerios.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      apellidos: m.apellidos,
      alias: m.alias,
      codigo: m.codigo,
      has_imagen: m.imagen !== null && m.imagen !== undefined,
      iglesia_nombre: m.iglesia.nombre,
      zona_nombre: m.iglesia.zona.nombre,
      zona_codigo: m.iglesia.zona.codigo.toUpperCase(),
      cargos: m.cargos.map((c) => c.cargo.cargo),
    }));

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    console.error("[GET /api/ministerios/buscar] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Error al buscar ministerios" },
      { status: 500 }
    );
  }
}
