"use client";

import React from "react";

interface ModalConfirmarEliminarProps {
  isOpen: boolean;
  titulo: string;
  mensaje: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ModalConfirmarEliminar({
  isOpen,
  titulo,
  mensaje,
  loading,
  onConfirm,
  onCancel,
}: ModalConfirmarEliminarProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="glass-card-solid p-8 max-w-sm w-full flex flex-col gap-6 animate-fadein"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </div>
          <div className="text-lg font-semibold text-slate-800">{titulo}</div>
          <p className="text-sm text-slate-500 mt-2">{mensaje}</p>
        </div>
        <div className="flex gap-3 justify-center mt-2">
          <button
            className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-md disabled:opacity-50"
            disabled={loading}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="btn-primary bg-red-600 text-white hover:bg-red-700 shadow-md disabled:opacity-50"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
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
                Eliminando...
              </span>
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
