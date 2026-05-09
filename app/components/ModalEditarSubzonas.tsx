"use client";

import React, { useEffect, useState } from "react";
import Toast, { useToast } from "./Toast";
import Combobox from "./ui/Combobox";

type Zona = { id: number; nombre: string };
type Subzona = { id: number; nombre: string; zona_id: number };

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
                {subzonas.map((subzona) => (
                  <div
                    key={subzona.id}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl"
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
    </>
  );
}
