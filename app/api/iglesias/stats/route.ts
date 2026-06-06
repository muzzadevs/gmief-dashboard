import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const zonaId = req.nextUrl.searchParams.get("zonaId");
  const subzonaId = req.nextUrl.searchParams.get("subzonaId");

  if (!zonaId) {
    return NextResponse.json({ ok: false, error: "zonaId requerido" }, { status: 400 });
  }

  try {
    const where: Record<string, unknown> = { zona_id: Number(zonaId) };
    if (subzonaId) {
      where.subzona_id = Number(subzonaId);
    }

    const iglesias = await prisma.iglesia.findMany({
      where,
      select: {
        id: true,
        ministerios: {
          where: { activo: true },
          select: {
            tipo: true,
          },
        },
      },
    });

    const stats: Record<number, { ministerios: number; candidatos: number }> = {};

    for (const iglesia of iglesias) {
      let ministerios = 0;
      let candidatos = 0;

      for (const min of iglesia.ministerios) {
        if (min.tipo === "CANDIDATO") {
          candidatos++;
        } else {
          ministerios++;
        }
      }

      stats[iglesia.id] = { ministerios, candidatos };
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
