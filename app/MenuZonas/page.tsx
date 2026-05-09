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
    <div className="w-screen h-screen h-dvh relative">
      <SpainMap />
      {/* Menú flotante centrado */}
      <div className="fixed top-0 left-0 w-full flex justify-center z-[1000] px-3">
        <div className="mt-3 sm:mt-4 w-full max-w-2xl flex flex-col sm:flex-row items-center gap-3 glass-card-solid px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
            <label
              htmlFor="zonas-select"
              className="text-xs font-semibold tracking-wider text-slate-600 uppercase whitespace-nowrap"
            >
              Zonas
            </label>
            <SelectMenuZonas />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
            {/* Botón Agregar Zonas */}
            <button
              type="button"
              className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex-1 sm:flex-initial text-xs sm:text-sm"
              onClick={() => setIsModalAgregarOpen(true)}
              aria-label="Agregar Zona"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Agregar </span>Zonas
            </button>

            {/* Botón Editar Zonas */}
            <button
              type="button"
              className="btn-primary bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 flex-1 sm:flex-initial text-xs sm:text-sm"
              onClick={() => setIsModalEditarOpen(true)}
              aria-label="Editar Zonas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
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
          window.location.reload();
        }}
      />

      {/* Modal Editar Zonas */}
      <ModalEditarZonas
        isOpen={isModalEditarOpen}
        onClose={() => setIsModalEditarOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
