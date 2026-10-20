import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolverAlcanceZona } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const zonaId = req.nextUrl.searchParams.get("zonaId");
  const subzonaId = req.nextUrl.searchParams.get("subzonaId");

  if (!zonaId) {
    return NextResponse.json({ ok: false, error: "zonaId requerido" }, { status: 400 });
  }

  try {
    const scope = await resolverAlcanceZona(req);
    if (scope && Number(zonaId) !== scope.zonaId) {
      return NextResponse.json({ ok: true, data: {} });
    }
    if (scope?.subzonaId && subzonaId && Number(subzonaId) !== scope.subzonaId) {
      return NextResponse.json({ ok: true, data: {} });
    }
    const iglesiaWhere: Record<string, unknown> = { zona_id: Number(zonaId) };
    if (subzonaId) {
      iglesiaWhere.subzona_id = Number(subzonaId);
    }
    if (scope?.subzonaId) {
      iglesiaWhere.subzona_id = scope.subzonaId;
    }

    // Query ligera: solo traer tipo y iglesia_id para contar
    const [iglesiaIds, ministerios] = await Promise.all([
      prisma.iglesia.findMany({
        where: iglesiaWhere,
        select: { id: true },
      }),
      prisma.ministerio.findMany({
        where: {
          activo: true,
          iglesia: iglesiaWhere,
        },
        select: {
          tipo: true,
          iglesia_id: true,
        },
      }),
    ]);

    const stats: Record<number, { ministerios: number; candidatos: number }> = {};

    // Inicializar todas las iglesias (incluso las que no tienen ministerios)
    for (const ig of iglesiaIds) {
      stats[ig.id] = { ministerios: 0, candidatos: 0 };
    }

    for (const min of ministerios) {
      if (!stats[min.iglesia_id]) {
        stats[min.iglesia_id] = { ministerios: 0, candidatos: 0 };
      }
      if (min.tipo === "CANDIDATO") {
        stats[min.iglesia_id].candidatos++;
      } else {
        stats[min.iglesia_id].ministerios++;
      }
    }

    return NextResponse.json({ ok: true, data: stats });
  } catch (error: unknown) {
    console.error("[GET /api/iglesias/stats] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al obtener estadísticas de iglesias",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
