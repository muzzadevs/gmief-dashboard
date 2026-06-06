"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/store/adminStore";
import Toast, { useToast } from "../components/Toast";
import Combobox from "../components/ui/Combobox";

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
  primaryKey: string | null;
  columns: ColumnDef[];
  records: Record<string, unknown>[];
  totalRecords: number;
}

// Row editing state
interface EditingRow {
  id: string | number;
  idField: string;
  data: Record<string, unknown>;
  original: Record<string, unknown>;
}

export default function AdminPage() {
  const router = useRouter();
  const { checkSession, lock, getToken, popReturnPath } = useAdminStore();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [authorized, setAuthorized] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState<Record<string, unknown>>({});
  const [creating, setCreating] = useState(false);

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | number; idField: string; show: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    const returnPath = popReturnPath();
    lock();
    router.replace(returnPath || "/dashboard");
  }, [lock, popReturnPath, router]);

  // Start editing a row
  const startEditing = useCallback(
    (record: Record<string, unknown>) => {
      if (!tableData?.primaryKey) return;
      const id = record[tableData.primaryKey];
      if (typeof id !== "string" && typeof id !== "number") return;

      setEditingRow({
        id,
        idField: tableData.primaryKey,
        data: { ...record },
        original: { ...record },
      });
    },
    [tableData]
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
          idField: editingRow.idField,
          data: changedData,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        showSuccess(json.message || "Registro actualizado");
        setEditingRow(null);
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

  // ── CREATE ──
  const openCreateModal = useCallback(() => {
    if (!tableData) return;
    // Pre-fill defaults
    const defaults: Record<string, unknown> = {};
    for (const col of tableData.columns) {
      if (col.primary) continue;
      if (col.type === "Boolean") {
        defaults[col.name] = true;
      } else {
        defaults[col.name] = null;
      }
    }
    setCreateData(defaults);
    setShowCreateModal(true);
  }, [tableData]);

  const updateCreateField = useCallback((fieldName: string, value: unknown) => {
    setCreateData((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const submitCreate = useCallback(async () => {
    if (!tableData) return;

    try {
      setCreating(true);
      const res = await fetch(`/api/admin/table/${tableData.table}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": getToken(),
        },
        body: JSON.stringify({ data: createData }),
      });

      const json = await res.json();
      if (json.ok) {
        showSuccess(json.message || "Registro creado");
        setShowCreateModal(false);
        setCreateData({});
        await fetchTableData(tableData.table);
      } else {
        showError(json.message || "Error al crear");
      }
    } catch (err) {
      console.error("Error creating:", err);
      showError("Error al crear el registro");
    } finally {
      setCreating(false);
    }
  }, [tableData, createData, getToken, showSuccess, showError, fetchTableData]);

  // ── DELETE ──
  const confirmDelete = useCallback((id: string | number) => {
    if (!tableData?.primaryKey) return;
    setDeleteConfirm({ id, idField: tableData.primaryKey, show: true });
  }, [tableData]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  const executeDelete = useCallback(async () => {
    if (!deleteConfirm || !tableData) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/table/${tableData.table}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": getToken(),
        },
        body: JSON.stringify({ id: deleteConfirm.id, idField: deleteConfirm.idField }),
      });

      const json = await res.json();
      if (json.ok) {
        showSuccess(json.message || "Registro eliminado");
        setDeleteConfirm(null);
        await fetchTableData(tableData.table);
      } else {
        showError(json.message || "Error al eliminar");
      }
    } catch (err) {
      console.error("Error deleting:", err);
      showError("Error al eliminar el registro");
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, tableData, getToken, showSuccess, showError, fetchTableData]);

  // Filter records
  const filteredRecords = tableData?.records.filter((record) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(record).some((val) =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(term)
    );
  });

  // Render field input based on type
  const renderFieldInput = (col: ColumnDef, value: unknown, onChange: (val: unknown) => void, isCreate = false) => {
    const baseClass =
      "w-full bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-slate-400 focus:ring-1 focus:ring-slate-400/30 disabled:opacity-40";

    if (!isCreate && !col.editable) {
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

      {/* Delete confirmation modal */}
      {deleteConfirm?.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={cancelDelete} />
          <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 p-6 max-w-sm w-full mx-4 animate-fadein">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-1">
                Eliminar permanentemente
              </h3>
              <p className="text-sm text-slate-400 mb-1">
                ¿Estás seguro de que quieres eliminar el registro <span className="font-mono text-red-400">{String(deleteConfirm.id)}</span>?
              </p>
              <p className="text-xs text-red-400/70 mb-5">
                ⚠ Esta acción es irreversible. El registro se borrará de la base de datos.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700/50 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-all disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && tableData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !creating && setShowCreateModal(false)} />
          <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 max-w-lg w-full mx-4 animate-fadein max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-200">
                  Crear registro
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {tableData.label}
                </p>
              </div>
              <button
                onClick={() => !creating && setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
              {tableData.columns
                .filter((col) => !col.primary && col.type !== "Bytes")
                .map((col) => (
                  <div key={col.name}>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      {col.name}
                      {col.required && <span className="text-red-400 ml-1">*</span>}
                      <span className="text-slate-600 font-normal ml-1.5 normal-case">
                        {col.type}{col.maxLength ? ` (${col.maxLength})` : ""}
                      </span>
                    </label>
                    {renderFieldInput(col, createData[col.name], (val) => updateCreateField(col.name, val), true)}
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800/50 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => !creating && setShowCreateModal(false)}
                disabled={creating}
                className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700/50 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-all disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={submitCreate}
                disabled={creating}
                className="px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {creating ? (
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
                Crear registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
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
                <Combobox
                  value={selectedTable}
                  onChange={setSelectedTable}
                  theme="dark"
                  placeholder="Seleccionar tabla..."
                  searchPlaceholder="Buscar tabla..."
                  emptyMessage="No hay tablas que coincidan."
                  aria-label="Seleccionar tabla de la base de datos"
                  options={tables.map((t) => ({
                    value: t.key,
                    label: `${t.label} (${t.columnCount} columnas)`,
                  }))}
                  className="bg-slate-800/80 border-slate-700/60 text-slate-200 hover:border-slate-600 focus:border-slate-500 focus:shadow-[0_0_0_3px_rgba(100,116,139,0.2)]"
                />
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
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Create button + Stats */}
            {tableData && (
              <div className="flex items-center gap-3">
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Crear
                </button>
                <span className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2 text-xs text-slate-500">
                  {tableData.totalRecords} registros
                </span>
                {filteredRecords && filteredRecords.length !== tableData.totalRecords && (
                  <span className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2 text-xs text-slate-500">
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-slate-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium mb-1">
              Selecciona una tabla para empezar
            </p>
            <p className="text-slate-600 text-sm">
              Podrás ver, crear, editar y eliminar registros de la base de datos
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
                      filteredRecords?.map((record, index) => {
                        const idValue =
                          tableData.primaryKey &&
                          (typeof record[tableData.primaryKey] === "string" ||
                            typeof record[tableData.primaryKey] === "number")
                            ? (record[tableData.primaryKey] as string | number)
                            : null;
                        const rowKey = idValue ?? `${tableData.table}-${index}`;
                        const isEditing = idValue !== null && editingRow?.id === idValue;
                        const isSaving = idValue !== null && savingId === idValue;

                        return (
                          <tr
                            key={rowKey}
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
                                      <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
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
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => startEditing(record)}
                                    disabled={idValue === null}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 hover:text-slate-300 transition-all"
                                    title="Editar"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => idValue !== null && confirmDelete(idValue)}
                                    disabled={idValue === null}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400/70 text-xs font-medium hover:bg-red-500/20 hover:text-red-400 transition-all"
                                    title="Eliminar permanentemente"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                </div>
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
