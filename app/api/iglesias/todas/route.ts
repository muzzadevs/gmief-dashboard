import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Devuelve todas las iglesias activas con su zona (para comboboxes globales)
export async function GET() {
  try {
    const iglesias = await prisma.iglesia.findMany({
      select: {
        id: true,
        nombre: true,
        zona_id: true,
        activo: true,
        zona: {
          select: {
            nombre: true,
            codigo: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    const result = iglesias.map((ig) => ({
      id: ig.id,
      nombre: ig.nombre,
      zona_id: ig.zona_id,
      activo: ig.activo,
      zona_nombre: ig.zona.nombre,
      zona_codigo: ig.zona.codigo.toUpperCase(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/iglesias/todas] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener iglesias" },
      { status: 500 }
    );
  }
}
