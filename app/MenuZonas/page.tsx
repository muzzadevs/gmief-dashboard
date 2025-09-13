"use client";

import dynamic from "next/dynamic";

const SpainMap = dynamic(() => import("../components/SpainMap"), { ssr: false });

export default function MenuZonas() {
  return (
    <div className="w-screen h-screen relative">
      {/* Mapa de fondo */}
      <SpainMap />

      {/* Menú fijo arriba */}
      <div className="fixed top-0 left-0 w-full flex justify-center z-[1000]">
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/90 backdrop-blur px-4 py-2 shadow-sm">
          <span className="text-sm font-semibold tracking-wide text-gray-800">
            ZONAS
          </span>

          <select
            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            defaultValue="zona-1"
            aria-label="Selector de zonas"
          >
            {Array.from({ length: 17 }).map((_, i) => {
              const n = i + 1;
              return (
                <option key={n} value={`zona-${n}`}>
                  Zona {n}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
