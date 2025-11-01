import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Subzona } from "@/types/subzonas";

export async function GET(req: NextRequest) {
  const zonaId = req.nextUrl.searchParams.get("zonaId");
  if (!zonaId) return NextResponse.json([]);

  let subzonas: Subzona[] = [];

  if (zonaId === "ALL") {
    // Obtener todas las subzonas
    subzonas = await query<Subzona[]>(
      "SELECT id, nombre, zona_id FROM subzonas ORDER BY nombre",
      []
    );
  } else {
    // Obtener subzonas de una zona específica
    subzonas = await query<Subzona[]>(
      "SELECT id, nombre, zona_id FROM subzonas WHERE zona_id = ? ORDER BY nombre",
      [zonaId]
    );
  }

  return NextResponse.json(subzonas);
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, zona_id } = await req.json();

    // Validar campos requeridos
    if (!nombre || !zona_id) {
      return NextResponse.json(
        { error: "Nombre y zona son requeridos" },
        { status: 400 }
      );
    }

    // Insertar nueva subzona
    const result = await query<{ insertId: number }>(
      `INSERT INTO subzonas (nombre, zona_id) VALUES (?, ?)`,
      [nombre, zona_id]
    );

    return NextResponse.json({
      id: result.insertId,
      message: "Subzona creada exitosamente",
    });
  } catch (error) {
    console.error("Error creating subzona:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { subzonas } = await req.json();

    // Validar que se envíen subzonas
    if (!subzonas || !Array.isArray(subzonas) || subzonas.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de subzonas" },
        { status: 400 }
      );
    }

    // Validar que cada subzona tenga los campos requeridos
    for (const subzona of subzonas) {
      if (!subzona.id || !subzona.nombre || !subzona.zona_id) {
        return NextResponse.json(
          { error: "Cada subzona debe tener id, nombre y zona_id" },
          { status: 400 }
        );
      }
    }

    // Actualizar todas las subzonas
    for (const subzona of subzonas) {
      await query(`UPDATE subzonas SET nombre = ?, zona_id = ? WHERE id = ?`, [
        subzona.nombre,
        subzona.zona_id,
        subzona.id,
      ]);
    }

    return NextResponse.json({
      message: "Subzonas actualizadas exitosamente",
    });
  } catch (error) {
    console.error("Error updating subzonas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
