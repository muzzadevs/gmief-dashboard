import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export type Zona = {
  id: number;
  nombre: string;
  codigo: string;
};

export async function GET() {
  try {
    const rows = await query<Zona[]>(
      "SELECT id, nombre, codigo FROM zonas ORDER BY nombre ASC"
    );
    console.log(rows);
    
    return NextResponse.json({ ok: true, data: rows }, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET /api/zonas] DB error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { ok: false, error: "DB_ERROR", message: "Error al obtener zonas" },
      { status: 500 }
    );
  }
}
