"use client";

import React, { useEffect, useState } from "react";
import Toast, { useToast } from "./Toast";
import ModalConfirmarEliminar from "./ModalConfirmarEliminar";

type Zona = { id: number; nombre: string; codigo: string };

interface ModalEditarZonasProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEditarZonas({
  isOpen,
  onClose,
  onSuccess,
}: ModalEditarZonasProps) {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    zona: Zona | null;
  }>({ open: false, zona: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchZonas();
    }
  }, [isOpen]);

  const fetchZonas = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/zonas");
      if (res.ok) {
        const response = await res.json();
        if (response.ok && response.data) {
          setZonas(response.data);
        } else {
          throw new Error("Error al obtener las zonas");
        }
      } else {
        throw new Error("Error al cargar las zonas");
      }
    } catch (error) {
      console.error("Error fetching zonas:", error);
      showError("Error al cargar las zonas");
    } finally {
      setLoadingData(false);
    }
  };

  const handleZonaChange = (
    id: number,
    field: "nombre" | "codigo",
    value: string
  ) => {
    if (field === "codigo") {
      const filteredValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (filteredValue.length <= 3) {
        setZonas((prev) =>
          prev.map((zona) =>
            zona.id === id ? { ...zona, [field]: filteredValue } : zona
          )
        );
      }
    } else {
      setZonas((prev) =>
        prev.map((zona) =>
          zona.id === id ? { ...zona, [field]: value } : zona
        )
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.zona) return;

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/zonas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteModal.zona.id }),
      });

      if (!res.ok) {
        throw new Error("No se pudo eliminar la zona");
      }

      showSuccess("Zona eliminada exitosamente");
      setDeleteModal({ open: false, zona: null });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error deleting zona:", error);
      showError("No se pudo eliminar la zona");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const invalid = zonas.some(
      (zona) => !zona.nombre.trim() || !zona.codigo.trim()
    );
    if (invalid) {
      showError("Todas las zonas deben tener nombre y código");
      return;
    }

    for (const zona of zonas) {
      const codigo = zona.codigo.trim();
      if (codigo.length > 3) {
        showError("Todos los códigos deben tener máximo 3 caracteres");
        return;
      }
      if (!/^[A-Z0-9]+$/.test(codigo)) {
        showError("Los códigos solo pueden contener letras y números");
        return;
      }
    }

    const codigos = zonas.map((z) => z.codigo.trim());
    const codigosDuplicados = codigos.filter(
      (codigo, index) => codigos.indexOf(codigo) !== index
    );
    if (codigosDuplicados.length > 0) {
      showError("Los códigos de zona deben ser únicos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/zonas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zonas }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error === "DUPLICATE_CODE") {
          showError(errorData.message || "Código duplicado encontrado");
        } else if (errorData.error === "INVALID_CODE_LENGTH") {
          showError(errorData.message || "Longitud de código inválida");
        } else if (errorData.error === "INVALID_CODE_FORMAT") {
          showError(errorData.message || "Formato de código inválido");
        } else if (errorData.error === "DUPLICATE_CODE_IN_BATCH") {
          showError(errorData.message || "Códigos duplicados en la solicitud");
        } else {
          throw new Error(
            errorData.message || "No se pudieron actualizar las zonas"
          );
        }
        return;
      }

      showSuccess("Zonas actualizadas exitosamente");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating zonas:", error);
      showError(
        error instanceof Error
          ? error.message
          : "No se pudieron actualizar las zonas"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
            <h2 className="text-xl font-bold text-slate-800">Editar Zonas</h2>
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
                <div className="text-slate-500">Cargando zonas...</div>
              </div>
            ) : zonas.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">No hay zonas para editar</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {zonas.map((zona) => (
                  <div
                    key={zona.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 p-4 bg-slate-50 rounded-xl items-end"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="font-medium text-slate-700 text-sm">
                        Nombre de la Zona
                      </label>
                      <input
                        type="text"
                        value={zona.nombre}
                        onChange={(e) =>
                          handleZonaChange(zona.id, "nombre", e.target.value)
                        }
                        className="input-glass w-full"
                        placeholder="Nombre de la zona"
                        required
                        maxLength={100}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-medium text-slate-700 text-sm">
                        Código de la Zona
                      </label>
                      <input
                        type="text"
                        value={zona.codigo}
                        onChange={(e) =>
                          handleZonaChange(zona.id, "codigo", e.target.value)
                        }
                        className="input-glass w-full"
                        placeholder="Código único (máx. 3)"
                        required
                        maxLength={3}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteModal({ open: true, zona })}
                      className="btn-primary bg-red-600 text-white hover:bg-red-700 shadow-md text-sm h-[42px]"
                      title={`Eliminar zona ${zona.nombre}`}
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
              disabled={loading || loadingData || zonas.length === 0}
              className="btn-primary bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            >
              {loading ? "Actualizando..." : "Actualizar Zonas"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal confirmar eliminar zona */}
      <ModalConfirmarEliminar
        isOpen={deleteModal.open}
        titulo={`¿Eliminar la zona "${deleteModal.zona?.nombre}"?`}
        mensaje="Se eliminarán también todas las subzonas, iglesias y ministerios/candidatos asociados a esta zona. Esta acción no se puede deshacer fácilmente."
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, zona: null })}
      />
    </>
  );
}
