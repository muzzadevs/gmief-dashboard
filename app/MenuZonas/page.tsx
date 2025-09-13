"use client";

import dynamic from "next/dynamic";
import SelectMenuZonas from "../components/SelectMenuZonas";

const SpainMap = dynamic(() => import("../components/SpainMap"), { ssr: false });

export default function MenuZonas() {
  return (
    <div className="w-screen h-screen relative">
      <SpainMap />
      <SelectMenuZonas />
    </div>
  );
}
