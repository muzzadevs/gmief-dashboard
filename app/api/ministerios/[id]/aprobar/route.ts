import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarCodigoSiguiente } from "@/lib/codigoMinisterio";
import { ministerioDentroDeAlcance, resolverAlcanceZona } from "@/lib/auth";
import { requireGestionMinisteriosPermission } from "@/lib/gestionMinisteriosPermissions";

// POST: Aprobar un candidato como obrero (transición CANDIDATO → MINISTERIO)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireGestionMinisteriosPermission(req, "editar", {
    allowZoneScopedEdit: true,
  });
  if (denied) return denied;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const numId = Number(id);
  const scope = await resolverAlcanceZona(req);
  if (!(await ministerioDentroDeAlcance(scope, numId))) {
    return NextResponse.json({ error: "Ministerio fuera de tu zona o subzona" }, { status: 403 });
  }

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
  });

  const codigo = generarCodigoSiguiente(
    codigoZona,
    ministeriosConCodigo.map((item) => item.codigo)
  );
  if (!codigo) {
    return NextResponse.json(
      { error: "Se ha alcanzado el límite máximo de códigos para esta zona (9999)" },
      { status: 409 }
    );
  }

  const currentYear = new Date().getFullYear();

  // Actualizar: tipo → MINISTERIO, asignar código, username y año de aprobación
  await prisma.$transaction(async (tx) => {
    await tx.ministerio.update({
      where: { id: numId },
      data: {
        tipo: "MINISTERIO",
        codigo,
        username: codigo, // El username pasa a ser el nuevo código de obrero
        aprob: currentYear,
      },
    });

    const existingCargo = await tx.ministerioCargo.findFirst({
      where: { ministerio_id: numId, cargo_id: 4 },
    });

    if (!existingCargo) {
      await tx.ministerioCargo.create({
        data: {
          ministerio_id: numId,
          cargo_id: 4,
        },
      });
    }

    await tx.ministerioHistorico.create({
      data: {
        ministerio_id: numId,
        campo: "Paso de candidato a obrero",
        valor_anterior: "Candidato",
        valor_nuevo: "Obrero",
      },
    });

    await tx.candidatoDetalle.deleteMany({
      where: { ministerio_id: numId },
    });
  });

  return NextResponse.json({
    ok: true,
    codigo,
    message: `Candidato aprobado como obrero con código ${codigo}`,
  });
}
