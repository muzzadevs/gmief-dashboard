import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Iglesia } from "@/types/subzonas";

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

    const iglesia = await query<Iglesia[]>(
      `SELECT id, nombre, direccion, municipio, provincia, cp, subzona_id 
       FROM iglesias WHERE id = ?`,
      [id]
    );

    if (iglesia.length === 0) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(iglesia[0]);
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

    const { nombre, direccion, municipio, provincia, cp, subzona_id } =
      await request.json();

    // Validar campos requeridos
    if (!nombre || !subzona_id) {
      return NextResponse.json(
        { error: "Nombre y subzona son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la iglesia existe
    const existingIglesia = await query<Iglesia[]>(
      "SELECT id FROM iglesias WHERE id = ?",
      [id]
    );

    if (existingIglesia.length === 0) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar la iglesia
    await query(
      `UPDATE iglesias 
       SET nombre = ?, direccion = ?, municipio = ?, provincia = ?, cp = ?, subzona_id = ?
       WHERE id = ?`,
      [
        nombre,
        direccion || null,
        municipio || null,
        provincia || null,
        cp || null,
        subzona_id,
        id,
      ]
    );

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
