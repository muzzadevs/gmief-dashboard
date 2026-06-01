import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Obtener pastor de una iglesia específica, o comprobar si un ministerio es pastor
export async function GET(req: NextRequest) {
  const iglesiaId = req.nextUrl.searchParams.get("iglesiaId");
  const ministerioId = req.nextUrl.searchParams.get("ministerioId");

  try {
    if (iglesiaId) {
      // Obtener el pastor de una iglesia
      const pastor = await prisma.pastorIglesia.findUnique({
        where: { iglesia_id: Number(iglesiaId) },
        include: {
          ministerio: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              alias: true,
              telefono: true,
              iglesia_id: true,
              iglesia: {
                select: {
                  id: true,
                  nombre: true,
                  zona: {
                    select: {
                      nombre: true,
                      codigo: true,
                    },
                  },
                },
              },
            },
          },
          iglesia: {
            select: {
              id: true,
              nombre: true,
              zona: {
                select: {
                  nombre: true,
                  codigo: true,
                },
              },
            },
          },
        },
      });

      if (!pastor) {
        return NextResponse.json(null);
      }

      return NextResponse.json({
        id: pastor.id,
        iglesia_id: pastor.iglesia_id,
        ministerio_id: pastor.ministerio_id,
        ministerio: {
          id: pastor.ministerio.id,
          nombre: pastor.ministerio.nombre,
          apellidos: pastor.ministerio.apellidos,
          alias: pastor.ministerio.alias,
          telefono: pastor.ministerio.telefono,
          iglesia_id: pastor.ministerio.iglesia_id,
          iglesia_nombre: pastor.ministerio.iglesia.nombre,
          iglesia_zona: pastor.ministerio.iglesia.zona.nombre,
          iglesia_zona_codigo: pastor.ministerio.iglesia.zona.codigo.toUpperCase(),
        },
        iglesia: {
          id: pastor.iglesia.id,
          nombre: pastor.iglesia.nombre,
          zona_nombre: pastor.iglesia.zona.nombre,
          zona_codigo: pastor.iglesia.zona.codigo.toUpperCase(),
        },
      });
    }

    if (ministerioId) {
      // Comprobar si un ministerio es pastor de alguna iglesia
      const pastor = await prisma.pastorIglesia.findUnique({
        where: { ministerio_id: Number(ministerioId) },
        select: {
          iglesia_id: true,
          iglesia: {
            select: {
              nombre: true,
              zona: {
                select: { nombre: true, codigo: true },
              },
            },
          },
        },
      });

      if (!pastor) {
        return NextResponse.json(null);
      }

      return NextResponse.json({
        iglesia_id: pastor.iglesia_id,
        iglesia_nombre: pastor.iglesia.nombre,
        iglesia_zona: pastor.iglesia.zona.nombre,
        iglesia_zona_codigo: pastor.iglesia.zona.codigo.toUpperCase(),
      });
    }

    return NextResponse.json({ error: "iglesiaId o ministerioId requerido" }, { status: 400 });
  } catch (error) {
    console.error("[GET /api/pastores] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Asignar pastor a una iglesia (reemplaza si ya existe)
export async function POST(req: NextRequest) {
  try {
    const { iglesia_id, ministerio_id } = await req.json();

    if (!iglesia_id || !ministerio_id) {
      return NextResponse.json(
        { error: "iglesia_id y ministerio_id son requeridos" },
        { status: 400 }
      );
    }

    // Buscar pastor previo de la iglesia (si lo tenía) para quitarle el cargo
    const previousPastor = await prisma.pastorIglesia.findUnique({
      where: { iglesia_id },
      select: { ministerio_id: true },
    });

    // Eliminar asignación previa del ministerio como pastor (si la tenía)
    await prisma.pastorIglesia.deleteMany({
      where: { ministerio_id },
    });

    // Eliminar pastor previo de la iglesia (si lo tenía)
    await prisma.pastorIglesia.deleteMany({
      where: { iglesia_id },
    });

    // Quitar el cargo de Pastor (id=1) al ministerio sustituido
    if (previousPastor && previousPastor.ministerio_id !== ministerio_id) {
      await prisma.ministerioCargo.deleteMany({
        where: {
          ministerio_id: previousPastor.ministerio_id,
          cargo_id: 1, // Pastor
        },
      });
    }

    // Crear nueva asignación
    const pastor = await prisma.pastorIglesia.create({
      data: {
        iglesia_id,
        ministerio_id,
      },
    });

    return NextResponse.json({ ok: true, id: pastor.id });
  } catch (error) {
    console.error("[POST /api/pastores] Error:", error);
    return NextResponse.json({ error: "Error al asignar pastor" }, { status: 500 });
  }
}

// DELETE: Quitar pastor de una iglesia o quitar a un ministerio como pastor
export async function DELETE(req: NextRequest) {
  try {
    const { iglesia_id, ministerio_id } = await req.json();

    if (ministerio_id) {
      await prisma.pastorIglesia.deleteMany({
        where: { ministerio_id },
      });
      return NextResponse.json({ ok: true });
    }

    if (iglesia_id) {
      await prisma.pastorIglesia.deleteMany({
        where: { iglesia_id },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "iglesia_id o ministerio_id requerido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[DELETE /api/pastores] Error:", error);
    return NextResponse.json({ error: "Error al quitar pastor" }, { status: 500 });
  }
}
