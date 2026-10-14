import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
