import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Comprobar si una iglesia ya tiene pastor asignado (para modal de confirmación)
export async function GET(req: NextRequest) {
  const iglesiaId = req.nextUrl.searchParams.get("iglesiaId");

  if (!iglesiaId) {
    return NextResponse.json({ error: "iglesiaId requerido" }, { status: 400 });
  }

  try {
    const pastor = await prisma.pastorIglesia.findUnique({
      where: { iglesia_id: Number(iglesiaId) },
      include: {
        ministerio: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            alias: true,
            iglesia_id: true,
            iglesia: {
              select: {
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
      return NextResponse.json({ has_pastor: false });
    }

    const m = pastor.ministerio;
    const displayName = m.alias || `${m.nombre} ${m.apellidos || ""}`.trim();

    return NextResponse.json({
      has_pastor: true,
      pastor: {
        ministerio_id: m.id,
        display_name: displayName,
        nombre: m.nombre,
        apellidos: m.apellidos,
        alias: m.alias,
        iglesia_nombre: m.iglesia.nombre,
        zona_nombre: m.iglesia.zona.nombre,
        zona_codigo: m.iglesia.zona.codigo.toUpperCase(),
      },
      iglesia: {
        nombre: pastor.iglesia.nombre,
        zona_nombre: pastor.iglesia.zona.nombre,
        zona_codigo: pastor.iglesia.zona.codigo.toUpperCase(),
      },
    });
  } catch (error) {
    console.error("[GET /api/pastores/check] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
