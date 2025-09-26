"use client";

import dynamic from "next/dynamic";
import SelectMenuZonas from "../components/SelectMenuZonas";

const SpainMap = dynamic(() => import("../components/SpainMap"), { ssr: false });

export default function MenuZonas() {
  return (
    <div className="w-screen h-screen relative bg-black">
      <SpainMap />
      {/* Menú flotante centrado solo con el select de zonas */}
      <div className="fixed top-0 left-0 w-full flex justify-center z-[1000]">
        <div className="mt-4 w-fit flex flex-row items-center gap-8 rounded-2xl border border-gray-200 bg-white/90 backdrop-blur px-6 py-2 shadow-sm">
          <div className="flex flex-row items-center gap-2">
            <label htmlFor="zonas-select" className="text-xs font-semibold tracking-wide text-gray-800">ZONAS</label>
            <SelectMenuZonas />
          </div>
        </div>
      </div>
    </div>
  );
}
