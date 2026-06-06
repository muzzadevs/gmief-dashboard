"use client";

import React, { useEffect, useState } from "react";
import Toast, { useToast } from "./Toast";
import Combobox from "./ui/Combobox";
import ModalConfirmarEliminar from "./ModalConfirmarEliminar";

type Zona = { id: number; nombre: string };
type Subzona = { id: number; nombre: string; zona_id: number; activo: boolean };

interface ModalEditarSubzonasProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEditarSubzonas({
  isOpen,
  onClose,
  onSuccess,
}: ModalEditarSubzonasProps) {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [subzonas, setSubzonas] = useState<Subzona[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    subzona: Subzona | null;
  }>({ open: false, subzona: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const zonasRes = await fetch("/api/zonas");
      if (zonasRes.ok) {
        const zonasResponse = await zonasRes.json();
        if (zonasResponse.ok && zonasResponse.data) {
          setZonas(zonasResponse.data);
        }
      }

      const subzonasRes = await fetch("/api/subzonas?zonaId=ALL");
      if (subzonasRes.ok) {
        const subzonasData = await subzonasRes.json();
        setSubzonas(subzonasData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showError("Error al cargar los datos");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubzonaChange = (
    id: number,
    field: "nombre" | "zona_id",
    value: string | number
  ) => {
    setSubzonas((prev) =>
      prev.map((subzona) =>
        subzona.id === id ? { ...subzona, [field]: value } : subzona
      )
    );
  };

  const handleDelete = async () => {
    if (!deleteModal.subzona) return;

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/subzonas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteModal.subzona.id }),
      });

      if (!res.ok) {
        throw new Error("No se pudo eliminar la subzona");
      }

      showSuccess("Subzona eliminada exitosamente");
      setDeleteModal({ open: false, subzona: null });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error deleting subzona:", error);
      showError("No se pudo eliminar la subzona");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const invalid = subzonas.some(
      (subzona) => !subzona.nombre.trim() || !subzona.zona_id
    );
    if (invalid) {
      showError("Todas las subzonas deben tener nombre y zona asignada");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subzonas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subzonas }),
      });

      if (!res.ok) {
        throw new Error("No se pudieron actualizar las subzonas");
      }

      showSuccess("Subzonas actualizadas exitosamente");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating subzonas:", error);
      showError("No se pudieron actualizar las subzonas");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const zonaOptions = zonas.map((zona) => ({
    value: String(zona.id),
    label: zona.nombre,
  }));

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="glass-card-solid w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadein">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Editar Subzonas</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Cargando datos...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {subzonas.filter((s) => s.activo).map((subzona) => (
                  <div
                    key={subzona.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 p-4 bg-slate-50 rounded-xl items-end"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="font-medium text-slate-700 text-sm">
                        Nombre de la Subzona
                      </label>
                      <input
                        type="text"
                        value={subzona.nombre}
                        onChange={(e) =>
                          handleSubzonaChange(
                            subzona.id,
                            "nombre",
                            e.target.value
                          )
                        }
                        className="input-glass w-full"
                        placeholder="Nombre de la subzona"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-medium text-slate-700 text-sm">
                        Zona
                      </label>
                      <Combobox
                        options={zonaOptions}
                        value={String(subzona.zona_id)}
                        onChange={(val) =>
                          handleSubzonaChange(
                            subzona.id,
                            "zona_id",
                            parseInt(val)
                          )
                        }
                        placeholder="Selecciona una zona"
                        searchPlaceholder="Buscar zona..."
                        emptyMessage="No se encontraron zonas."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteModal({ open: true, subzona })}
                      className="btn-primary bg-red-600 text-white hover:bg-red-700 shadow-md text-sm h-[42px]"
                      title={`Eliminar subzona ${subzona.nombre}`}
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      <span className="hidden md:inline">Eliminar</span>
                    </button>
                  </div>
                ))}
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-primary bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || loadingData}
              className="btn-primary bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            >
              {loading ? "Actualizando..." : "Actualizar Subzonas"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal confirmar eliminar subzona */}
      <ModalConfirmarEliminar
        isOpen={deleteModal.open}
        titulo={`¿Eliminar la subzona "${deleteModal.subzona?.nombre}"?`}
        mensaje="Se eliminarán también todas las iglesias y ministerios/candidatos asociados a esta subzona. Esta acción no se puede deshacer fácilmente."
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, subzona: null })}
      />
    </>
  );
}
