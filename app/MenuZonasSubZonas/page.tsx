"use client";


import Iglesias from "../components/Iglesias";
import SelectMenuSubzonas from "../components/SelectMenuSubzonas";
import SelectMenuZonas from "../components/SelectMenuZonas";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";


export default function MenuZonasSubZonas() {
  const router = useRouter();
  const setZonaSelected = useZonasStore((s) => s.setZonaSelected);
  return (
    <main
      className="min-h-screen max-h-screen flex flex-col font-sans bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: "no-repeat", backgroundSize: "cover" }}
    >
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Volver
          </button>
          <div className="flex flex-row items-center gap-2 w-full">
            <SelectMenuZonas />
          </div>
          <div className="flex flex-row items-center gap-2 w-full">
            <SelectMenuSubzonas />
          </div>
          {/* Aquí irán botones en el futuro */}
        </div>
      </div>
      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-6 scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-[#0a1833] flex flex-col items-center">
        <Iglesias />
      </div>
    </main>
  );
}
