import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolverAlcanceZona } from "@/lib/auth";
import { requireGestionMinisteriosPermission } from "@/lib/gestionMinisteriosPermissions";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireGestionMinisteriosPermission(request, "editar", {
    allowZoneScopedEdit: true,
  });
  if (denied) return denied;

  try {
    const scope = await resolverAlcanceZona(request);
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { latitud, longitud } = await request.json();

    // Validar que si se envían coordenadas, ambas deben estar presentes
    const hasLatitud = latitud !== null && latitud !== undefined;
    const hasLongitud = longitud !== null && longitud !== undefined;

    if (hasLatitud !== hasLongitud) {
      return NextResponse.json(
        { error: "Se deben proporcionar ambas coordenadas (latitud y longitud) o ninguna" },
        { status: 400 }
      );
    }

    if (hasLatitud) {
      const lat = parseFloat(latitud);
      const lng = parseFloat(longitud);

      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { error: "Las coordenadas deben ser números válidos" },
          { status: 400 }
        );
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json(
          { error: "Las coordenadas están fuera de rango" },
          { status: 400 }
        );
      }
    }

    const existingIglesia = await prisma.iglesia.findUnique({
      where: { id },
      select: { id: true, nombre: true, zona_id: true, latitud: true, longitud: true },
    });

    if (!existingIglesia) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }

    if (scope && existingIglesia.zona_id !== scope.zonaId) {
      return NextResponse.json(
        { error: "Iglesia fuera de tu zona" },
        { status: 403 }
      );
    }

    const newLatitud = hasLatitud ? parseFloat(latitud) : null;
    const newLongitud = hasLongitud ? parseFloat(longitud) : null;

    await prisma.iglesia.update({
      where: { id },
      data: {
        latitud: newLatitud,
        longitud: newLongitud,
        ubicacion_manual: hasLatitud,
      },
    });

    const cambios: Record<string, { anterior: string | null; nuevo: string | null }> = {};
    if (existingIglesia.latitud !== newLatitud) {
      cambios.latitud = {
        anterior: existingIglesia.latitud !== null ? String(existingIglesia.latitud) : null,
        nuevo: newLatitud !== null ? String(newLatitud) : null,
      };
    }
    if (existingIglesia.longitud !== newLongitud) {
      cambios.longitud = {
        anterior: existingIglesia.longitud !== null ? String(existingIglesia.longitud) : null,
        nuevo: newLongitud !== null ? String(newLongitud) : null,
      };
    }

    await registrarAuditoria(request, {
      accion: "EDITAR",
      entidad: "Iglesia",
      entidadId: id,
      resumen: hasLatitud
        ? `Actualizó manualmente la ubicación de la iglesia ${existingIglesia.nombre}`
        : `Eliminó la ubicación manual de la iglesia ${existingIglesia.nombre}`,
      identificacion: existingIglesia.nombre,
      campos: Object.keys(cambios),
      cambios,
    });

    return NextResponse.json({
      ok: true,
      message: hasLatitud
        ? "Ubicación actualizada correctamente"
        : "Ubicación eliminada correctamente",
      data: {
        latitud: newLatitud,
        longitud: newLongitud,
        ubicacion_manual: hasLatitud,
      },
    });
  } catch (error) {
    console.error("[PUT /api/iglesias/[id]/ubicacion] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
