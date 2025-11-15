"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import SelectMenuZonas from "../components/SelectMenuZonas";
import ModalAgregarZona from "../components/ModalAgregarZona";
import ModalEditarZonas from "../components/ModalEditarZonas";

const SpainMap = dynamic(() => import("../components/SpainMap"), {
  ssr: false,
});

export default function MenuZonas() {
  const [isModalAgregarOpen, setIsModalAgregarOpen] = useState(false);
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);

  return (
    <div className="w-screen h-screen relative bg-gradient-to-br from-blue-900 via-white to-blue-400">
      <SpainMap />
      {/* Menú flotante centrado con el select de zonas y botones */}
      <div className="fixed top-0 left-0 w-full flex justify-center z-[1000]">
        <div className="mt-4 w-fit flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-gray-200 bg-white/90 backdrop-blur px-6 py-4 shadow-sm">
          <div className="flex flex-row items-center gap-2">
            <label
              htmlFor="zonas-select"
              className="text-xs font-semibold tracking-wide text-gray-800"
            >
              ZONAS
            </label>
            <SelectMenuZonas />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-row items-center gap-2">
            {/* Botón Agregar Zonas */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white font-semibold text-xs sm:text-sm shadow hover:bg-green-700 transition border border-green-600 cursor-pointer"
              onClick={() => setIsModalAgregarOpen(true)}
              aria-label="Agregar Zona"
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span className="hidden sm:inline">Agregar </span>Zonas
            </button>

            {/* Botón Editar Zonas */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white font-semibold text-xs sm:text-sm shadow transition border cursor-pointer"
              style={{ backgroundColor: "#e4a41a", borderColor: "#e4a41a" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#d19817")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#e4a41a")
              }
              onClick={() => setIsModalEditarOpen(true)}
              aria-label="Editar Zonas"
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
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
              <span className="hidden sm:inline">Editar </span>Zonas
            </button>
          </div>
        </div>
      </div>

      {/* Modal Agregar Zona */}
      <ModalAgregarZona
        isOpen={isModalAgregarOpen}
        onClose={() => setIsModalAgregarOpen(false)}
        onSuccess={() => {
          // Opcional: refrescar datos si es necesario
          window.location.reload();
        }}
      />

      {/* Modal Editar Zonas */}
      <ModalEditarZonas
        isOpen={isModalEditarOpen}
        onClose={() => setIsModalEditarOpen(false)}
        onSuccess={() => {
          // Opcional: refrescar datos si es necesario
          window.location.reload();
        }}
      />
    </div>
  );
}
