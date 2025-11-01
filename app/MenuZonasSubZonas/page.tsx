"use client";

import Iglesias from "../components/Iglesias";
import { useState } from "react";
import SelectMenuSubzonas from "../components/SelectMenuSubzonas";
import SelectMenuZonas from "../components/SelectMenuZonas";
import ModalEditarSubzonas from "../components/ModalEditarSubzonas";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";

export default function MenuZonasSubZonas() {
  const router = useRouter();
  const setZonaSelected = useZonasStore((s) => s.setZonaSelected);
  const [busqueda, setBusqueda] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Pasar el valor de búsqueda a Iglesias como prop
  return (
    <main className="min-h-screen max-h-screen flex flex-col font-sans bg-gradient-to-br from-blue-900 via-white to-blue-400">
      {/* Menú superior: sticky solo en PC, normal en móvil */}
      <div className="w-full flex justify-center z-[1000] mb-4 sm:sticky sm:top-0">
        <div className="mt-4 w-[95%] flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8 rounded-2xl border border-gray-200 bg-white/90 backdrop-blur px-6 py-2 shadow-sm ">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white font-semibold text-sm shadow hover:bg-gray-900 transition border border-black cursor-pointer"
            onClick={() => {
              setZonaSelected(null);
              router.push("/MenuZonas");
            }}
            aria-label="Volver"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Volver
          </button>
          {/* Input de búsqueda de iglesia */}
          <div className="flex flex-row items-center gap-2 w-full">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar"
              className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm text-black w-full"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-row items-center gap-2 w-full">
            <SelectMenuZonas />
          </div>
          <div className="flex flex-row items-center gap-2 w-full">
            <SelectMenuSubzonas />
          </div>
          {/* Botones Agregar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            {/* Botón Agregar Iglesia */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-green-600 text-white font-semibold text-xs sm:text-sm shadow hover:bg-green-700 transition border border-green-600 cursor-pointer flex-1 sm:flex-none sm:whitespace-nowrap"
              onClick={() => router.push("/MenuAgregarIglesia")}
              aria-label="Agregar Iglesia"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span className="hidden xs:inline">Agregar </span>Iglesia
            </button>
            {/* Botón Agregar Subzonas */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm shadow hover:bg-blue-700 transition border border-blue-600 cursor-pointer flex-1 sm:flex-none sm:whitespace-nowrap"
              onClick={() => router.push("/MenuAgregarSubzonas")}
              aria-label="Agregar Subzona"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span className="hidden xs:inline">Agregar </span>Subzonas
            </button>
            {/* Botón Editar Subzonas */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-white font-semibold text-xs sm:text-sm shadow transition border cursor-pointer flex-1 sm:flex-none sm:whitespace-nowrap"
              style={{ backgroundColor: "#e4a41a", borderColor: "#e4a41a" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#d19817")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#e4a41a")
              }
              onClick={() => setIsModalOpen(true)}
              aria-label="Editar Subzonas"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
              <span className="hidden xs:inline">Editar </span>Subzonas
            </button>
          </div>
        </div>
      </div>
      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-6 scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-[#0a1833] flex flex-col items-center">
        <Iglesias busqueda={busqueda} />
      </div>

      {/* Modal Editar Subzonas */}
      <ModalEditarSubzonas
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Opcional: refrescar datos si es necesario
          window.location.reload();
        }}
      />
    </main>
  );
}
