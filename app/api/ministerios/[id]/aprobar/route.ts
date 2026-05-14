import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Aprobar un candidato como obrero (transición CANDIDATO → MINISTERIO)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const numId = Number(id);

  // Verificar que existe y es candidato
  const ministerio = await prisma.ministerio.findUnique({
    where: { id: numId },
    include: {
      iglesia: {
        include: {
          zona: { select: { codigo: true } },
        },
      },
    },
  });

  if (!ministerio) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (ministerio.tipo !== "CANDIDATO") {
    return NextResponse.json(
      { error: "Esta persona ya es un ministerio, no un candidato" },
      { status: 400 }
    );
  }

  // Generar código automáticamente
  const codigoZona = ministerio.iglesia.zona.codigo.toUpperCase();

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
        if (!m.codigo) return -1;
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
  const currentYear = new Date().getFullYear();

  // Actualizar: tipo → MINISTERIO, asignar código y año de aprobación
  await prisma.ministerio.update({
    where: { id: numId },
    data: {
      tipo: "MINISTERIO",
      codigo,
      aprob: currentYear,
    },
  });

  // Asignar cargo de Obrero (id=4) si no lo tiene ya
  const existingCargo = await prisma.ministerioCargo.findFirst({
    where: { ministerio_id: numId, cargo_id: 4 },
  });

  if (!existingCargo) {
    await prisma.ministerioCargo.create({
      data: {
        ministerio_id: numId,
        cargo_id: 4,
      },
    });
  }

  // Eliminar candidato_detalle
  await prisma.candidatoDetalle.deleteMany({
    where: { ministerio_id: numId },
  });

  return NextResponse.json({
    ok: true,
    codigo,
    message: `Candidato aprobado como obrero con código ${codigo}`,
  });
}
