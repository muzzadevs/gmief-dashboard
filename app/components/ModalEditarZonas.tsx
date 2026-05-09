"use client";

import React, { useEffect, useState } from "react";
import Toast, { useToast } from "./Toast";

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
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl"
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
    </>
  );
}
