"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const SpainMap = dynamic(() => import("../../components/SpainMap"), {
  ssr: false,
});

export default function ModuloMapa() {
  const router = useRouter();

  return (
    <div className="w-screen h-screen h-dvh relative">
      <SpainMap />
      {/* Botón volver al dashboard */}
      <div className="fixed top-3 left-3 z-[1000]">
        <button
          type="button"
          className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20 text-sm"
          onClick={() => router.push("/dashboard")}
          aria-label="Volver al menú principal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Menú principal
        </button>
      </div>
    </div>
  );
}
