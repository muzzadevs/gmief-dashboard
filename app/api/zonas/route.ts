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
