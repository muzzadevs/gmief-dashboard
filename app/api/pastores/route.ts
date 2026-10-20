import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGestionMinisteriosPermission } from "@/lib/gestionMinisteriosPermissions";

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
  const denied = await requireGestionMinisteriosPermission(req, "editar");
  if (denied) return denied;

  try {
    const { iglesia_id, ministerio_id } = await req.json();

    if (!iglesia_id || !ministerio_id) {
      return NextResponse.json(
        { error: "iglesia_id y ministerio_id son requeridos" },
        { status: 400 }
      );
    }

    const pastor = await prisma.$transaction(async (tx) => {
      const [iglesiaNueva, asignacionesAnteriores] = await Promise.all([
        tx.iglesia.findUnique({
          where: { id: Number(iglesia_id) },
          select: {
            nombre: true,
            zona: { select: { codigo: true } },
          },
        }),
        tx.pastorIglesia.findMany({
          where: {
            OR: [
              { ministerio_id: Number(ministerio_id) },
              { iglesia_id: Number(iglesia_id) },
            ],
          },
          include: {
            iglesia: {
              select: {
                nombre: true,
                zona: { select: { codigo: true } },
              },
            },
          },
        }),
      ]);

      if (!iglesiaNueva) {
        throw new Error(`No se encontró la iglesia con id ${iglesia_id}`);
      }

      const asignacionActual = asignacionesAnteriores.find(
        (asignacion) =>
          asignacion.ministerio_id === Number(ministerio_id) &&
          asignacion.iglesia_id === Number(iglesia_id)
      );

      for (const asignacion of asignacionesAnteriores) {
        if (asignacion.id === asignacionActual?.id) continue;

        await tx.ministerioHistorico.create({
          data: {
            ministerio_id: asignacion.ministerio_id,
            campo: "Fin como pastor",
            valor_anterior: `Pastor de [${asignacion.iglesia.zona.codigo.toUpperCase()}] ${asignacion.iglesia.nombre}`,
            valor_nuevo: `Fin del nombramiento en [${asignacion.iglesia.zona.codigo.toUpperCase()}] ${asignacion.iglesia.nombre}`,
          },
        });
      }

      await tx.pastorIglesia.deleteMany({
        where: {
          OR: [
            { ministerio_id: Number(ministerio_id) },
            { iglesia_id: Number(iglesia_id) },
          ],
        },
      });

      for (const asignacion of asignacionesAnteriores) {
        if (
          asignacion.ministerio_id !== Number(ministerio_id) &&
          asignacion.iglesia_id === Number(iglesia_id)
        ) {
          await tx.ministerioCargo.deleteMany({
            where: {
              ministerio_id: asignacion.ministerio_id,
              cargo_id: 1,
            },
          });
        }
      }

      const nuevaAsignacion = await tx.pastorIglesia.create({
        data: {
          iglesia_id: Number(iglesia_id),
          ministerio_id: Number(ministerio_id),
        },
      });

      if (!asignacionActual) {
        await tx.ministerioHistorico.create({
          data: {
            ministerio_id: Number(ministerio_id),
            campo: "Inicio como pastor",
            valor_anterior: "Sin nombramiento",
            valor_nuevo: `Pastor de [${iglesiaNueva.zona.codigo.toUpperCase()}] ${iglesiaNueva.nombre}`,
          },
        });
      }

      return nuevaAsignacion;
    });

    return NextResponse.json({ ok: true, id: pastor.id });
  } catch (error) {
    console.error("[POST /api/pastores] Error:", error);
    return NextResponse.json({ error: "Error al asignar pastor" }, { status: 500 });
  }
}

// DELETE: Quitar pastor de una iglesia o quitar a un ministerio como pastor
export async function DELETE(req: NextRequest) {
  const denied = await requireGestionMinisteriosPermission(req, "borrar");
  if (denied) return denied;

  try {
    const { iglesia_id, ministerio_id } = await req.json();

    if (ministerio_id) {
      await prisma.$transaction(async (tx) => {
        const asignaciones = await tx.pastorIglesia.findMany({
          where: { ministerio_id: Number(ministerio_id) },
          include: {
            iglesia: {
              select: {
                nombre: true,
                zona: { select: { codigo: true } },
              },
            },
          },
        });

        for (const asignacion of asignaciones) {
          await tx.ministerioHistorico.create({
            data: {
              ministerio_id: Number(ministerio_id),
              campo: "Fin como pastor",
              valor_anterior: `Pastor de [${asignacion.iglesia.zona.codigo.toUpperCase()}] ${asignacion.iglesia.nombre}`,
              valor_nuevo: `Fin del nombramiento en [${asignacion.iglesia.zona.codigo.toUpperCase()}] ${asignacion.iglesia.nombre}`,
            },
          });
        }

        await tx.pastorIglesia.deleteMany({
          where: { ministerio_id: Number(ministerio_id) },
        });
      });
      return NextResponse.json({ ok: true });
    }

    if (iglesia_id) {
      await prisma.$transaction(async (tx) => {
        const asignacion = await tx.pastorIglesia.findUnique({
          where: { iglesia_id: Number(iglesia_id) },
          include: {
            iglesia: {
              select: {
                nombre: true,
                zona: { select: { codigo: true } },
              },
            },
          },
        });

        if (asignacion) {
          await tx.ministerioHistorico.create({
            data: {
              ministerio_id: asignacion.ministerio_id,
              campo: "Fin como pastor",
              valor_anterior: `Pastor de [${asignacion.iglesia.zona.codigo.toUpperCase()}] ${asignacion.iglesia.nombre}`,
              valor_nuevo: `Fin del nombramiento en [${asignacion.iglesia.zona.codigo.toUpperCase()}] ${asignacion.iglesia.nombre}`,
            },
          });
        }

        await tx.pastorIglesia.deleteMany({
          where: { iglesia_id: Number(iglesia_id) },
        });
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
