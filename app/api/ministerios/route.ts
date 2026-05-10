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
    estado_id,
    aprob,
    telefono,
    email,
  } = data;

  if (!nombre || !apellidos || !iglesia_id || !estado_id || !aprob) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  // Auto-generar el código basado en la zona de la iglesia
  const iglesia = await prisma.iglesia.findUnique({
    where: { id: iglesia_id },
    include: {
      zona: {
        select: { codigo: true },
      },
    },
  });

  if (!iglesia) {
    return NextResponse.json(
      { error: "Iglesia no encontrada" },
      { status: 404 }
    );
  }

  const codigoZona = iglesia.zona.codigo.toUpperCase();

  // Buscar el número más alto existente para esta zona
  const ministeriosConCodigo = await prisma.ministerio.findMany({
    where: {
      codigo: {
        startsWith: codigoZona,
      },
    },
    select: { codigo: true },
    orderBy: { codigo: "desc" },
  });

  let nextNumber = 0;
  if (ministeriosConCodigo.length > 0) {
    const numbers = ministeriosConCodigo
      .map((m) => {
        const numPart = m.codigo.slice(codigoZona.length);
        const parsed = parseInt(numPart, 10);
        return isNaN(parsed) ? -1 : parsed;
      })
      .filter((n) => n >= 0);
    if (numbers.length > 0) {
      nextNumber = Math.max(...numbers) + 1;
    }
  }

  if (nextNumber > 999) {
    return NextResponse.json(
      { error: "Se ha alcanzado el límite máximo de códigos para esta zona (999)" },
      { status: 409 }
    );
  }

  const codigo = `${codigoZona}${String(nextNumber).padStart(3, "0")}`;

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

  return NextResponse.json({ id: ministerio.id, codigo });
}
