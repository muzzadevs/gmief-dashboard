import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarCodigoSiguiente } from "@/lib/codigoMinisterio";
import { resolverAlcanceZona } from "@/lib/auth";
import { requireGestionMinisteriosPermission } from "@/lib/gestionMinisteriosPermissions";
import {
  calcularFase,
  calcularFechaAptoObrero,
  calcularFechasCandidato,
  obtenerFechaHoy,
} from "@/lib/candidatoUtils";

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
  if (!Number.isSafeInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "ID no válido" }, { status: 400 });
  }

  const scope = await resolverAlcanceZona(req);
  const resultado = await prisma.$transaction(async (tx) => {
    const ministerio = await tx.ministerio.findUnique({
      where: { id: numId },
      include: {
        iglesia: {
          select: {
            zona_id: true,
            zona: { select: { codigo: true } },
          },
        },
        candidato_detalle: {
          select: {
            fecha_inicio: true,
            fecha_candidato_local: true,
            fecha_candidato_nacional: true,
          },
        },
      },
    });

    if (!ministerio) {
      return { error: "No encontrado", status: 404 } as const;
    }
    if (scope && ministerio.iglesia.zona_id !== scope.zonaId) {
      return {
        error: "Ministerio fuera de tu zona o subzona",
        status: 403,
      } as const;
    }
    if (ministerio.tipo !== "CANDIDATO") {
      return {
        error: "Esta persona ya es un ministerio, no un candidato",
        status: 400,
      } as const;
    }
    if (!ministerio.activo) {
      return {
        error: "No se puede aprobar un candidato inactivo",
        status: 409,
      } as const;
    }

    const candidatoDetalle = ministerio.candidato_detalle;
    const fechaInicio = candidatoDetalle?.fecha_inicio;
    if (!candidatoDetalle || !fechaInicio || Number.isNaN(fechaInicio.getTime())) {
      return {
        error: "El candidato no tiene una fecha de inicio válida",
        status: 409,
      } as const;
    }

    const hoy = obtenerFechaHoy();
    const fechasEsperadas = calcularFechasCandidato(fechaInicio, "ENSAYISTA");
    const fechaLocalEsperada = fechasEsperadas.fecha_candidato_local;
    const fechaNacionalEsperada = fechasEsperadas.fecha_candidato_nacional;
    const fechaLocalRegistrada = candidatoDetalle.fecha_candidato_local
      ?.toISOString()
      .slice(0, 10);
    const fechaNacionalRegistrada = candidatoDetalle.fecha_candidato_nacional
      ?.toISOString()
      .slice(0, 10);

    if (
      (fechaLocalRegistrada && fechaLocalRegistrada !== fechaLocalEsperada) ||
      (fechaNacionalRegistrada && fechaNacionalRegistrada !== fechaNacionalEsperada)
    ) {
      return {
        error: "Las fechas de las etapas del candidato no son coherentes con su fecha de inicio",
        status: 409,
      } as const;
    }

    let fase: ReturnType<typeof calcularFase>;
    try {
      fase = calcularFase(fechaInicio, hoy);
    } catch {
      return {
        error: "El candidato no tiene una fecha de inicio válida",
        status: 409,
      } as const;
    }

    if (fase.fase !== "APTO_OBRERO") {
      return {
        error: `El candidato alcanzará la etapa de Apto para Obrero el ${calcularFechaAptoObrero(fechaInicio)}`,
        status: 409,
      } as const;
    }

    const codigoZona = ministerio.iglesia.zona.codigo.toUpperCase();
    const ministeriosConCodigo = await tx.ministerio.findMany({
      where: { codigo: { startsWith: codigoZona } },
      select: { codigo: true },
    });
    const codigo = generarCodigoSiguiente(
      codigoZona,
      ministeriosConCodigo.map((item) => item.codigo)
    );
    if (!codigo) {
      return {
        error: "Se ha alcanzado el límite máximo de códigos para esta zona (9999)",
        status: 409,
      } as const;
    }

    await tx.ministerio.update({
      where: { id: numId },
      data: {
        tipo: "MINISTERIO",
        codigo,
        username: codigo,
        aprob: new Date().getFullYear(),
      },
    });

    const existingCargo = await tx.ministerioCargo.findFirst({
      where: { ministerio_id: numId, cargo_id: 4 },
    });
    if (!existingCargo) {
      await tx.ministerioCargo.create({
        data: { ministerio_id: numId, cargo_id: 4 },
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

    return { codigo } as const;
  });

  if ("error" in resultado) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }

  return NextResponse.json({
    ok: true,
    codigo: resultado.codigo,
    message: `Candidato aprobado como obrero con código ${resultado.codigo}`,
  });
}
