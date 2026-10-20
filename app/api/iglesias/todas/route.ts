import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolverAlcanceZona } from "@/lib/auth";

// GET: Devuelve todas las iglesias activas con su zona (para comboboxes globales)
export async function GET(request: Request) {
  try {
    const scope = await resolverAlcanceZona(request);
    const iglesias = await prisma.iglesia.findMany({
      where: {
        activo: true,
        ...(scope
          ? {
              zona_id: scope.zonaId,
              ...(scope.subzonaId ? { subzona_id: scope.subzonaId } : {}),
            }
          : {}),
      },
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
