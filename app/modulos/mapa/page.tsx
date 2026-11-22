"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const SpainMap = dynamic(() => import("../../components/SpainMap"), {
  ssr: false,
});

export default function ModuloMapa() {
  const router = useRouter();

  return (
    <div className="w-screen h-screen h-dvh relative">
      <SpainMap />
      {/* Botón volver al dashboard — z-[1100] para estar sobre las capas de Leaflet */}
      <div className="fixed top-3 left-3 z-[1100]">
        <button
          type="button"
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20"
          onClick={() => router.push("/dashboard")}
          aria-label="Volver al menú principal"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
