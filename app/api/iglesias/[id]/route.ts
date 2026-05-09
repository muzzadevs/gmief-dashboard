import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const iglesia = await prisma.iglesia.findUnique({
      where: { id },
    });

    if (!iglesia) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(iglesia);
  } catch (error) {
    console.error("Error fetching iglesia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { nombre, direccion, municipio, provincia, cp, zona_id, subzona_id } =
      await request.json();

    if (!nombre || !zona_id) {
      return NextResponse.json(
        { error: "Nombre y zona son requeridos" },
        { status: 400 }
      );
    }

    const existingIglesia = await prisma.iglesia.findUnique({
      where: { id },
    });

    if (!existingIglesia) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }

    await prisma.iglesia.update({
      where: { id },
      data: {
        nombre,
        direccion: direccion || null,
        municipio: municipio || null,
        provincia: provincia || null,
        cp: cp || null,
        zona_id,
        subzona_id: subzona_id || null,
      },
    });

    return NextResponse.json({
      id,
      message: "Iglesia actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error updating iglesia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
