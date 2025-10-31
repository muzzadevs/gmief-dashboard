import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Iglesia } from "@/types/subzonas";

export async function GET(req: NextRequest) {
  const zonaId = req.nextUrl.searchParams.get("zonaId");
  const subzonaId = req.nextUrl.searchParams.get("subzonaId");
  if (!zonaId) return NextResponse.json([]);

  let iglesias: Iglesia[] = [];
  if (subzonaId) {
    iglesias = await query<Iglesia[]>(
      `SELECT id, nombre, direccion, municipio, provincia, subzona_id, cp FROM iglesias WHERE subzona_id = ? ORDER BY nombre`,
      [subzonaId]
    );
  } else {
    iglesias = await query<Iglesia[]>(
      `SELECT i.id, i.nombre, i.direccion, i.municipio, i.provincia, i.subzona_id, i.cp FROM iglesias i
      JOIN subzonas s ON i.subzona_id = s.id WHERE s.zona_id = ? ORDER BY i.nombre`,
      [zonaId]
    );
  }
  return NextResponse.json(iglesias);
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, direccion, municipio, provincia, cp, subzona_id } =
      await req.json();

    // Validar campos requeridos
    if (!nombre || !subzona_id) {
      return NextResponse.json(
        { error: "Nombre y subzona son requeridos" },
        { status: 400 }
      );
    }

    // Insertar nueva iglesia
    const result = await query<{ insertId: number }>(
      `INSERT INTO iglesias (nombre, direccion, municipio, provincia, cp, subzona_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        direccion || null,
        municipio || null,
        provincia || null,
        cp || null,
        subzona_id,
      ]
    );

    return NextResponse.json({
      id: result.insertId,
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
