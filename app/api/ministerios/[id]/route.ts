import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Obtener un ministerio por id (con cargos y candidato_detalle)
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
      candidato_detalle: {
        select: { fecha_inicio: true, notas: true },
      },
    },
  });

  if (!ministerio) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...ministerio,
    imagen: undefined, // No enviar el blob binario en el JSON
    has_imagen: ministerio.imagen !== null && ministerio.imagen !== undefined,
    cargos: ministerio.cargos.map((c: { cargo_id: number }) => c.cargo_id).join(",") || null,
    fecha_inicio: ministerio.candidato_detalle?.fecha_inicio
      ? new Date(ministerio.candidato_detalle.fecha_inicio).toISOString().split("T")[0]
      : null,
    notas: ministerio.candidato_detalle?.notas || null,
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
    tipo,
    // Campos de candidato
    fecha_inicio,
    notas,
  } = data;

  if (!nombre || !iglesia_id || !estado_id) {
    const faltantes: string[] = [];
    if (!nombre) faltantes.push("Nombre");
    if (!iglesia_id) faltantes.push("Iglesia");
    if (!estado_id) faltantes.push("Estado");
    return NextResponse.json(
      { error: `Faltan campos obligatorios: ${faltantes.join(", ")}` },
      { status: 400 }
    );
  }

  // Para ministerios, código es obligatorio
  if (tipo === "MINISTERIO" && !codigo) {
    return NextResponse.json(
      { error: "El código es obligatorio para ministerios" },
      { status: 400 }
    );
  }

  await prisma.ministerio.update({
    where: { id: Number(id) },
    data: {
      nombre,
      apellidos: apellidos || null,
      alias: alias || null,
      iglesia_id,
      codigo: tipo === "MINISTERIO" ? codigo : null,
      estado_id,
      tipo: tipo || "MINISTERIO",
      aprob: aprob || null,
      telefono: telefono || null,
      email: email || null,
    },
  });

  // Si es candidato, actualizar o crear candidato_detalle
  if (tipo === "CANDIDATO" && fecha_inicio) {
    const existing = await prisma.candidatoDetalle.findUnique({
      where: { ministerio_id: Number(id) },
    });

    if (existing) {
      await prisma.candidatoDetalle.update({
        where: { ministerio_id: Number(id) },
        data: {
          fecha_inicio: new Date(fecha_inicio),
          notas: notas || null,
        },
      });
    } else {
      await prisma.candidatoDetalle.create({
        data: {
          ministerio_id: Number(id),
          fecha_inicio: new Date(fecha_inicio),
          notas: notas || null,
        },
      });
    }
  }

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

  // Eliminar candidato_detalle si existe
  await prisma.candidatoDetalle.deleteMany({
    where: { ministerio_id: numId },
  });

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
