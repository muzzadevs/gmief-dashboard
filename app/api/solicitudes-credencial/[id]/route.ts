import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

// GET: Obtener solicitud con detalle completo de ministerios
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const solicitud = await prisma.solicitudCredencial.findUnique({
      where: { id: Number(id) },
      include: {
        items: {
          include: {
            ministerio: {
              include: {
                iglesia: {
                  include: {
                    zona: { select: { nombre: true, codigo: true } },
                  },
                },
                cargos: {
                  include: {
                    cargo: { select: { cargo: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!solicitud) {
      return NextResponse.json(
        { ok: false, error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    const result = {
      id: solicitud.id,
      fecha: solicitud.fecha,
      estado: solicitud.estado,
      notas: solicitud.notas,
      items: solicitud.items.map((item) => {
        const m = item.ministerio;

        // Decrypt DNI/NIE
        let dni: string | null = null;
        let nie: string | null = null;
        if (m.dni_encrypted) {
          try { dni = decrypt(m.dni_encrypted); } catch { dni = null; }
        }
        if (m.nie_encrypted) {
          try { nie = decrypt(m.nie_encrypted); } catch { nie = null; }
        }

        return {
          id: item.id,
          expedida: item.expedida,
          fecha_expedicion: item.fecha_expedicion,
          ministerio: {
            id: m.id,
            nombre: m.nombre,
            apellidos: m.apellidos,
            alias: m.alias,
            codigo: m.codigo,
            dni,
            nie,
            has_imagen: m.imagen !== null && m.imagen !== undefined,
            iglesia_nombre: m.iglesia.nombre,
            zona_nombre: m.iglesia.zona.nombre,
            zona_codigo: m.iglesia.zona.codigo.toUpperCase(),
            cargos: m.cargos.map((c) => c.cargo.cargo),
          },
        };
      }),
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    console.error(`[GET /api/solicitudes-credencial/${id}] Error:`, error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener solicitud" },
      { status: 500 }
    );
  }
}
