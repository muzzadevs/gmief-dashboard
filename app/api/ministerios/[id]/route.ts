import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Obtener un ministerio por id (con cargos)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const ministerio = await prisma.ministerio.findUnique({
    where: { id: Number(id) },
    include: {
      cargos: { select: { cargo_id: true } },
    },
  });

  if (!ministerio) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...ministerio,
    cargos: ministerio.cargos.map((c) => c.cargo_id).join(",") || null,
  });
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

  await prisma.ministerio.update({
    where: { id: Number(id) },
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

  return NextResponse.json({ ok: true });
}

// Eliminar ministerio por id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const numId = Number(id);

  // Eliminar relaciones en ministerio_cargo
  await prisma.ministerioCargo.deleteMany({
    where: { ministerio_id: numId },
  });

  // Eliminar observaciones
  await prisma.observacion.deleteMany({
    where: { ministerio_id: numId },
  });

  // Eliminar ministerio
  await prisma.ministerio.delete({
    where: { id: numId },
  });

  return NextResponse.json({ success: true });
}
