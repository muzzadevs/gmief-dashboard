"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";
import type { Zona } from "@/types/zonas";
import Combobox from "./ui/Combobox";

export default function SelectMenuZonas() {
  const { zonas, setZonas, zonaSelected, setZonaSelected } = useZonasStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/zonas", { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: { ok: boolean; data: Zona[] } = await res.json();
        if (!json.ok) throw new Error("Respuesta no OK");
        if (!ignore) setZonas(json.data);
      } catch (e: unknown) {
        if (!ignore && !(e instanceof DOMException && e.name === "AbortError")) setError("No se pudieron cargar las zonas");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; ac.abort(); };
  }, [setZonas]);

  const value = zonaSelected ? String(zonaSelected.id) : "";

  const options = loading
    ? [{ value: "", label: "Cargando zonas..." }]
    : error
    ? [{ value: "", label: "Error cargando zonas" }]
    : zonas
        .filter((z) => z.activo)
        .map((z) => ({ value: String(z.id), label: z.nombre }));

  return (
    <Combobox
      id="zonas-select"
      options={options}
      value={value}
      onChange={(val) => {
        const id = Number(val);
        const zona = zonas.find((z) => z.id === id) || null;
        setZonaSelected(zona);
        if (zona) {
          router.push("/modulos/gestion-ministerios/zonas-subzonas");
        }
      }}
      placeholder="Selecciona una zona"
      searchPlaceholder="Buscar zona..."
      emptyMessage="No se encontraron zonas."
      aria-label="Selector de zonas"
      disabled={loading || !!error}
    />
  );
}
