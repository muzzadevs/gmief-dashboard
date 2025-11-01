"use client";

import React, { useEffect, useState } from "react";
import Toast, { useToast } from "./Toast";

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
      // Fetch zonas
      const zonasRes = await fetch("/api/zonas");
      if (zonasRes.ok) {
        const zonasResponse = await zonasRes.json();
        if (zonasResponse.ok && zonasResponse.data) {
          setZonas(zonasResponse.data);
        }
      }

      // Fetch todas las subzonas
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

    // Validar que todas las subzonas tengan nombre y zona
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

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-black">Editar Subzonas</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-600">Cargando datos...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {subzonas.map((subzona) => (
                  <div
                    key={subzona.id}
                    className="grid grid-cols-1 gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-black text-sm">
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
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm text-sm text-black"
                        placeholder="Nombre de la subzona"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-black text-sm">
                        Zona
                      </label>
                      <select
                        value={subzona.zona_id}
                        onChange={(e) =>
                          handleSubzonaChange(
                            subzona.id,
                            "zona_id",
                            parseInt(e.target.value)
                          )
                        }
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm text-sm text-black"
                        required
                      >
                        <option value="">Selecciona una zona</option>
                        {zonas.map((zona) => (
                          <option key={zona.id} value={zona.id}>
                            {zona.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || loadingData}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Actualizando..." : "Actualizar Subzonas"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
