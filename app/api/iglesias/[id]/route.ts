import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodeIglesia, addressFieldsChanged } from "@/lib/geocode";
import { resolverAlcanceZona } from "@/lib/auth";
import { requireGestionMinisteriosPermission } from "@/lib/gestionMinisteriosPermissions";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  IGLESIA_SOCIAL_NETWORKS,
  isValidIglesiaSocialUrl,
  normalizeIglesiaSocialUrl,
} from "@/lib/iglesiaSocialLinks";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const iglesia = await prisma.iglesia.findUnique({
      where: { id },
    });

    if (!iglesia) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(iglesia);
  } catch (error) {
    console.error("Error fetching iglesia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireGestionMinisteriosPermission(request, "borrar");
  if (denied) return denied;

  try {
    const scope = await resolverAlcanceZona(request);
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    if (scope) {
      const iglesia = await prisma.iglesia.findFirst({
        where: {
          id,
          zona_id: scope.zonaId,
        },
        select: { id: true },
      });
      if (!iglesia) {
        return NextResponse.json({ error: "Iglesia fuera de tu zona" }, { status: 403 });
      }
    }

    // Soft delete en cascada: desactivar ministerios de esta iglesia
    const ministeriosDesactivados = await prisma.ministerio.updateMany({
      where: { iglesia_id: id, activo: true },
      data: { activo: false },
    });

    // Desactivar la iglesia
    await prisma.iglesia.update({
      where: { id },
      data: { activo: false },
    });

    await registrarAuditoria(request, {
      accion: "BAJA",
      entidad: "Iglesia",
      entidadId: id,
      resumen: `Desactivó la iglesia con ID ${id} y ${ministeriosDesactivados.count} ministerios asociados`,
      campos: ["activo"],
      detalles: { ministerios_desactivados: ministeriosDesactivados.count },
    });

    return NextResponse.json({
      message: "Iglesia eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error deleting iglesia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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

    const {
      nombre,
      direccion,
      municipio,
      provincia,
      cp,
      zona_id,
      subzona_id,
      facebook_url,
      youtube_url,
      tiktok_url,
      instagram_url,
    } = await request.json();
    const socialUrls = {
      facebook: facebook_url,
      youtube: youtube_url,
      tiktok: tiktok_url,
      instagram: instagram_url,
    };

    for (const network of IGLESIA_SOCIAL_NETWORKS) {
      if (
        socialUrls[network] !== undefined &&
        !isValidIglesiaSocialUrl(socialUrls[network], network)
      ) {
        return NextResponse.json(
          { error: `La URL de ${network} no es válida` },
          { status: 400 }
        );
      }
    }

    if (!nombre || !zona_id) {
      return NextResponse.json(
        { error: "Nombre y zona son requeridos" },
        { status: 400 }
      );
    }

    const existingIglesia = await prisma.iglesia.findUnique({
      where: { id },
      include: {
        zona: { select: { nombre: true, codigo: true } },
        subzona: { select: { nombre: true } },
      },
    });

    if (!existingIglesia) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }
    if (
      scope &&
      (existingIglesia.zona_id !== scope.zonaId || Number(zona_id) !== scope.zonaId)
    ) {
      return NextResponse.json({ error: "Fuera de tu zona" }, { status: 403 });
    }

    const [zonaNueva, subzonaNueva] = await Promise.all([
      prisma.zona.findUnique({
        where: { id: Number(zona_id) },
        select: { nombre: true, codigo: true },
      }),
      subzona_id
        ? prisma.subzona.findFirst({
            where: { id: Number(subzona_id), zona_id: Number(zona_id) },
            select: { id: true, nombre: true },
          })
        : Promise.resolve(null),
    ]);
    if (!zonaNueva) {
      return NextResponse.json({ error: "Zona no encontrada" }, { status: 400 });
    }

    if (subzona_id) {
      const subzona = subzonaNueva;
      if (!subzona) {
        return NextResponse.json({ error: "La subzona no pertenece a la zona" }, { status: 400 });
      }
    }

    // Verificar si los campos de dirección cambiaron para re-geocodificar
    let latitud = existingIglesia.latitud;
    let longitud = existingIglesia.longitud;

    const newAddress = {
      direccion: direccion || null,
      municipio: municipio || null,
      provincia: provincia || null,
      cp: cp || null,
    };

    const oldAddress = {
      direccion: existingIglesia.direccion,
      municipio: existingIglesia.municipio,
      provincia: existingIglesia.provincia,
      cp: existingIglesia.cp,
    };

    if (addressFieldsChanged(newAddress, oldAddress)) {
      // Los campos de dirección cambiaron, re-geocodificar
      if (municipio && provincia) {
        try {
          const coords = await geocodeIglesia(newAddress);
          if (coords) {
            latitud = coords.latitud;
            longitud = coords.longitud;
          } else {
            // No se encontró, limpiar coordenadas
            latitud = null;
            longitud = null;
          }
        } catch (error) {
          console.error("[PUT /api/iglesias] Error geocodificando:", error);
          // Mantener las coordenadas actuales si falla
        }
      } else {
        // Se quitaron datos de dirección, limpiar coordenadas
        latitud = null;
        longitud = null;
      }
    }

    await prisma.iglesia.update({
      where: { id },
      data: {
        nombre,
        direccion: direccion || null,
        municipio: municipio || null,
        provincia: provincia || null,
        cp: cp || null,
        zona_id,
        subzona_id: subzona_id || null,
        latitud,
        longitud,
        ...(facebook_url !== undefined && {
          facebook_url: normalizeIglesiaSocialUrl(facebook_url),
        }),
        ...(youtube_url !== undefined && {
          youtube_url: normalizeIglesiaSocialUrl(youtube_url),
        }),
        ...(tiktok_url !== undefined && {
          tiktok_url: normalizeIglesiaSocialUrl(tiktok_url),
        }),
        ...(instagram_url !== undefined && {
          instagram_url: normalizeIglesiaSocialUrl(instagram_url),
        }),
      },
    });

    const cambios = {
      ...(existingIglesia.nombre !== nombre
        ? { nombre: { anterior: existingIglesia.nombre, nuevo: nombre } }
        : {}),
      ...(existingIglesia.municipio !== (municipio || null)
        ? {
            municipio: {
              anterior: existingIglesia.municipio,
              nuevo: municipio || null,
            },
          }
        : {}),
      ...(existingIglesia.provincia !== (provincia || null)
        ? {
            provincia: {
              anterior: existingIglesia.provincia,
              nuevo: provincia || null,
            },
          }
        : {}),
      ...(existingIglesia.cp !== (cp ? Number(cp) : null)
        ? {
            cp: {
              anterior: existingIglesia.cp === null ? null : String(existingIglesia.cp),
              nuevo: cp ? String(cp) : null,
            },
          }
        : {}),
      ...(existingIglesia.zona_id !== Number(zona_id)
        ? {
            zona: {
              anterior: `${existingIglesia.zona.nombre} · ${existingIglesia.zona.codigo}`,
              nuevo: `${zonaNueva.nombre} · ${zonaNueva.codigo}`,
            },
          }
        : {}),
      ...(existingIglesia.subzona_id !== (subzona_id ? Number(subzona_id) : null)
        ? {
            subzona: {
              anterior: existingIglesia.subzona?.nombre ?? null,
              nuevo: subzonaNueva?.nombre ?? null,
            },
          }
        : {}),
    };

    await registrarAuditoria(request, {
      accion: "EDITAR",
      entidad: "Iglesia",
      entidadId: id,
      resumen: `Actualizó la iglesia ${nombre}`,
      identificacion: `${nombre} · Zona ${zonaNueva.nombre}`,
      campos: Object.keys(cambios),
      cambios,
    });

    return NextResponse.json({
      id,
      message: "Iglesia actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error updating iglesia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
