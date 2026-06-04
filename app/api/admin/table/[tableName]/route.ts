import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_TOKEN } from "@/store/adminStore";
import { TABLE_DEFINITIONS, TableKey } from "@/lib/adminTableDefs";
import { decrypt, encrypt } from "@/lib/encryption";

// Helper to get Prisma model dynamically
function getPrismaModel(modelName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[modelName];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const token = request.headers.get("X-Admin-Token");
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { tableName } = await params;

  const tableDef = TABLE_DEFINITIONS[tableName as TableKey];
  if (!tableDef) {
    return NextResponse.json(
      { ok: false, error: "TABLE_NOT_FOUND", message: `Tabla "${tableName}" no encontrada` },
      { status: 404 }
    );
  }

  try {
    const model = getPrismaModel(tableDef.model);
    if (!model) {
      return NextResponse.json(
        { ok: false, error: "MODEL_NOT_FOUND", message: `Modelo "${tableDef.model}" no encontrado en Prisma` },
        { status: 500 }
      );
    }

    // Fetch all records (no activo filter - admin sees everything)
    const records = await model.findMany({
      orderBy: { id: "asc" },
    });

    // Process encrypted fields and Bytes fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const encryptedColumns = (tableDef.columns as any[])
      .filter((c) => c.encrypted)
      .map((c) => c.name);

    const bytesColumns = tableDef.columns
      .filter((c) => c.type === "Bytes")
      .map((c) => c.name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedRecords = records.map((record: any) => {
      const processed = { ...record };

      // Decrypt encrypted fields
      for (const col of encryptedColumns) {
        if (processed[col]) {
          try {
            processed[col] = decrypt(processed[col]);
          } catch {
            processed[col] = "[ERROR DESENCRIPTANDO]";
          }
        }
      }

      // Convert Bytes to indicator
      for (const col of bytesColumns) {
        if (processed[col]) {
          processed[col] = "[BLOB_DATA]";
        } else {
          processed[col] = null;
        }
      }

      // Convert Date objects to ISO strings
      for (const key of Object.keys(processed)) {
        if (processed[key] instanceof Date) {
          processed[key] = processed[key].toISOString().split("T")[0];
        }
      }

      return processed;
    });

    return NextResponse.json({
      ok: true,
      data: {
        table: tableName,
        label: tableDef.label,
        columns: tableDef.columns,
        records: processedRecords,
        totalRecords: processedRecords.length,
      },
    });
  } catch (error: unknown) {
    console.error(`[GET /api/admin/table/${tableName}] Error:`, error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al obtener datos",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const token = request.headers.get("X-Admin-Token");
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { tableName } = await params;

  const tableDef = TABLE_DEFINITIONS[tableName as TableKey];
  if (!tableDef) {
    return NextResponse.json(
      { ok: false, error: "TABLE_NOT_FOUND", message: `Tabla "${tableName}" no encontrada` },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS", message: "ID y data son requeridos" },
        { status: 400 }
      );
    }

    const model = getPrismaModel(tableDef.model);
    if (!model) {
      return NextResponse.json(
        { ok: false, error: "MODEL_NOT_FOUND" },
        { status: 500 }
      );
    }

    // Build update data, processing types correctly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    for (const col of tableDef.columns) {
      if (!col.editable) continue;
      if (!(col.name in data)) continue;

      const value = data[col.name];

      // Handle encrypted columns
      if ((col as { encrypted?: boolean }).encrypted) {
        if (value === null || value === "" || value === undefined) {
          updateData[col.name] = null;
        } else {
          updateData[col.name] = encrypt(String(value));
        }
        continue;
      }

      // Skip Bytes columns (not editable from admin panel)
      if (col.type === "Bytes") continue;

      // Type conversion
      switch (col.type) {
        case "Int":
          updateData[col.name] = value === null || value === "" ? null : parseInt(String(value), 10);
          break;
        case "Float":
          updateData[col.name] = value === null || value === "" ? null : parseFloat(String(value));
          break;
        case "Boolean":
          updateData[col.name] = Boolean(value);
          break;
        case "DateTime":
          updateData[col.name] = value === null || value === "" ? null : new Date(value);
          break;
        case "String":
        default:
          updateData[col.name] = value === "" ? null : value;
          break;
      }

      // Validate required fields
      if (col.required && (updateData[col.name] === null || updateData[col.name] === undefined)) {
        return NextResponse.json(
          {
            ok: false,
            error: "VALIDATION_ERROR",
            message: `El campo "${col.name}" es obligatorio`,
          },
          { status: 400 }
        );
      }
    }

    // Perform update
    await model.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      message: `Registro #${id} actualizado correctamente en "${tableDef.label}"`,
    });
  } catch (error: unknown) {
    console.error(`[PUT /api/admin/table/${tableName}] Error:`, error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al actualizar registro",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
