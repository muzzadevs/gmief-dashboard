import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  try {
    const [iglesias, ministerios] = await cached("iglesias:mapa:v2", CACHE_TTL.FREQUENT, () =>
      Promise.all([
        prisma.iglesia.findMany({
          where: {
            latitud: { not: null },
            longitud: { not: null },
            activo: true,
          },
          select: {
            id: true,
            nombre: true,
            direccion: true,
            municipio: true,
            provincia: true,
            cp: true,
            latitud: true,
            longitud: true,
            zona: {
              select: {
                nombre: true,
              },
            },
            subzona: {
              select: {
                nombre: true,
              },
            },
          },
          orderBy: { nombre: "asc" },
        }),
        prisma.ministerio.findMany({
          where: {
            activo: true,
            iglesia: {
              activo: true,
              latitud: { not: null },
              longitud: { not: null },
            },
          },
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            alias: true,
            tipo: true,
            codigo: true,
            iglesia_id: true,
          },
          orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
        }),
      ])
    );

    return NextResponse.json({ ok: true, iglesias, ministerios });
  } catch (error: unknown) {
    console.error("[GET /api/iglesias/mapa] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al obtener datos para el mapa",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
