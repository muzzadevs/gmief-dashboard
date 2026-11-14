import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_TOKEN } from "@/store/adminStore";
import { coerceValueByType, getAdminTableDefinition, INVALID_COERCION } from "@/lib/adminDynamicTables";
import { decrypt, encrypt } from "@/lib/encryption";
import { requireSuperAdmin } from "@/lib/adminPermissions";
import { registrarAuditoria } from "@/lib/auditoria";

// Helper to get Prisma model dynamically
function getPrismaModel(modelName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[modelName];
}

function valorAuditoria(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toLocaleDateString("es-ES");
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return null;
}

function identificacionRegistro(
  record: Record<string, unknown> | null | undefined
): string | undefined {
  if (!record) return undefined;
  const campos = ["nombre", "apellidos", "codigo", "username", "cargo", "clave", "titulo"];
  const partes = campos
    .map((campo) => record[campo])
    .filter((valor): valor is string => typeof valor === "string" && valor.trim() !== "");
  return partes.length > 0 ? partes.join(" · ") : undefined;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

  const token = request.headers.get("X-Admin-Token");
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { tableName } = await params;

  const tableDef = await getAdminTableDefinition(tableName);
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

    const records = await model.findMany(
      tableDef.primaryKey
        ? {
            orderBy: { [tableDef.primaryKey]: "asc" },
          }
        : undefined
    );

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
        } else if (typeof processed[key] === "bigint") {
          processed[key] = processed[key].toString();
        }
      }

      return processed;
    });

    return NextResponse.json({
      ok: true,
      data: {
        table: tableName,
        label: tableDef.label,
        primaryKey: tableDef.primaryKey,
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
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

  const token = request.headers.get("X-Admin-Token");
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { tableName } = await params;

  const tableDef = await getAdminTableDefinition(tableName);
  if (!tableDef) {
    return NextResponse.json(
      { ok: false, error: "TABLE_NOT_FOUND", message: `Tabla "${tableName}" no encontrada` },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { id, idField, data } = body;

    if (id === undefined || id === null || !data) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS", message: "ID y data son requeridos" },
        { status: 400 }
      );
    }

    const primaryColumn =
      tableDef.columns.find((col) => col.primary && col.name === idField) ??
      tableDef.columns.find((col) => col.primary);

    if (!primaryColumn) {
      return NextResponse.json(
        {
          ok: false,
          error: "NO_PRIMARY_KEY",
          message: "La tabla no tiene clave primaria editable para operaciones de actualización",
        },
        { status: 400 }
      );
    }

    const coercedPrimaryId = coerceValueByType(primaryColumn.type, id);
    if (coercedPrimaryId === null || coercedPrimaryId === INVALID_COERCION) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          message: `La clave primaria "${primaryColumn.name}" tiene un formato invalido`,
        },
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
      const coerced = coerceValueByType(col.type, value);
      if (coerced === INVALID_COERCION) {
        return NextResponse.json(
          {
            ok: false,
            error: "VALIDATION_ERROR",
            message: `El campo "${col.name}" tiene un valor invalido para tipo ${col.type}`,
          },
          { status: 400 }
        );
      }
      updateData[col.name] = coerced;

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
    const where = {
      [primaryColumn.name]: coercedPrimaryId,
    };
    const registroAnterior = await model.findUnique({ where });
    const registroActualizado = await model.update({
      where: {
        [primaryColumn.name]: coercedPrimaryId,
      },
      data: updateData,
    });

    const cambios = Object.fromEntries(
      Object.entries(updateData)
        .filter(([campo]) => !campo.endsWith("_id") && campo !== "id")
        .map(([campo, valorNuevo]) => [
          campo,
          {
            anterior: valorAuditoria(registroAnterior?.[campo]),
            nuevo: valorAuditoria(valorNuevo),
          },
        ])
    );
    const identificacion =
      identificacionRegistro(registroActualizado) ??
      identificacionRegistro(registroAnterior);

    await registrarAuditoria(request, {
      accion: "EDITAR",
      entidad: tableDef.label,
      entidadId: String(id),
      identificacion,
      resumen: `Editó ${identificacion ?? "un registro"} de ${tableDef.label}`,
      campos: Object.keys(updateData),
      cambios,
    });

    return NextResponse.json({
      ok: true,
      message: `Registro ${String(id)} actualizado correctamente en "${tableDef.label}"`,
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

  const token = request.headers.get("X-Admin-Token");
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { tableName } = await params;

  const tableDef = await getAdminTableDefinition(tableName);
  if (!tableDef) {
    return NextResponse.json(
      { ok: false, error: "TABLE_NOT_FOUND", message: `Tabla "${tableName}" no encontrada` },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS", message: "Data es requerido" },
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

    // Build create data, processing types correctly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: Record<string, any> = {};

    for (const col of tableDef.columns) {
      // Skip primary key (auto-increment)
      if (col.primary) continue;
      if (!(col.name in data)) {
        if (col.required) {
          return NextResponse.json(
            {
              ok: false,
              error: "VALIDATION_ERROR",
              message: `El campo "${col.name}" es obligatorio`,
            },
            { status: 400 }
          );
        }
        continue;
      }

      const value = data[col.name];

      // Handle encrypted columns
      if ((col as { encrypted?: boolean }).encrypted) {
        if (value === null || value === "" || value === undefined) {
          createData[col.name] = null;
        } else {
          createData[col.name] = encrypt(String(value));
        }
        continue;
      }

      // Skip Bytes columns
      if (col.type === "Bytes") continue;

      // Type conversion
      const coerced = coerceValueByType(col.type, value);
      if (coerced === INVALID_COERCION) {
        return NextResponse.json(
          {
            ok: false,
            error: "VALIDATION_ERROR",
            message: `El campo "${col.name}" tiene un valor invalido para tipo ${col.type}`,
          },
          { status: 400 }
        );
      }
      createData[col.name] = coerced;

      // Validate required fields
      if (col.required && (createData[col.name] === null || createData[col.name] === undefined)) {
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

    const created = await model.create({
      data: createData,
    });
    const identificacion = identificacionRegistro(created);

    await registrarAuditoria(request, {
      accion: "CREAR",
      entidad: tableDef.label,
      entidadId: created.id,
      identificacion,
      resumen: `Creó ${identificacion ?? "un registro"} en ${tableDef.label}`,
      campos: Object.keys(createData),
    });

    return NextResponse.json({
      ok: true,
      message: `Registro creado correctamente en "${tableDef.label}"`,
      id: created.id,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error(`[POST /api/admin/table/${tableName}] Error:`, error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al crear registro",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

  const token = request.headers.get("X-Admin-Token");
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { tableName } = await params;

  const tableDef = await getAdminTableDefinition(tableName);
  if (!tableDef) {
    return NextResponse.json(
      { ok: false, error: "TABLE_NOT_FOUND", message: `Tabla "${tableName}" no encontrada` },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { id, idField } = body;

    if (id === undefined || id === null) {
      return NextResponse.json(
        { ok: false, error: "MISSING_ID", message: "ID es requerido" },
        { status: 400 }
      );
    }

    const primaryColumn =
      tableDef.columns.find((col) => col.primary && col.name === idField) ??
      tableDef.columns.find((col) => col.primary);

    if (!primaryColumn) {
      return NextResponse.json(
        {
          ok: false,
          error: "NO_PRIMARY_KEY",
          message: "La tabla no tiene clave primaria editable para operaciones de eliminación",
        },
        { status: 400 }
      );
    }

    const coercedPrimaryId = coerceValueByType(primaryColumn.type, id);
    if (coercedPrimaryId === null || coercedPrimaryId === INVALID_COERCION) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          message: `La clave primaria "${primaryColumn.name}" tiene un formato invalido`,
        },
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

    const where = { [primaryColumn.name]: coercedPrimaryId };
    const registroAEliminar = await model.findUnique({ where });
    const identificacion = identificacionRegistro(registroAEliminar);
    await model.delete({ where });

    await registrarAuditoria(request, {
      accion: "ELIMINAR",
      entidad: tableDef.label,
      entidadId: String(id),
      identificacion,
      resumen: `Eliminó permanentemente ${identificacion ?? "un registro"} de ${tableDef.label}`,
      campos: ["registro"],
    });

    return NextResponse.json({
      ok: true,
      message: `Registro ${String(id)} eliminado permanentemente de "${tableDef.label}"`,
    });
  } catch (error: unknown) {
    console.error(`[DELETE /api/admin/table/${tableName}] Error:`, error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for foreign key constraint errors
    if (errorMessage.includes("foreign key") || errorMessage.includes("constraint") || errorMessage.includes("FOREIGN")) {
      return NextResponse.json(
        {
          ok: false,
          error: "FK_CONSTRAINT",
          message: `No se puede eliminar: el registro tiene datos relacionados en otras tablas. Elimina primero las dependencias.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al eliminar registro",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
