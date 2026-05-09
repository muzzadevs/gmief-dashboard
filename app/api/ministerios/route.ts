import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const iglesiaId = searchParams.get("iglesiaId");
  if (!iglesiaId) {
    return NextResponse.json({ error: "iglesiaId requerido" }, { status: 400 });
  }

  const ministerios = await prisma.ministerio.findMany({
    where: { iglesia_id: Number(iglesiaId) },
    include: {
      estado: { select: { nombre: true } },
      cargos: { select: { cargo_id: true } },
    },
  });

  // Transformar para mantener la misma estructura de respuesta
  const result = ministerios.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    apellidos: m.apellidos,
    alias: m.alias,
    iglesia_id: m.iglesia_id,
    codigo: m.codigo,
    estado_id: m.estado_id,
    aprob: m.aprob,
    telefono: m.telefono,
    email: m.email,
    estado_nombre: m.estado.nombre,
    cargos: m.cargos.map((c) => c.cargo_id).join(",") || null,
  }));

  return NextResponse.json(result);
}

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

  const ministerio = await prisma.ministerio.create({
    data: {
      nombre,
      apellidos,
      alias: alias || null,
      iglesia_id,
      codigo,
      estado_id,
      aprob,
      telefono: telefono || null,
      email: email || null,
    },
  });

  return NextResponse.json({ id: ministerio.id });
}
