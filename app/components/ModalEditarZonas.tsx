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
      // Filtrar solo caracteres alfanuméricos y convertir a mayúsculas
      const filteredValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      // Limitar a 3 caracteres
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

    // Validar que todas las zonas tengan nombre y código
    const invalid = zonas.some(
      (zona) => !zona.nombre.trim() || !zona.codigo.trim()
    );
    if (invalid) {
      showError("Todas las zonas deben tener nombre y código");
      return;
    }

    // Validar longitud y formato de códigos
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

    // Validar códigos únicos
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-black">Editar Zonas</h2>
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
                <div className="text-gray-600">Cargando zonas...</div>
              </div>
            ) : zonas.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-600">No hay zonas para editar</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {zonas.map((zona) => (
                  <div
                    key={zona.id}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-black text-sm">
                        Nombre de la Zona
                      </label>
                      <input
                        type="text"
                        value={zona.nombre}
                        onChange={(e) =>
                          handleZonaChange(zona.id, "nombre", e.target.value)
                        }
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm text-sm text-black"
                        placeholder="Nombre de la zona"
                        required
                        maxLength={100}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-black text-sm">
                        Código de la Zona
                      </label>
                      <input
                        type="text"
                        value={zona.codigo}
                        onChange={(e) =>
                          handleZonaChange(zona.id, "codigo", e.target.value)
                        }
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm text-sm text-black"
                        placeholder="Código único (máx. 3 caracteres)"
                        required
                        maxLength={3}
                      />
                      <p className="text-xs text-gray-500">
                        Máximo 3 caracteres, solo letras y números
                      </p>
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
              disabled={loading || loadingData || zonas.length === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Actualizando..." : "Actualizar Zonas"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
