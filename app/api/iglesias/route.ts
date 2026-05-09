import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const zonaId = req.nextUrl.searchParams.get("zonaId");
  const subzonaId = req.nextUrl.searchParams.get("subzonaId");
  if (!zonaId) return NextResponse.json([]);

  if (subzonaId) {
    const iglesias = await prisma.iglesia.findMany({
      where: { subzona_id: Number(subzonaId) },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(iglesias);
  }

  const iglesias = await prisma.iglesia.findMany({
    where: {
      subzona: {
        zona_id: Number(zonaId),
      },
    },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(iglesias);
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, direccion, municipio, provincia, cp, subzona_id } =
      await req.json();

    if (!nombre || !subzona_id) {
      return NextResponse.json(
        { error: "Nombre y subzona son requeridos" },
        { status: 400 }
      );
    }

    const iglesia = await prisma.iglesia.create({
      data: {
        nombre,
        direccion: direccion || null,
        municipio: municipio || null,
        provincia: provincia || null,
        cp: cp || null,
        subzona_id,
      },
    });

    return NextResponse.json({
      id: iglesia.id,
      message: "Iglesia creada exitosamente",
    });
  } catch (error) {
    console.error("Error creating iglesia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
