import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";

// Actualizar los cargos de un ministerio: elimina los que no estén, añade los nuevos
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { cargos } = await req.json();
  if (!id || !Array.isArray(cargos)) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  // Obtener los cargos actuales
  type CargoRow = { cargo_id: number };
  const current = await query<CargoRow[]>(
    "SELECT cargo_id FROM ministerio_cargo WHERE ministerio_id = ?",
    [id]
  );
  const currentIds = Array.isArray(current)
    ? current.map((c) => c.cargo_id)
    : [];
  // Eliminar los que ya no estén
  for (const cargoId of currentIds) {
    if (!cargos.includes(cargoId)) {
      await query(
        "DELETE FROM ministerio_cargo WHERE ministerio_id = ? AND cargo_id = ?",
        [id, cargoId]
      );
    }
  }
  // Añadir los nuevos
  for (const cargoId of cargos) {
    if (!currentIds.includes(cargoId)) {
      await query(
        "INSERT INTO ministerio_cargo (ministerio_id, cargo_id) VALUES (?, ?)",
        [id, cargoId]
      );
    }
  }
  return NextResponse.json({ ok: true });
}
