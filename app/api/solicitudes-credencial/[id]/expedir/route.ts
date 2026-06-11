import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Marcar un item de solicitud como expedido
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json(
        { ok: false, error: "item_id es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el item pertenece a esta solicitud
    const item = await prisma.solicitudCredencialItem.findFirst({
      where: {
        id: Number(item_id),
        solicitud_id: Number(id),
      },
    });

    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Item no encontrado en esta solicitud" },
        { status: 404 }
      );
    }

    // Marcar como expedido
    await prisma.solicitudCredencialItem.update({
      where: { id: Number(item_id) },
      data: {
        expedida: true,
        fecha_expedicion: new Date(),
      },
    });

    // Verificar si todos los items están expedidos para marcar como EN_PROCESO o COMPLETADA
    const allItems = await prisma.solicitudCredencialItem.findMany({
      where: { solicitud_id: Number(id) },
    });

    const allExpedidos = allItems.every((i) => i.id === Number(item_id) || i.expedida);
    const someExpedidos = allItems.some((i) => i.id === Number(item_id) || i.expedida);

    if (allExpedidos) {
      await prisma.solicitudCredencial.update({
        where: { id: Number(id) },
        data: { estado: "COMPLETADA" },
      });
    } else if (someExpedidos) {
      await prisma.solicitudCredencial.update({
        where: { id: Number(id) },
        data: { estado: "EN_PROCESO" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[POST /api/solicitudes-credencial/${id}/expedir] Error:`, error);
    return NextResponse.json(
      { ok: false, error: "Error al expedir credencial" },
      { status: 500 }
    );
  }
}
