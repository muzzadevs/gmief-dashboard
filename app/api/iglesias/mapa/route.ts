import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const iglesias = await prisma.iglesia.findMany({
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
    });

    return NextResponse.json({ ok: true, data: iglesias });
  } catch (error: unknown) {
    console.error("[GET /api/iglesias/mapa] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al obtener iglesias para el mapa",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
