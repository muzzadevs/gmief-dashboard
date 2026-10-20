import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  try {
    const stats = await cached("zonas:stats", CACHE_TTL.FREQUENT, async () => {
      // Traemos solo tipo y zona_id — muy ligero, sin blobs ni relaciones pesadas
      const ministerios = await prisma.ministerio.findMany({
        where: {
          activo: true,
          iglesia: { activo: true },
        },
        select: {
          tipo: true,
          iglesia: {
            select: { zona_id: true },
          },
        },
      });

      const result: Record<number, { ministerios: number; candidatos: number }> = {};

      for (const m of ministerios) {
        const zonaId = m.iglesia.zona_id;
        if (!result[zonaId]) {
          result[zonaId] = { ministerios: 0, candidatos: 0 };
        }
        if (m.tipo === "CANDIDATO") {
          result[zonaId].candidatos++;
        } else {
          result[zonaId].ministerios++;
        }
      }

      // Asegurar que zonas sin ministerios también aparezcan
      const zonaIds = await prisma.zona.findMany({ select: { id: true } });
      for (const z of zonaIds) {
        if (!result[z.id]) {
          result[z.id] = { ministerios: 0, candidatos: 0 };
        }
      }

      return result;
    });

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
