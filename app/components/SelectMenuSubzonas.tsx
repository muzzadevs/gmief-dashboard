"use client";

import { useEffect } from "react";
import type { Subzona } from "@/types/subzonas";
import { useZonasStore } from "@/store/zonasStore";
import Combobox from "./ui/Combobox";

export default function SelectMenuSubzonas() {
  const zonaSelected = useZonasStore((s) => s.zonaSelected);
  const subzonas = useZonasStore((s) => s.subzonas);
  const subzonaSelected = useZonasStore((s) => s.subzonaSelected);
  const setSubzonaSelected = useZonasStore((s) => s.setSubzonaSelected);
  const fetchSubzonas = useZonasStore((s) => s.fetchSubzonas);

  useEffect(() => {
    if (zonaSelected) {
      fetchSubzonas(zonaSelected.id);
    }
  }, [zonaSelected, fetchSubzonas]);

  if (!zonaSelected) return null;

  const options = [
    { value: "todas", label: "Todas las subzonas" },
    ...subzonas.map((subzona: Subzona) => ({
      value: String(subzona.id),
      label: subzona.nombre,
    })),
  ];

  return (
    <Combobox
      id="subzonas-select"
      options={options}
      value={subzonaSelected ? String(subzonaSelected.id) : "todas"}
      onChange={(val) => {
        if (val === "todas") setSubzonaSelected(null);
        else setSubzonaSelected(subzonas.find((s: Subzona) => s.id === Number(val)) || null);
      }}
      placeholder="Selecciona una subzona"
      searchPlaceholder="Buscar subzona..."
      emptyMessage="No se encontraron subzonas."
      aria-label="Selector de subzonas"
    />
  );
}
