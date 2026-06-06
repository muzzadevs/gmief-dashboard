import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.zona.findMany({
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ ok: true, data: rows }, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET /api/zonas] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al obtener zonas",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, codigo } = body;

    if (!nombre || !codigo) {
      return NextResponse.json(
        {
          ok: false,
          error: "MISSING_FIELDS",
          message: "Nombre y código son requeridos",
        },
        { status: 400 }
      );
    }

    const normalizedCodigo = codigo.trim().toUpperCase();

    if (normalizedCodigo.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_CODE_LENGTH",
          message: "El código no puede estar vacío",
        },
        { status: 400 }
      );
    }

    if (normalizedCodigo.length > 3) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_CODE_LENGTH",
          message: "El código debe tener máximo 3 caracteres",
        },
        { status: 400 }
      );
    }

    if (!/^[A-Z0-9]+$/.test(normalizedCodigo)) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_CODE_FORMAT",
          message: "El código solo puede contener letras y números",
        },
        { status: 400 }
      );
    }

    const existingZone = await prisma.zona.findFirst({
      where: { codigo: normalizedCodigo, activo: true },
    });

    if (existingZone) {
      return NextResponse.json(
        {
          ok: false,
          error: "DUPLICATE_CODE",
          message: "Ya existe una zona con ese código",
        },
        { status: 409 }
      );
    }

    await prisma.zona.create({
      data: {
        nombre: nombre.trim(),
        codigo: normalizedCodigo,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Zona creada exitosamente",
        data: { nombre: nombre.trim(), codigo: normalizedCodigo },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/zonas] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al crear zona",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { zonas } = body;

    if (!Array.isArray(zonas)) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_DATA",
          message: "Se esperaba un array de zonas",
        },
        { status: 400 }
      );
    }

    const normalizedZonas = [];
    const codigosSet = new Set<string>();

    for (const zona of zonas) {
      if (!zona.id || !zona.nombre || !zona.codigo) {
        return NextResponse.json(
          {
            ok: false,
            error: "MISSING_FIELDS",
            message: "Todas las zonas deben tener id, nombre y código",
          },
          { status: 400 }
        );
      }

      const normalizedCodigo = zona.codigo.trim().toUpperCase();

      if (normalizedCodigo.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "INVALID_CODE_LENGTH",
            message: "El código no puede estar vacío",
          },
          { status: 400 }
        );
      }

      if (normalizedCodigo.length > 3) {
        return NextResponse.json(
          {
            ok: false,
            error: "INVALID_CODE_LENGTH",
            message: "El código debe tener máximo 3 caracteres",
          },
          { status: 400 }
        );
      }

      if (!/^[A-Z0-9]+$/.test(normalizedCodigo)) {
        return NextResponse.json(
          {
            ok: false,
            error: "INVALID_CODE_FORMAT",
            message: "El código solo puede contener letras y números",
          },
          { status: 400 }
        );
      }

      if (codigosSet.has(normalizedCodigo)) {
        return NextResponse.json(
          {
            ok: false,
            error: "DUPLICATE_CODE_IN_BATCH",
            message: `El código "${normalizedCodigo}" está duplicado en la solicitud`,
          },
          { status: 400 }
        );
      }
      codigosSet.add(normalizedCodigo);

      normalizedZonas.push({
        id: zona.id,
        nombre: zona.nombre.trim(),
        codigo: normalizedCodigo,
      });
    }

    // Verificar duplicados con otras zonas en la base de datos
    for (const zona of normalizedZonas) {
      const existingZone = await prisma.zona.findFirst({
        where: {
          codigo: zona.codigo,
          activo: true,
          NOT: { id: zona.id },
        },
      });

      if (existingZone) {
        return NextResponse.json(
          {
            ok: false,
            error: "DUPLICATE_CODE",
            message: `Ya existe otra zona con el código "${zona.codigo}"`,
          },
          { status: 409 }
        );
      }
    }

    // Actualizar cada zona
    for (const zona of normalizedZonas) {
      await prisma.zona.update({
        where: { id: zona.id },
        data: {
          nombre: zona.nombre,
          codigo: zona.codigo,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Zonas actualizadas exitosamente",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[PUT /api/zonas] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al actualizar zonas",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "MISSING_ID", message: "ID es requerido" },
        { status: 400 }
      );
    }

    // Soft delete: zona + subzonas + iglesias + ministerios en cascada
    // 1. Desactivar todos los ministerios de las iglesias de esta zona
    await prisma.ministerio.updateMany({
      where: { iglesia: { zona_id: id }, activo: true },
      data: { activo: false },
    });

    // 2. Desactivar todas las iglesias de esta zona
    await prisma.iglesia.updateMany({
      where: { zona_id: id, activo: true },
      data: { activo: false },
    });

    // 3. Desactivar todas las subzonas de esta zona
    await prisma.subzona.updateMany({
      where: { zona_id: id, activo: true },
      data: { activo: false },
    });

    // 4. Desactivar la zona
    await prisma.zona.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json(
      { ok: true, message: "Zona eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/zonas] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al eliminar zona",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
