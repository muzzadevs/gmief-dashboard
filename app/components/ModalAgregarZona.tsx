"use client";

import React, { useState } from "react";
import Toast, { useToast } from "./Toast";

interface ModalAgregarZonaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalAgregarZona({
  isOpen,
  onClose,
  onSuccess,
}: ModalAgregarZonaProps) {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setNombre("");
    setCodigo("");
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones del nombre
    if (!nombre.trim()) {
      showError("El nombre es requerido");
      return;
    }

    // Validaciones del código
    const normalizedCodigo = codigo.trim().toUpperCase();

    if (!normalizedCodigo) {
      showError("El código es requerido");
      return;
    }

    if (normalizedCodigo.length > 3) {
      showError("El código debe tener máximo 3 caracteres");
      return;
    }

    if (!/^[A-Z0-9]+$/.test(normalizedCodigo)) {
      showError("El código solo puede contener letras y números");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/zonas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          codigo: normalizedCodigo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "DUPLICATE_CODE") {
          showError("Ya existe una zona con ese código");
        } else if (data.error === "INVALID_CODE_LENGTH") {
          showError(data.message || "Longitud de código inválida");
        } else if (data.error === "INVALID_CODE_FORMAT") {
          showError(data.message || "Formato de código inválido");
        } else {
          throw new Error(data.message || "Error al crear zona");
        }
        return;
      }

      showSuccess("Zona creada exitosamente");
      setTimeout(() => {
        resetForm();
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error creating zona:", error);
      showError(
        error instanceof Error ? error.message : "No se pudo crear la zona"
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
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-black">
              Agregar Nueva Zona
            </h2>
            <button
              onClick={handleClose}
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="nombre"
                className="font-medium text-black text-sm"
              >
                Nombre de la Zona *
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm text-black"
                placeholder="Ej: Zona Norte"
                required
                disabled={loading}
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="codigo"
                className="font-medium text-black text-sm"
              >
                Código de la Zona *
              </label>
              <input
                id="codigo"
                type="text"
                value={codigo}
                onChange={(e) => {
                  const value = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "");
                  if (value.length <= 3) {
                    setCodigo(value);
                  }
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm text-black"
                placeholder="Ej: ZN1"
                required
                disabled={loading}
                maxLength={3}
              />
              <p className="text-xs text-gray-500">
                Código único para identificar la zona (máx. 3 caracteres, solo
                letras y números)
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !nombre.trim() || !codigo.trim()}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando..." : "Crear Zona"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
