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
