import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGestionMinisteriosPermission } from "@/lib/gestionMinisteriosPermissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ministerioId = Number(id);

  if (!Number.isInteger(ministerioId) || ministerioId <= 0) {
    return NextResponse.json({ error: "ID de ministerio no válido" }, { status: 400 });
  }

  try {
    const historico = await prisma.ministerioHistorico.findMany({
      where: { ministerio_id: ministerioId },
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      select: {
        id: true,
        campo: true,
        valor_anterior: true,
        valor_nuevo: true,
        fecha: true,
      },
    });

    return NextResponse.json(historico);
  } catch (error) {
    console.error(`[GET /api/ministerios/${ministerioId}/historico] Error:`, error);
    return NextResponse.json(
      { error: "No se pudo obtener el histórico del ministerio" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireGestionMinisteriosPermission(request, "editar");
  if (denied) return denied;

  const { id } = await params;
  const ministerioId = Number(id);

  if (!Number.isInteger(ministerioId) || ministerioId <= 0) {
    return NextResponse.json({ error: "ID de ministerio no válido" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const historicoId = Number(body.id);
    const fecha = body.fecha;

    if (!Number.isInteger(historicoId) || historicoId <= 0) {
      return NextResponse.json({ error: "ID de evento no válido" }, { status: 400 });
    }

    const fechaDate = typeof fecha === "string"
      ? new Date(`${fecha}T00:00:00.000Z`)
      : null;
    if (
      typeof fecha !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
      Number(fecha.slice(0, 4)) < 1000 ||
      !fechaDate ||
      !Number.isFinite(fechaDate.getTime()) ||
      fechaDate.toISOString().slice(0, 10) !== fecha
    ) {
      return NextResponse.json({ error: "La fecha debe ser válida" }, { status: 400 });
    }

    const evento = await prisma.ministerioHistorico.findFirst({
      where: { id: historicoId, ministerio_id: ministerioId },
      select: { id: true },
    });

    if (!evento) {
      return NextResponse.json({ error: "No se encontró el evento histórico" }, { status: 404 });
    }

    const historicoActualizado = await prisma.ministerioHistorico.update({
      where: { id: historicoId },
      data: { fecha: fechaDate },
      select: {
        id: true,
        campo: true,
        valor_anterior: true,
        valor_nuevo: true,
        fecha: true,
      },
    });

    return NextResponse.json(historicoActualizado);
  } catch (error) {
    console.error(`[PATCH /api/ministerios/${ministerioId}/historico] Error:`, error);
    return NextResponse.json(
      { error: "No se pudo actualizar la fecha del evento histórico" },
      { status: 500 }
    );
  }
}
