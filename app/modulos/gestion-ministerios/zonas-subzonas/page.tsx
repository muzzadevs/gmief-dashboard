"use client";

import Iglesias from "../../../components/Iglesias";
import { useState } from "react";
import SelectMenuSubzonas from "../../../components/SelectMenuSubzonas";
import SelectMenuZonas from "../../../components/SelectMenuZonas";
import ModalEditarSubzonas from "../../../components/ModalEditarSubzonas";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";

export default function ZonasSubZonas() {
  const router = useRouter();
  const setZonaSelected = useZonasStore((s) => s.setZonaSelected);
  const [busqueda, setBusqueda] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen max-h-screen flex flex-col">
      {/* Menú superior */}
      <div className="w-full flex justify-center z-[1000] mb-4 sm:sticky sm:top-0 px-2 sm:px-0">
        <div className="mt-3 sm:mt-4 w-full sm:w-[95%] glass-card-solid px-4 sm:px-6 py-4">
          {/* Primera fila: Botón volver + Input búsqueda */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-3">
            <button
              type="button"
              className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20 sm:w-auto"
              onClick={() => {
                setZonaSelected(null);
                router.push("/modulos/gestion-ministerios");
              }}
              aria-label="Volver"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Volver
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar iglesias..."
                className="input-glass w-full"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Segunda fila: Selects de zonas y subzonas */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-3">
            <div className="flex-1">
              <SelectMenuZonas />
            </div>
            <div className="flex-1">
              <SelectMenuSubzonas />
            </div>
          </div>

          {/* Tercera fila: Botones de acción */}
          <div className="flex flex-col lg:flex-row items-stretch gap-2">
            <button
              type="button"
              className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex-1 text-xs sm:text-sm"
              onClick={() => router.push("/modulos/gestion-ministerios/agregar-iglesia")}
              aria-label="Agregar Iglesia"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Agregar </span>Iglesia
            </button>
            <button
              type="button"
              className="btn-primary bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex-1 text-xs sm:text-sm"
              onClick={() => router.push("/modulos/gestion-ministerios/agregar-subzonas")}
              aria-label="Agregar Subzona"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Agregar </span>Subzonas
            </button>
            <button
              type="button"
              className="btn-primary bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 flex-1 text-xs sm:text-sm"
              onClick={() => setIsModalOpen(true)}
              aria-label="Editar Subzonas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              <span className="hidden sm:inline">Editar </span>Subzonas
            </button>
          </div>
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-6 flex flex-col items-center">
        <Iglesias busqueda={busqueda} />
      </div>

      {/* Modal Editar Subzonas */}
      <ModalEditarSubzonas
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </main>
  );
}
