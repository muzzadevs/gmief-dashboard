"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";
import type { Zona } from "@/types/zonas";

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
        if (!ignore) setZonas(json.data); // 👈 no seleccionamos nada
      } catch (e: any) {
        if (!ignore && e.name !== "AbortError") setError("No se pudieron cargar las zonas");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; ac.abort(); };
  }, [setZonas]);

  // valor vacío hasta que el usuario elija
  const value = zonaSelected ? String(zonaSelected.id) : "";

  return (
      <select
      id="zonas-select"
      className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 min-w-52 w-full"
      value={value}
      onChange={(e) => {
        const id = Number(e.target.value);
        const zona = zonas.find((z) => z.id === id) || null;
        setZonaSelected(zona);
        if (zona) {
          router.push("/MenuZonasSubZonas");
        }
      }}
      aria-label="Selector de zonas"
      disabled={loading || !!error}
    >
      {/* Placeholder: visible solo mientras no haya selección */}
      {!zonaSelected && (
        <option value="" disabled>
          Selecciona una zona
        </option>
      )}

      {loading && <option value="" disabled>Cargando zonas...</option>}
      {error && <option value="" disabled>Error cargando zonas</option>}

      {!loading && !error && zonas.map((z) => (
        <option key={z.id} value={String(z.id)}>
          {z.nombre}
        </option>
      ))}
    </select>
  );
}
