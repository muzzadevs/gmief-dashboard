"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Church,
  MapPin,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { searchIncludes } from "@/lib/search";

type IglesiaMapa = {
  id: number;
  nombre: string;
  direccion: string | null;
  municipio: string | null;
  provincia: string | null;
  cp: number | null;
  latitud: number;
  longitud: number;
  zona: { nombre: string } | null;
  subzona: { nombre: string } | null;
};

type MinisterioMapa = {
  id: number;
  nombre: string;
  apellidos: string | null;
  alias: string | null;
  tipo: string;
  codigo: string | null;
  iglesia_id: number;
};

type ResultadoPersona = {
  kind: "persona";
  id: number;
  nombreCompleto: string;
  alias: string | null;
  codigo: string | null;
  subtipo: string;
  iglesiaId: number;
};

type ResultadoIglesia = {
  kind: "iglesia";
  iglesiaId: number;
};

type Resultado = ResultadoPersona | ResultadoIglesia;

interface MapSearchBarProps {
  iglesias: IglesiaMapa[];
  ministerios: MinisterioMapa[];
  onSelect: (iglesia: IglesiaMapa) => void;
}

export default function MapSearchBar({ iglesias, ministerios, onSelect }: MapSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");

  // Mapa rápido iglesia_id → IglesiaMapa
  const iglesiaMap = useMemo(() => {
    const m = new Map<number, IglesiaMapa>();
    for (const ig of iglesias) m.set(ig.id, ig);
    return m;
  }, [iglesias]);

  // Focus input al abrir + cerrar con Escape
  useEffect(() => {
    if (!abierto) return;
    // Pequeño delay para que el DOM se renderice
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const cerrarConEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  // Filtrado client-side
  const resultados: Resultado[] = useMemo(() => {
    const q = consulta.trim();
    if (q.length < 2) return [];

    const items: Resultado[] = [];

    // Buscar en iglesias
    for (const ig of iglesias) {
      if (
        searchIncludes(ig.nombre, q) ||
        (ig.municipio && searchIncludes(ig.municipio, q)) ||
        (ig.provincia && searchIncludes(ig.provincia, q)) ||
        (ig.zona?.nombre && searchIncludes(ig.zona.nombre, q))
      ) {
        items.push({ kind: "iglesia", iglesiaId: ig.id });
      }
    }

    // Buscar en ministerios/candidatos
    for (const m of ministerios) {
      const nombreCompleto = [m.nombre, m.apellidos].filter(Boolean).join(" ");
      if (
        searchIncludes(nombreCompleto, q) ||
        (m.alias && searchIncludes(m.alias, q)) ||
        (m.codigo && searchIncludes(m.codigo, q))
      ) {
        items.push({
          kind: "persona",
          id: m.id,
          nombreCompleto,
          alias: m.alias,
          codigo: m.codigo,
          subtipo: m.tipo === "CANDIDATO" ? "Candidato" : "Obrero",
          iglesiaId: m.iglesia_id,
        });
      }
    }

    return items.slice(0, 80);
  }, [consulta, iglesias, ministerios]);

  const handleSelect = (resultado: Resultado) => {
    const iglesia = iglesiaMap.get(resultado.iglesiaId);
    if (iglesia) {
      setConsulta("");
      setAbierto(false);
      onSelect(iglesia);
    }
  };

  return (
    <>
      {/* Botón flotante que abre el buscador */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed top-3 left-20 z-[1001] inline-flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.08)] px-4 py-2.5 text-sm text-slate-500 hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all cursor-pointer"
      >
        <Search className="h-4 w-4 text-slate-400" />
        <span className="hidden sm:inline">Buscar iglesia, obrero o candidato…</span>
        <span className="sm:hidden">Buscar…</span>
      </button>

      {/* Overlay modal de búsqueda */}
      {abierto && (
        <SearchOverlay
          inputRef={inputRef}
          consulta={consulta}
          setConsulta={setConsulta}
          resultados={resultados}
          iglesiaMap={iglesiaMap}
          onSelect={handleSelect}
          onClose={() => setAbierto(false)}
        />
      )}
    </>
  );
}

/* ── Overlay de búsqueda (panel + backdrop) ── */

function SearchOverlay({
  inputRef,
  consulta,
  setConsulta,
  resultados,
  iglesiaMap,
  onSelect,
  onClose,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  consulta: string;
  setConsulta: (v: string) => void;
  resultados: Resultado[];
  iglesiaMap: Map<number, IglesiaMapa>;
  onSelect: (r: Resultado) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[10vh] sm:pt-[12vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-[95vw] max-w-2xl animate-fadein">
        {/* Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Buscar iglesia, obrero o candidato…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-base text-slate-800 shadow-2xl outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Cerrar buscador"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resultados */}
        <SearchResultsList
          consulta={consulta}
          resultados={resultados}
          iglesiaMap={iglesiaMap}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

/* ── Lista de resultados ── */

function SearchResultsList({
  consulta,
  resultados,
  iglesiaMap,
  onSelect,
}: {
  consulta: string;
  resultados: Resultado[];
  iglesiaMap: Map<number, IglesiaMapa>;
  onSelect: (r: Resultado) => void;
}) {
  const q = consulta.trim();

  // No mostrar nada si no hay consulta
  if (q.length < 2) return null;

  return (
    <section className="mt-2 max-h-[55vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl overscroll-contain">
      {resultados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <Search className="h-10 w-10 text-slate-200" />
          <p className="text-sm font-medium text-slate-400">
            Sin resultados para &ldquo;{q}&rdquo;
          </p>
          <p className="text-xs text-slate-300">
            Prueba con otro nombre de iglesia, obrero o candidato
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {resultados.map((resultado, i) => (
            <li key={resultado.kind === "persona" ? `p-${resultado.id}` : `i-${resultado.iglesiaId}-${i}`}>
              {resultado.kind === "persona" ? (
                <PersonaItem
                  resultado={resultado}
                  iglesia={iglesiaMap.get(resultado.iglesiaId)}
                  onSelect={() => onSelect(resultado)}
                />
              ) : (
                <IglesiaItem
                  iglesia={iglesiaMap.get(resultado.iglesiaId)!}
                  onSelect={() => onSelect(resultado)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {resultados.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2 text-center text-[11px] text-slate-400">
          {resultados.length} resultado{resultados.length !== 1 ? "s" : ""}
        </div>
      )}
    </section>
  );
}


/* ── Item de persona (obrero/candidato) ── */

function PersonaItem({
  resultado,
  iglesia,
  onSelect,
}: {
  resultado: ResultadoPersona;
  iglesia: IglesiaMapa | undefined;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-start gap-3 p-3 text-left hover:bg-indigo-50/60 transition-colors"
    >
      <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-800">
            {resultado.nombreCompleto}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              resultado.subtipo === "Candidato"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {resultado.subtipo}
          </span>
        </span>
        <span className="mt-1 block text-xs text-slate-500">
          {resultado.alias ? `«${resultado.alias}» · ` : ""}
          {iglesia?.nombre ?? "Iglesia desconocida"}
          {iglesia?.zona?.nombre ? ` · ${iglesia.zona.nombre}` : ""}
          {iglesia?.municipio ? ` · ${iglesia.municipio}` : ""}
        </span>
        {resultado.codigo && (
          <span className="mt-0.5 block text-xs text-slate-400">
            Código: {resultado.codigo}
          </span>
        )}
      </span>
      <MapPin className="h-4 w-4 shrink-0 text-slate-300 mt-0.5" />
    </button>
  );
}

/* ── Item de iglesia ── */

function IglesiaItem({
  iglesia,
  onSelect,
}: {
  iglesia: IglesiaMapa;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-start gap-3 p-3 text-left hover:bg-indigo-50/60 transition-colors"
    >
      <Church className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
      <span className="min-w-0 flex-1">
        <span className="font-semibold text-slate-800">{iglesia.nombre}</span>
        <span className="mt-1 block text-xs text-slate-500">
          {iglesia.zona?.nombre ?? ""}
          {iglesia.municipio ? ` · ${iglesia.municipio}` : ""}
          {iglesia.provincia ? ` · ${iglesia.provincia}` : ""}
        </span>
      </span>
      <MapPin className="h-4 w-4 shrink-0 text-slate-300 mt-0.5" />
    </button>
  );
}


