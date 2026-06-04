"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/store/adminStore";
import Toast, { useToast } from "../components/Toast";

// Types
interface ColumnDef {
  name: string;
  type: string;
  required: boolean;
  editable: boolean;
  primary?: boolean;
  maxLength?: number;
  encrypted?: boolean;
}

interface TableInfo {
  key: string;
  label: string;
  model: string;
  columnCount: number;
}

interface TableData {
  table: string;
  label: string;
  columns: ColumnDef[];
  records: Record<string, unknown>[];
  totalRecords: number;
}

// Row editing state
interface EditingRow {
  id: number;
  data: Record<string, unknown>;
  original: Record<string, unknown>;
}

export default function AdminPage() {
  const router = useRouter();
  const { checkSession, lock, getToken } = useAdminStore();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [authorized, setAuthorized] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const tableRef = useRef<HTMLDivElement>(null);

  // Check authorization on mount
  useEffect(() => {
    const isUnlocked = checkSession();
    if (!isUnlocked) {
      router.replace("/dashboard");
      return;
    }
    setAuthorized(true);
  }, [checkSession, router]);

  // Fetch tables list
  useEffect(() => {
    if (!authorized) return;
    const fetchTables = async () => {
      try {
        setLoadingTables(true);
        const res = await fetch("/api/admin/tables", {
          headers: { "X-Admin-Token": getToken() },
        });
        const json = await res.json();
        if (json.ok) {
          setTables(json.data);
        }
      } catch (err) {
        console.error("Error fetching tables:", err);
        showError("Error al cargar las tablas");
      } finally {
        setLoadingTables(false);
      }
    };
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  // Fetch table data
  const fetchTableData = useCallback(
    async (tableName: string) => {
      if (!tableName) {
        setTableData(null);
        return;
      }
      try {
        setLoading(true);
        setEditingRow(null);
        setSearchTerm("");
        const token = getToken();
        const res = await fetch(`/api/admin/table/${tableName}`, {
          headers: { "X-Admin-Token": token },
        });
        const json = await res.json();
        if (json.ok) {
          setTableData(json.data);
        } else {
          showError(json.message || "Error al cargar datos");
        }
      } catch (err) {
        console.error("Error fetching table data:", err);
        showError("Error al cargar datos de la tabla");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Fetch table data when selection changes
  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    } else {
      setTableData(null);
    }
  }, [selectedTable, fetchTableData]);

  // Handle logout
  const handleLogout = useCallback(() => {
    lock();
    router.replace("/dashboard");
  }, [lock, router]);

  // Start editing a row
  const startEditing = useCallback(
    (record: Record<string, unknown>) => {
      const id = record.id as number;
      setEditingRow({
        id,
        data: { ...record },
        original: { ...record },
      });
    },
    []
  );

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingRow(null);
  }, []);

  // Update field value
  const updateField = useCallback(
    (fieldName: string, value: unknown) => {
      setEditingRow((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          data: { ...prev.data, [fieldName]: value },
        };
      });
    },
    []
  );

  // Save row
  const saveRow = useCallback(async () => {
    if (!editingRow || !tableData) return;

    // Build only changed fields
    const changedData: Record<string, unknown> = {};
    for (const col of tableData.columns) {
      if (!col.editable) continue;
      const newVal = editingRow.data[col.name];
      const origVal = editingRow.original[col.name];
      if (newVal !== origVal) {
        changedData[col.name] = newVal;
      }
    }

    if (Object.keys(changedData).length === 0) {
      setEditingRow(null);
      return;
    }

    try {
      setSavingId(editingRow.id);
      const res = await fetch(`/api/admin/table/${tableData.table}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": getToken(),
        },
        body: JSON.stringify({
          id: editingRow.id,
          data: changedData,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        showSuccess(json.message || "Registro actualizado");
        setEditingRow(null);
        // Refresh data
        await fetchTableData(tableData.table);
      } else {
        showError(json.message || "Error al guardar");
      }
    } catch (err) {
      console.error("Error saving:", err);
      showError("Error al guardar el registro");
    } finally {
      setSavingId(null);
    }
  }, [editingRow, tableData, getToken, showSuccess, showError, fetchTableData]);

  // Filter records
  const filteredRecords = tableData?.records.filter((record) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(record).some((val) =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(term)
    );
  });

  // Render field input based on type
  const renderFieldInput = (col: ColumnDef, value: unknown, onChange: (val: unknown) => void) => {
    const baseClass =
      "w-full bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-slate-400 focus:ring-1 focus:ring-slate-400/30 disabled:opacity-40";

    if (!col.editable) {
      return (
        <span className="text-slate-500 text-sm font-mono">
          {value === null || value === undefined ? "—" : String(value)}
        </span>
      );
    }

    if (col.type === "Bytes") {
      return (
        <span className="text-slate-500 text-xs italic">
          {value === "[BLOB_DATA]" ? "📎 Tiene datos" : "Sin datos"}
        </span>
      );
    }

    switch (col.type) {
      case "Boolean":
        return (
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              value ? "bg-emerald-500" : "bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        );

      case "Int":
        return (
          <input
            type="number"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : parseInt(e.target.value, 10))
            }
            className={baseClass}
            step="1"
          />
        );

      case "Float":
        return (
          <input
            type="number"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : parseFloat(e.target.value))
            }
            className={baseClass}
            step="any"
          />
        );

      case "DateTime":
        return (
          <input
            type="date"
            value={value === null || value === undefined ? "" : String(value).split("T")[0]}
            onChange={(e) => onChange(e.target.value || null)}
            className={baseClass}
          />
        );

      case "String":
      default:
        return (
          <input
            type="text"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
            maxLength={col.maxLength}
            placeholder={col.required ? "Requerido" : "Opcional"}
          />
        );
    }
  };

  // Render cell display value
  const renderCellValue = (col: ColumnDef, value: unknown) => {
    if (value === null || value === undefined) {
      return <span className="text-slate-600 text-sm">—</span>;
    }

    if (col.type === "Boolean") {
      return (
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            value
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {value ? "✓ Sí" : "✗ No"}
        </span>
      );
    }

    if (col.type === "Bytes") {
      return (
        <span className="text-slate-500 text-xs italic">
          {value === "[BLOB_DATA]" ? "📎 Blob" : "—"}
        </span>
      );
    }

    if (col.type === "DateTime") {
      return (
        <span className="text-slate-300 text-sm font-mono">
          {String(value).split("T")[0]}
        </span>
      );
    }

    if (col.encrypted) {
      return (
        <span className="text-amber-400/80 text-sm" title="Campo encriptado">
          🔐 {String(value)}
        </span>
      );
    }

    const strVal = String(value);
    return (
      <span className="text-slate-300 text-sm" title={strVal.length > 30 ? strVal : undefined}>
        {strVal.length > 40 ? strVal.slice(0, 40) + "…" : strVal}
      </span>
    );
  };

  // Loading/unauthorized state
  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-slate-700/40" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Vault icon */}
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-slate-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-200 tracking-tight leading-tight">
                Modo Administrador
              </h1>
              <p className="text-[11px] text-slate-500">
                Panel de edición avanzada — Base de datos
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700/50 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            Salir
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Table Selector */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 max-w-xs">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Tabla de la base de datos
              </label>
              {loadingTables ? (
                <div className="h-11 bg-slate-800/60 rounded-xl animate-pulse" />
              ) : (
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25rem 1.25rem",
                  }}
                >
                  <option value="">Seleccionar tabla...</option>
                  {tables.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label} ({t.columnCount} columnas)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Search */}
            {tableData && (
              <div className="flex-1 max-w-xs">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Buscar en registros
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
                    placeholder="Buscar..."
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Stats */}
            {tableData && (
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2">
                  {tableData.totalRecords} registros
                </span>
                {filteredRecords && filteredRecords.length !== tableData.totalRecords && (
                  <span className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2">
                    {filteredRecords.length} filtrados
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {!selectedTable && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
                className="w-8 h-8 text-slate-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>
            </div>
            <p className="text-slate-400 font-medium mb-1">
              Selecciona una tabla para empezar
            </p>
            <p className="text-slate-600 text-sm">
              Podrás ver y editar todos los registros de la base de datos
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative w-10 h-10 mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-slate-700/40" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-400 animate-spin" />
            </div>
            <span className="text-slate-500 text-sm">Cargando datos...</span>
          </div>
        )}

        {/* Data Table */}
        {tableData && !loading && (
          <div ref={tableRef} className="animate-fadein">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  {/* Header */}
                  <thead>
                    <tr className="border-b border-slate-800/50">
                      <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap sticky left-0 bg-slate-900/90 backdrop-blur-sm z-10">
                        Acciones
                      </th>
                      {tableData.columns.map((col) => (
                        <th
                          key={col.name}
                          className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5">
                            {col.name}
                            {col.primary && (
                              <span className="text-amber-500/70 text-[9px]">PK</span>
                            )}
                            {col.required && !col.primary && (
                              <span className="text-red-400/60 text-[9px]">*</span>
                            )}
                            {col.encrypted && (
                              <span className="text-amber-400/60 text-[9px]">🔐</span>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-600 font-normal mt-0.5 normal-case">
                            {col.type}
                            {col.maxLength ? ` (${col.maxLength})` : ""}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {filteredRecords && filteredRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={tableData.columns.length + 1}
                          className="px-4 py-12 text-center text-slate-600 text-sm"
                        >
                          {searchTerm ? "No se encontraron registros" : "No hay registros en esta tabla"}
                        </td>
                      </tr>
                    ) : (
                      filteredRecords?.map((record) => {
                        const id = record.id as number;
                        const isEditing = editingRow?.id === id;
                        const isSaving = savingId === id;

                        return (
                          <tr
                            key={id}
                            className={`border-b border-slate-800/30 transition-colors ${
                              isEditing
                                ? "bg-slate-800/40"
                                : "hover:bg-slate-800/20"
                            }`}
                          >
                            {/* Actions */}
                            <td className="px-4 py-2.5 sticky left-0 bg-slate-900/90 backdrop-blur-sm z-10">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={saveRow}
                                    disabled={isSaving}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-40"
                                    title="Guardar"
                                  >
                                    {isSaving ? (
                                      <svg
                                        className="animate-spin w-3.5 h-3.5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        />
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                      </svg>
                                    ) : (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className="w-3.5 h-3.5"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M4.5 12.75l6 6 9-13.5"
                                        />
                                      </svg>
                                    )}
                                    Guardar
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    disabled={isSaving}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/40 text-slate-400 text-xs font-medium hover:bg-slate-700/60 transition-all disabled:opacity-40"
                                    title="Cancelar"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2}
                                      stroke="currentColor"
                                      className="w-3.5 h-3.5"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditing(record)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 hover:text-slate-300 transition-all"
                                  title="Editar"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-3.5 h-3.5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                                    />
                                  </svg>
                                  Editar
                                </button>
                              )}
                            </td>

                            {/* Data cells */}
                            {tableData.columns.map((col) => (
                              <td
                                key={col.name}
                                className="px-4 py-2.5 whitespace-nowrap"
                              >
                                {isEditing && col.editable
                                  ? renderFieldInput(
                                      col,
                                      editingRow.data[col.name],
                                      (val) => updateField(col.name, val)
                                    )
                                  : renderCellValue(col, record[col.name])}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer info */}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-600 px-1">
              <span>
                Tabla: <span className="text-slate-400 font-mono">{tableData.table}</span>
              </span>
              <span>
                {tableData.columns.length} columnas · {tableData.totalRecords} registros
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="text-[10px] text-slate-700 flex items-center gap-1">
          <kbd className="bg-slate-800/60 border border-slate-700/40 rounded px-1.5 py-0.5 font-mono">
            Esc
          </kbd>
          <span>Cancelar edición</span>
        </div>
      </div>
    </main>
  );
}
