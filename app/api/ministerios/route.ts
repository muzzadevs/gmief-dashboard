export async function POST(req: Request) {
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
  const result = await query(
    `INSERT INTO ministerios (nombre, apellidos, alias, iglesia_id, codigo, estado_id, aprob, telefono, email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ]
  );
  // @ts-expect-error: result may not have insertId type, but it is present after insert
  const id = result.insertId;
  return NextResponse.json({ id });
}
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const iglesiaId = searchParams.get("iglesiaId");
  if (!iglesiaId) {
    return NextResponse.json({ error: "iglesiaId requerido" }, { status: 400 });
  }
  // Ministerios, estados, cargos y alias
  const ministerios = await query(
    `SELECT m.*, e.nombre as estado_nombre, 
      (SELECT GROUP_CONCAT(cargo_id) FROM ministerio_cargo WHERE ministerio_id = m.id) as cargos
     FROM ministerios m
     LEFT JOIN estados e ON m.estado_id = e.id
     WHERE m.iglesia_id = ?`,
    [iglesiaId]
  );
  return NextResponse.json(ministerios);
}
