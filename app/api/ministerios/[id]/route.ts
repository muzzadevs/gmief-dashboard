// Eliminar ministerio por id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  // Eliminar ministerio
  await query("DELETE FROM ministerios WHERE id = ?", [id]);
  // Eliminar relaciones en ministerio_cargo
  await query("DELETE FROM ministerio_cargo WHERE ministerio_id = ?", [id]);
  // Eliminar observaciones
  await query("DELETE FROM observaciones WHERE ministerio_id = ?", [id]);
  return NextResponse.json({ success: true });
}
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Obtener un ministerio por id (con cargos)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const result = await query(
    `SELECT m.*, (SELECT GROUP_CONCAT(cargo_id) FROM ministerio_cargo WHERE ministerio_id = m.id) as cargos FROM ministerios m WHERE m.id = ?`,
    [id]
  );
  const ministerio =
    Array.isArray(result) && result.length > 0 ? result[0] : null;
  if (!ministerio)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(ministerio);
}

// Actualizar ministerio
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();
  const {
    nombre,
    apellidos,
    alias,
    iglesia_id,
    codigo,
    estado_id,
    aprob,
    telefono,
    email,
  } = data;
  if (!nombre || !apellidos || !iglesia_id || !codigo || !estado_id || !aprob) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }
  await query(
    `UPDATE ministerios SET nombre=?, apellidos=?, alias=?, iglesia_id=?, codigo=?, estado_id=?, aprob=?, telefono=?, email=? WHERE id=?`,
    [
      nombre,
      apellidos,
      alias,
      iglesia_id,
      codigo,
      estado_id,
      aprob,
      telefono,
      email,
      id,
    ]
  );
  return NextResponse.json({ ok: true });
}
