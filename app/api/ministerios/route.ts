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
    codigo_manual,
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

  // Obtener la iglesia con su zona
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
  let codigo: string;

  if (codigo_manual) {
    // Código manual: validar formato y unicidad
    const numPart = codigo_manual.replace(/[^0-9]/g, "");
    if (!numPart || numPart.length === 0 || numPart.length > 3) {
      return NextResponse.json(
        { error: "La parte numérica del código debe tener entre 1 y 3 dígitos" },
        { status: 400 }
      );
    }

    codigo = `${codigoZona}${numPart.padStart(3, "0")}`;

    // Comprobar que el código no exista ya en la base de datos
    const existente = await prisma.ministerio.findUnique({
      where: { codigo },
    });

    if (existente) {
      return NextResponse.json(
        { error: `El código ${codigo} ya existe en la base de datos` },
        { status: 409 }
      );
    }
  } else {
    // Auto-generar el código basado en la zona de la iglesia
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

    codigo = `${codigoZona}${String(nextNumber).padStart(3, "0")}`;
  }

  const ministerio = await prisma.ministerio.create({
    data: {
      nombre,
      apellidos: apellidos || null,
      alias: alias || null,
      iglesia_id,
      codigo,
      estado_id,
      aprob: aprob || null,
      telefono: telefono || null,
      email: email || null,
    },
  });

  return NextResponse.json({ id: ministerio.id, codigo });
}
