import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolverAlcanceZona } from "@/lib/auth";
import { requireGestionMinisteriosPermission } from "@/lib/gestionMinisteriosPermissions";

export async function GET(req: NextRequest) {
  const scope = await resolverAlcanceZona(req);
  const zonaId = req.nextUrl.searchParams.get("zonaId");
  if (!zonaId) return NextResponse.json([]);

  if (zonaId === "ALL") {
    const subzonas = await prisma.subzona.findMany({
      ...(scope
        ? {
            where: { zona_id: scope.zonaId },
          }
        : {}),
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(subzonas);
  }

  if (scope && Number(zonaId) !== scope.zonaId) return NextResponse.json([]);

  const subzonas = await prisma.subzona.findMany({
    where: {
      zona_id: Number(zonaId),
      activo: true,
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(subzonas);
}

export async function POST(req: NextRequest) {
  const denied = await requireGestionMinisteriosPermission(req, "editar", {
    allowZoneScopedEdit: true,
  });
  if (denied) return denied;

  try {
    const scope = await resolverAlcanceZona(req);
    const { nombre, zona_id } = await req.json();

    if (!nombre || !zona_id) {
      return NextResponse.json(
        { error: "Nombre y zona son requeridos" },
        { status: 400 }
      );
    }
    if (scope && Number(zona_id) !== scope.zonaId) {
      return NextResponse.json({ error: "Fuera de tu zona" }, { status: 403 });
    }

    const subzona = await prisma.subzona.create({
      data: { nombre, zona_id },
    });

    return NextResponse.json({
      id: subzona.id,
      message: "Subzona creada exitosamente",
    });
  } catch (error) {
    console.error("Error creating subzona:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const denied = await requireGestionMinisteriosPermission(req, "editar", {
    allowZoneScopedEdit: true,
  });
  if (denied) return denied;

  try {
    const scope = await resolverAlcanceZona(req);
    const { subzonas } = await req.json();

    if (!subzonas || !Array.isArray(subzonas) || subzonas.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de subzonas" },
        { status: 400 }
      );
    }

    for (const subzona of subzonas) {
      if (!subzona.id || !subzona.nombre || !subzona.zona_id) {
        return NextResponse.json(
          { error: "Cada subzona debe tener id, nombre y zona_id" },
          { status: 400 }
        );
      }
    }
    if (scope) {
      const ids = subzonas.map((subzona: { id: number }) => Number(subzona.id));
      const allowedSubzonas = await prisma.subzona.findMany({
        where: {
          id: { in: ids },
          zona_id: scope.zonaId,
        },
        select: { id: true },
      });
      if (
        allowedSubzonas.length !== new Set(ids).size ||
        subzonas.some((subzona: { zona_id: number }) => Number(subzona.zona_id) !== scope.zonaId)
      ) {
        return NextResponse.json({ error: "Fuera de tu zona" }, { status: 403 });
      }
    }

    for (const subzona of subzonas) {
      await prisma.subzona.update({
        where: { id: subzona.id },
        data: {
          nombre: subzona.nombre,
          zona_id: subzona.zona_id,
        },
      });
    }

    return NextResponse.json({
      message: "Subzonas actualizadas exitosamente",
    });
  } catch (error) {
    console.error("Error updating subzonas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireGestionMinisteriosPermission(req, "borrar");
  if (denied) return denied;

  try {
    const scope = await resolverAlcanceZona(req);
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID es requerido" },
        { status: 400 }
      );
    }
    if (scope) {
      const subzona = await prisma.subzona.findFirst({
        where: {
          id: Number(id),
          zona_id: scope.zonaId,
        },
        select: { id: true },
      });
      if (!subzona) {
        return NextResponse.json({ error: "Fuera de tu zona" }, { status: 403 });
      }
    }

    // Soft delete en cascada: ministerios de iglesias de esta subzona
    await prisma.ministerio.updateMany({
      where: { iglesia: { subzona_id: id }, activo: true },
      data: { activo: false },
    });

    // Desactivar iglesias de esta subzona
    await prisma.iglesia.updateMany({
      where: { subzona_id: id, activo: true },
      data: { activo: false },
    });

    // Desactivar la subzona
    await prisma.subzona.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({
      message: "Subzona eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error deleting subzona:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
