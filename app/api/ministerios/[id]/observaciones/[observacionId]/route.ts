import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  leerTextoObservacion,
  verificarAccesoObservaciones,
} from "@/lib/observacionesMinisterio";

type Params = { params: Promise<{ id: string; observacionId: string }> };

function validarId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const acceso = await verificarAccesoObservaciones(request);
    if (!acceso.ok) return acceso.response;

    const { id, observacionId: observacionIdValue } = await params;
    const ministerioId = validarId(id);
    const observacionId = validarId(observacionIdValue);
    if (!ministerioId || !observacionId) {
      return NextResponse.json({ ok: false, error: "ID no válido" }, { status: 400 });
    }

    const existente = await prisma.observacion.findFirst({
      where: {
        id: observacionId,
        ministerio_id: ministerioId,
        ...(acceso.contexto.zonaId === null
          ? {}
          : { ministerio: { iglesia: { zona_id: acceso.contexto.zonaId } } }),
      },
      select: {
        id: true,
        observacion: true,
        ministerio: {
          select: {
            nombre: true,
            apellidos: true,
            codigo: true,
            iglesia: { select: { nombre: true, zona: { select: { codigo: true } } } },
          },
        },
      },
    });
    if (!existente) {
      return NextResponse.json({ ok: false, error: "Observación no encontrada" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Solicitud JSON no válida" }, { status: 400 });
    }
    const observacion = leerTextoObservacion(body);
    if (!observacion) {
      return NextResponse.json(
        { ok: false, error: "La observación es obligatoria y no puede superar 255 caracteres" },
        { status: 400 }
      );
    }

    const actualizada = await prisma.observacion.update({
      where: { id: observacionId },
      data: { observacion },
      select: {
        id: true,
        observacion: true,
        fecha_creacion: true,
        autor_id: true,
        autor_nombre: true,
        autor_username: true,
      },
    });

    await registrarAuditoria(request, {
      accion: "EDITAR",
      entidad: "Observación de ministerio",
      entidadId: observacionId,
      identificacion: [
        [existente.ministerio.nombre, existente.ministerio.apellidos].filter(Boolean).join(" "),
        existente.ministerio.codigo ? `Código ${existente.ministerio.codigo}` : null,
        `${existente.ministerio.iglesia.nombre} · Zona ${existente.ministerio.iglesia.zona.codigo}`,
      ].filter(Boolean).join(" · "),
      resumen: `Editó una observación de ${[existente.ministerio.nombre, existente.ministerio.apellidos].filter(Boolean).join(" ")}`,
      campos: ["observacion"],
      cambios: {
        observacion: { anterior: existente.observacion, nuevo: observacion },
      },
    });

    return NextResponse.json({ ok: true, data: actualizada });
  } catch (error) {
    console.error("[PATCH /api/ministerios/[id]/observaciones/[observacionId]] Error:", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar la observación" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const acceso = await verificarAccesoObservaciones(request);
    if (!acceso.ok) return acceso.response;

    const { id, observacionId: observacionIdValue } = await params;
    const ministerioId = validarId(id);
    const observacionId = validarId(observacionIdValue);
    if (!ministerioId || !observacionId) {
      return NextResponse.json({ ok: false, error: "ID no válido" }, { status: 400 });
    }

    const existente = await prisma.observacion.findFirst({
      where: {
        id: observacionId,
        ministerio_id: ministerioId,
        ...(acceso.contexto.zonaId === null
          ? {}
          : { ministerio: { iglesia: { zona_id: acceso.contexto.zonaId } } }),
      },
      select: {
        id: true,
        observacion: true,
        ministerio: {
          select: {
            nombre: true,
            apellidos: true,
            codigo: true,
            iglesia: { select: { nombre: true, zona: { select: { codigo: true } } } },
          },
        },
      },
    });
    if (!existente) {
      return NextResponse.json({ ok: false, error: "Observación no encontrada" }, { status: 404 });
    }

    await prisma.observacion.delete({ where: { id: observacionId } });
    await registrarAuditoria(request, {
      accion: "ELIMINAR",
      entidad: "Observación de ministerio",
      entidadId: observacionId,
      identificacion: [
        [existente.ministerio.nombre, existente.ministerio.apellidos].filter(Boolean).join(" "),
        existente.ministerio.codigo ? `Código ${existente.ministerio.codigo}` : null,
        `${existente.ministerio.iglesia.nombre} · Zona ${existente.ministerio.iglesia.zona.codigo}`,
      ].filter(Boolean).join(" · "),
      resumen: `Eliminó una observación de ${[existente.ministerio.nombre, existente.ministerio.apellidos].filter(Boolean).join(" ")}`,
      cambios: {
        observacion: { anterior: existente.observacion, nuevo: null },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/ministerios/[id]/observaciones/[observacionId]] Error:", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo eliminar la observación" },
      { status: 500 }
    );
  }
}
