import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const zonas = await prisma.zona.findMany({
      select: {
        id: true,
        iglesias: {
          select: {
            ministerios: {
              select: {
                tipo: true,
              },
            },
          },
        },
      },
    });

    const stats: Record<number, { ministerios: number; candidatos: number }> = {};

    for (const zona of zonas) {
      let ministerios = 0;
      let candidatos = 0;

      for (const iglesia of zona.iglesias) {
        for (const min of iglesia.ministerios) {
          if (min.tipo === "CANDIDATO") {
            candidatos++;
          } else {
            ministerios++;
          }
        }
      }

      stats[zona.id] = { ministerios, candidatos };
    }

    return NextResponse.json({ ok: true, data: stats });
  } catch (error: unknown) {
    console.error("[GET /api/zonas/stats] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al obtener estadísticas de zonas",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
