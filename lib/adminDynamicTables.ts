import { prisma } from "@/lib/prisma";

export interface AdminColumnDef {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
  primary?: boolean;
  maxLength?: number;
  encrypted?: boolean;
}

export interface AdminTableDef {
  key: string;
  label: string;
  model: string;
  columns: AdminColumnDef[];
  primaryKey: string | null;
}

export const INVALID_COERCION = Symbol("INVALID_COERCION");

interface RuntimeField {
  name: string;
  kind: string;
  type: string;
}

interface RuntimeModel {
  dbName?: string | null;
  fields: RuntimeField[];
}

interface ColumnMetaRow {
  name: string;
  dataType: string;
  isNullable: "YES" | "NO";
  columnKey: string;
  extra: string;
  maxLength: number | bigint | null;
  columnDefault: string | null;
}

function toDelegateName(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function capitalizeWord(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function modelNameToLabel(modelName: string): string {
  return modelName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map(capitalizeWord)
    .join(" ");
}

function tableNameToLabel(tableName: string): string {
  return tableName
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map(capitalizeWord)
    .join(" ");
}

function mapPrismaScalarTypeToAdminType(type: string): string {
  switch (type) {
    case "Int":
    case "BigInt":
      return "Int";
    case "Float":
    case "Decimal":
      return "Float";
    case "Boolean":
      return "Boolean";
    case "DateTime":
      return "DateTime";
    case "Bytes":
      return "Bytes";
    default:
      return "String";
  }
}

function getRuntimeModels(): Array<[string, RuntimeModel]> {
  const runtimeDataModel = (
    prisma as unknown as {
      _runtimeDataModel?: {
        models?: Record<string, RuntimeModel> | Map<string, RuntimeModel>;
      };
    }
  )._runtimeDataModel;

  const modelsContainer = runtimeDataModel?.models;
  if (!modelsContainer) {
    throw new Error("No se pudo leer el runtimeDataModel de Prisma");
  }

  if (modelsContainer instanceof Map) {
    return Array.from(modelsContainer.entries());
  }

  return Object.entries(modelsContainer);
}

async function getTableColumnMeta(tableName: string): Promise<Map<string, ColumnMetaRow>> {
  const rows = await prisma.$queryRaw<ColumnMetaRow[]>`
    SELECT
      COLUMN_NAME AS name,
      DATA_TYPE AS dataType,
      IS_NULLABLE AS isNullable,
      COLUMN_KEY AS columnKey,
      EXTRA AS extra,
      CHARACTER_MAXIMUM_LENGTH AS maxLength,
      COLUMN_DEFAULT AS columnDefault
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${tableName}
    ORDER BY ORDINAL_POSITION
  `;

  return new Map(rows.map((row) => [row.name, row]));
}

function buildColumns(
  scalarFields: RuntimeField[],
  columnMeta: Map<string, ColumnMetaRow>
): AdminColumnDef[] {
  return scalarFields.map((field) => {
    const meta = columnMeta.get(field.name);
    // Prisma scalar type is the source of truth (e.g. MySQL boolean = tinyint(1)).
    const type = mapPrismaScalarTypeToAdminType(field.type);

    const isPrimary = meta ? meta.columnKey === "PRI" : field.name === "id";
    const isAutoIncrement = meta ? /auto_increment/i.test(meta.extra || "") : false;
    const isGenerated = meta ? /generated/i.test(meta.extra || "") : false;
    const maxLength =
      typeof meta?.maxLength === "bigint"
        ? Number(meta.maxLength)
        : meta?.maxLength ?? undefined;

    const required = meta
      ? meta.isNullable === "NO" && !isAutoIncrement && meta.columnDefault === null
      : !isPrimary;

    const editable = !isPrimary && !isAutoIncrement && !isGenerated && type !== "Bytes";

    return {
      name: field.name,
      type,
      required,
      editable,
      primary: isPrimary,
      maxLength,
      encrypted: field.name.endsWith("_encrypted"),
    };
  });
}

export async function getAdminTableDefinitions(): Promise<AdminTableDef[]> {
  const runtimeModels = getRuntimeModels();

  const definitions = await Promise.all(
    runtimeModels.map(async ([modelName, model]) => {
      const tableName = model.dbName || toDelegateName(modelName);
      const scalarFields = (model.fields || []).filter((field) => field.kind === "scalar");
      const columnMeta = await getTableColumnMeta(tableName);
      const columns = buildColumns(scalarFields, columnMeta);
      const primaryKey = columns.find((col) => col.primary)?.name ?? null;

      return {
        key: tableName,
        label: model.dbName ? tableNameToLabel(tableName) : modelNameToLabel(modelName),
        model: toDelegateName(modelName),
        columns,
        primaryKey,
      } satisfies AdminTableDef;
    })
  );

  return definitions.sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
}

export async function getAdminTableDefinition(tableName: string): Promise<AdminTableDef | null> {
  const all = await getAdminTableDefinitions();
  return all.find((def) => def.key === tableName) ?? null;
}

export function coerceValueByType(type: string, value: unknown): unknown {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  switch (type) {
    case "Int": {
      const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
      return Number.isInteger(parsed) ? parsed : INVALID_COERCION;
    }
    case "Float": {
      const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
      return Number.isFinite(parsed) ? parsed : INVALID_COERCION;
    }
    case "Boolean": {
      if (typeof value === "boolean") return value;
      if (typeof value === "number") {
        if (value === 1) return true;
        if (value === 0) return false;
        return INVALID_COERCION;
      }
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "si", "sí", "yes", "on"].includes(normalized)) return true;
        if (["false", "0", "no", "off"].includes(normalized)) return false;
      }
      return INVALID_COERCION;
    }
    case "DateTime": {
      const parsed = value instanceof Date ? value : new Date(String(value));
      return Number.isNaN(parsed.getTime()) ? INVALID_COERCION : parsed;
    }
    case "String":
    default:
      return String(value);
  }
}
