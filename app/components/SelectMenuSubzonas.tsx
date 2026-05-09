import { useEffect } from "react";
import type { Subzona } from "@/types/subzonas";
import { useZonasStore } from "@/store/zonasStore";

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

  return (
    <select
      id="subzonas-select"
      className="select-glass w-full"
      value={subzonaSelected ? String(subzonaSelected.id) : "todas"}
      onChange={(e) => {
        const id = e.target.value;
        if (id === "todas") setSubzonaSelected(null);
        else setSubzonaSelected(subzonas.find((s: Subzona) => s.id === Number(id)) || null);
      }}
      aria-label="Selector de subzonas"
    >
      <option value="todas">Todas las subzonas</option>
      {subzonas.map((subzona: Subzona) => (
        <option key={subzona.id} value={subzona.id}>
          {subzona.nombre}
        </option>
      ))}
    </select>
  );
}
