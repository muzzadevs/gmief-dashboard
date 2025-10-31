"use client";

import Iglesias from "../components/Iglesias";
import { useState } from "react";
import SelectMenuSubzonas from "../components/SelectMenuSubzonas";
import SelectMenuZonas from "../components/SelectMenuZonas";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";

export default function MenuZonasSubZonas() {
  const router = useRouter();
  const setZonaSelected = useZonasStore((s) => s.setZonaSelected);
  const [busqueda, setBusqueda] = useState("");
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
          {/* Botón Agregar Iglesia */}
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold text-sm shadow hover:bg-green-700 transition border border-green-600 cursor-pointer whitespace-nowrap"
            onClick={() => router.push("/MenuAgregarIglesia")}
            aria-label="Agregar Iglesia"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Agregar Iglesia
          </button>
        </div>
      </div>
      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-6 scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-[#0a1833] flex flex-col items-center">
        <Iglesias busqueda={busqueda} />
      </div>
    </main>
  );
}
