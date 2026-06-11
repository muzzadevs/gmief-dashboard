import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Obtener todas las solicitudes con conteo de items
export async function GET() {
  try {
    const solicitudes = await prisma.solicitudCredencial.findMany({
      include: {
        items: {
          include: {
            ministerio: {
              select: {
                id: true,
                nombre: true,
                apellidos: true,
                alias: true,
                codigo: true,
              },
            },
          },
        },
      },
      orderBy: [
        { estado: "asc" }, // PENDIENTE first, then EN_PROCESO, then COMPLETADA
        { fecha: "desc" },
      ],
    });

    const result = solicitudes.map((s) => ({
      id: s.id,
      fecha: s.fecha,
      estado: s.estado,
      notas: s.notas,
      total_items: s.items.length,
      items_expedidos: s.items.filter((i) => i.expedida).length,
      items: s.items.map((i) => ({
        id: i.id,
        ministerio_id: i.ministerio_id,
        expedida: i.expedida,
        fecha_expedicion: i.fecha_expedicion,
        ministerio_nombre: i.ministerio.nombre,
        ministerio_apellidos: i.ministerio.apellidos,
        ministerio_alias: i.ministerio.alias,
        ministerio_codigo: i.ministerio.codigo,
      })),
    }));

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    console.error("[GET /api/solicitudes-credencial] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener solicitudes" },
      { status: 500 }
    );
  }
}

// POST: Crear nueva solicitud con ministerios seleccionados
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ministerio_ids, notas } = body;

    if (!ministerio_ids || !Array.isArray(ministerio_ids) || ministerio_ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Debe seleccionar al menos un ministerio" },
        { status: 400 }
      );
    }

    // Verificar que todos los ministerios existen
    const ministerios = await prisma.ministerio.findMany({
      where: {
        id: { in: ministerio_ids.map(Number) },
        activo: true,
      },
      select: { id: true },
    });

    if (ministerios.length !== ministerio_ids.length) {
      return NextResponse.json(
        { ok: false, error: "Algunos ministerios seleccionados no existen o están inactivos" },
        { status: 400 }
      );
    }

    const solicitud = await prisma.solicitudCredencial.create({
      data: {
        notas: notas || null,
        items: {
          create: ministerio_ids.map((id: number) => ({
            ministerio_id: Number(id),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ ok: true, data: solicitud }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/solicitudes-credencial] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Error al crear solicitud" },
      { status: 500 }
    );
  }
}
