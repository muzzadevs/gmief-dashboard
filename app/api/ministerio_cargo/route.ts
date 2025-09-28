import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const { ministerio_id, cargos } = await req.json();
  if (!ministerio_id || !Array.isArray(cargos) || cargos.length === 0) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  // Insertar todos los cargos para el ministerio
  for (const cargo_id of cargos) {
    await query(
      "INSERT INTO ministerio_cargo (ministerio_id, cargo_id) VALUES (?, ?)",
      [ministerio_id, cargo_id]
    );
  }
  return NextResponse.json({ ok: true });
}
