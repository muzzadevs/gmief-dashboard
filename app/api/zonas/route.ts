import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export type Zona = {
  id: number;
  nombre: string;
  codigo: string;
};

export async function GET() {
  console.log("[GET /api/zonas] Starting request");

  try {
    console.log("[GET /api/zonas] Executing database query...");

    const rows = await query<Zona[]>(
      "SELECT id, nombre, codigo FROM zonas ORDER BY nombre ASC"
    );

    console.log(
      "[GET /api/zonas] Query successful, rows count:",
      Array.isArray(rows) ? rows.length : "Not an array"
    );
    console.log("[GET /api/zonas] Data type:", typeof rows);
    console.log("[GET /api/zonas] First row sample:", rows?.[0]);

    if (!Array.isArray(rows)) {
      console.error(
        "[GET /api/zonas] Expected array but got:",
        typeof rows,
        rows
      );
      return NextResponse.json(
        {
          ok: false,
          error: "DATA_FORMAT_ERROR",
          message: "Formato de datos incorrecto",
        },
        { status: 500 }
      );
    }

    console.log("[GET /api/zonas] Returning successful response");
    return NextResponse.json({ ok: true, data: rows }, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET /api/zonas] === ERROR DETAILS ===");
    console.error("[GET /api/zonas] Error type:", typeof error);
    console.error(
      "[GET /api/zonas] Error instanceof Error:",
      error instanceof Error
    );

    if (error instanceof Error) {
      console.error("[GET /api/zonas] Error name:", error.name);
      console.error("[GET /api/zonas] Error message:", error.message);
      console.error("[GET /api/zonas] Error stack:", error.stack);
    } else {
      console.error("[GET /api/zonas] Raw error object:", error);
      console.error(
        "[GET /api/zonas] Error stringified:",
        JSON.stringify(error, null, 2)
      );
    }

    // También verificar variables de entorno de DB
    console.error("[GET /api/zonas] DB Config check:");
    console.error("- DB_HOST:", process.env.DB_HOST || "NOT SET");
    console.error("- DB_USER:", process.env.DB_USER || "NOT SET");
    console.error("- DB_NAME:", process.env.DB_NAME || "NOT SET");
    console.error("- DB_PORT:", process.env.DB_PORT || "NOT SET");
    console.error(
      "- DB_PASSWORD:",
      process.env.DB_PASSWORD ? "SET" : "NOT SET"
    );

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
  console.log("[POST /api/zonas] Starting request");

  try {
    const body = await request.json();
    const { nombre, codigo } = body;

    console.log("[POST /api/zonas] Request body:", { nombre, codigo });

    // Validar datos requeridos
    if (!nombre || !codigo) {
      console.log("[POST /api/zonas] Missing required fields");
      return NextResponse.json(
        {
          ok: false,
          error: "MISSING_FIELDS",
          message: "Nombre y código son requeridos",
        },
        { status: 400 }
      );
    }

    // Normalizar y validar código
    const normalizedCodigo = codigo.trim().toUpperCase();

    // Validar longitud del código (máximo 3 caracteres)
    if (normalizedCodigo.length === 0) {
      console.log("[POST /api/zonas] Empty codigo after trim");
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
      console.log(
        "[POST /api/zonas] Codigo too long:",
        normalizedCodigo.length
      );
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_CODE_LENGTH",
          message: "El código debe tener máximo 3 caracteres",
        },
        { status: 400 }
      );
    }

    // Validar que solo contenga letras y números
    if (!/^[A-Z0-9]+$/.test(normalizedCodigo)) {
      console.log("[POST /api/zonas] Invalid codigo format:", normalizedCodigo);
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_CODE_FORMAT",
          message: "El código solo puede contener letras y números",
        },
        { status: 400 }
      );
    }

    // Verificar si el código ya existe
    const existingZone = await query<Zona[]>(
      "SELECT id FROM zonas WHERE codigo = ?",
      [normalizedCodigo]
    );

    if (Array.isArray(existingZone) && existingZone.length > 0) {
      console.log("[POST /api/zonas] Codigo already exists:", normalizedCodigo);
      return NextResponse.json(
        {
          ok: false,
          error: "DUPLICATE_CODE",
          message: "Ya existe una zona con ese código",
        },
        { status: 409 }
      );
    }

    console.log("[POST /api/zonas] Inserting new zone...");

    const result = await query(
      "INSERT INTO zonas (nombre, codigo) VALUES (?, ?)",
      [nombre.trim(), normalizedCodigo]
    );

    console.log("[POST /api/zonas] Insert result:", result);

    return NextResponse.json(
      {
        ok: true,
        message: "Zona creada exitosamente",
        data: { nombre: nombre.trim(), codigo: normalizedCodigo },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/zonas] === ERROR DETAILS ===");
    console.error("[POST /api/zonas] Error type:", typeof error);

    if (error instanceof Error) {
      console.error("[POST /api/zonas] Error name:", error.name);
      console.error("[POST /api/zonas] Error message:", error.message);
      console.error("[POST /api/zonas] Error stack:", error.stack);
    } else {
      console.error("[POST /api/zonas] Raw error object:", error);
    }

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
  console.log("[PUT /api/zonas] Starting request");

  try {
    const body = await request.json();
    const { zonas } = body;

    console.log("[PUT /api/zonas] Request body:", { zonas });

    // Validar que se recibió el array de zonas
    if (!Array.isArray(zonas)) {
      console.log("[PUT /api/zonas] Invalid zonas array");
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_DATA",
          message: "Se esperaba un array de zonas",
        },
        { status: 400 }
      );
    }

    // Validar cada zona y sus códigos
    const normalizedZonas = [];
    const codigosSet = new Set();

    for (const zona of zonas) {
      if (!zona.id || !zona.nombre || !zona.codigo) {
        console.log("[PUT /api/zonas] Missing fields in zona:", zona);
        return NextResponse.json(
          {
            ok: false,
            error: "MISSING_FIELDS",
            message: "Todas las zonas deben tener id, nombre y código",
          },
          { status: 400 }
        );
      }

      // Normalizar y validar código
      const normalizedCodigo = zona.codigo.trim().toUpperCase();

      // Validar longitud del código (máximo 3 caracteres)
      if (normalizedCodigo.length === 0) {
        console.log(
          "[PUT /api/zonas] Empty codigo after trim in zona:",
          zona.id
        );
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
        console.log(
          "[PUT /api/zonas] Codigo too long in zona:",
          zona.id,
          normalizedCodigo.length
        );
        return NextResponse.json(
          {
            ok: false,
            error: "INVALID_CODE_LENGTH",
            message: "El código debe tener máximo 3 caracteres",
          },
          { status: 400 }
        );
      }

      // Validar que solo contenga letras y números
      if (!/^[A-Z0-9]+$/.test(normalizedCodigo)) {
        console.log(
          "[PUT /api/zonas] Invalid codigo format in zona:",
          zona.id,
          normalizedCodigo
        );
        return NextResponse.json(
          {
            ok: false,
            error: "INVALID_CODE_FORMAT",
            message: "El código solo puede contener letras y números",
          },
          { status: 400 }
        );
      }

      // Verificar duplicados en el lote
      if (codigosSet.has(normalizedCodigo)) {
        console.log(
          "[PUT /api/zonas] Duplicate codigo in batch:",
          normalizedCodigo
        );
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
      const existingZone = await query<Zona[]>(
        "SELECT id FROM zonas WHERE codigo = ? AND id != ?",
        [zona.codigo, zona.id]
      );

      if (Array.isArray(existingZone) && existingZone.length > 0) {
        console.log(
          "[PUT /api/zonas] Codigo already exists for different zona:",
          zona.codigo
        );
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

    console.log("[PUT /api/zonas] Updating zones...");

    // Actualizar cada zona con datos normalizados
    for (const zona of normalizedZonas) {
      await query("UPDATE zonas SET nombre = ?, codigo = ? WHERE id = ?", [
        zona.nombre,
        zona.codigo,
        zona.id,
      ]);
    }

    console.log("[PUT /api/zonas] All zones updated successfully");

    return NextResponse.json(
      {
        ok: true,
        message: "Zonas actualizadas exitosamente",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[PUT /api/zonas] === ERROR DETAILS ===");
    console.error("[PUT /api/zonas] Error type:", typeof error);

    if (error instanceof Error) {
      console.error("[PUT /api/zonas] Error name:", error.name);
      console.error("[PUT /api/zonas] Error message:", error.message);
      console.error("[PUT /api/zonas] Error stack:", error.stack);
    } else {
      console.error("[PUT /api/zonas] Raw error object:", error);
    }

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
