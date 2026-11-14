import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  leerTextoObservacion,
  verificarAccesoObservaciones,
} from "@/lib/observacionesMinisterio";

type Params = { params: Promise<{ id: string }> };

function validarMinisterioId(id: string): number | null {
  const ministerioId = Number(id);
  return Number.isInteger(ministerioId) && ministerioId > 0 ? ministerioId : null;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const acceso = await verificarAccesoObservaciones(request);
    if (!acceso.ok) return acceso.response;

    const ministerioId = validarMinisterioId((await params).id);
    if (!ministerioId) {
      return NextResponse.json({ ok: false, error: "ID de ministerio no válido" }, { status: 400 });
    }

    const ministerio = await prisma.ministerio.findFirst({
      where: {
        id: ministerioId,
        ...(acceso.contexto.zonaId === null
          ? {}
          : { iglesia: { zona_id: acceso.contexto.zonaId } }),
      },
      select: { id: true },
    });
    if (!ministerio) {
      return NextResponse.json({ ok: false, error: "Ministerio no encontrado" }, { status: 404 });
    }
    const observaciones = await prisma.observacion.findMany({
      where: {
        ministerio_id: ministerioId,
        ...(acceso.contexto.zonaId === null
          ? {}
          : { ministerio: { iglesia: { zona_id: acceso.contexto.zonaId } } }),
      },
      orderBy: [{ fecha_creacion: "desc" }, { id: "desc" }],
      select: {
        id: true,
        observacion: true,
        fecha_creacion: true,
        autor_id: true,
        autor_nombre: true,
        autor_username: true,
      },
    });

    return NextResponse.json({ ok: true, data: observaciones });
  } catch (error) {
    console.error("[GET /api/ministerios/[id]/observaciones] Error:", error);
    return NextResponse.json(
      { ok: false, error: "No se pudieron obtener las observaciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const acceso = await verificarAccesoObservaciones(request);
    if (!acceso.ok) return acceso.response;

    const ministerioId = validarMinisterioId((await params).id);
    if (!ministerioId) {
      return NextResponse.json({ ok: false, error: "ID de ministerio no válido" }, { status: 400 });
    }

    const ministerio = await prisma.ministerio.findFirst({
      where: {
        id: ministerioId,
        ...(acceso.contexto.zonaId === null
          ? {}
          : { iglesia: { zona_id: acceso.contexto.zonaId } }),
      },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        codigo: true,
        iglesia: {
          select: { nombre: true, zona: { select: { codigo: true } } },
        },
      },
    });
    if (!ministerio) {
      return NextResponse.json({ ok: false, error: "Ministerio no encontrado" }, { status: 404 });
    }
    const identificacionMinisterio = [
      [ministerio.nombre, ministerio.apellidos].filter(Boolean).join(" "),
      ministerio.codigo ? `Código ${ministerio.codigo}` : null,
      `${ministerio.iglesia.nombre} · Zona ${ministerio.iglesia.zona.codigo}`,
    ].filter(Boolean).join(" · ");

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

    const creada = await prisma.observacion.create({
      data: {
        observacion,
        autor_nombre: acceso.contexto.autorNombre,
        autor_username: acceso.contexto.autorUsername,
        ministerio: { connect: { id: ministerioId } },
        ...(acceso.contexto.autorId === null
          ? {}
          : { autor: { connect: { id: acceso.contexto.autorId } } }),
      },
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
      accion: "CREAR",
      entidad: "Observación de ministerio",
      entidadId: creada.id,
      identificacion: identificacionMinisterio,
      resumen: `Añadió una observación a ${[ministerio.nombre, ministerio.apellidos].filter(Boolean).join(" ")}`,
      campos: ["observacion"],
      cambios: { observacion: { anterior: null, nuevo: observacion } },
    });

    return NextResponse.json({ ok: true, data: creada }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/ministerios/[id]/observaciones] Error:", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo crear la observación" },
      { status: 500 }
    );
  }
}
