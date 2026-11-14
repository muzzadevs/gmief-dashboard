"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Church, LoaderCircle, MapPin, Search, UserRound } from "lucide-react";
import { useZonasStore } from "@/store/zonasStore";

type ResultadoPersona = {
  tipo: "persona";
  id: number;
  subtipo: string;
  nombre: string;
  alias: string | null;
  codigo: string | null;
  iglesia: string;
  zona: string;
  zonaId: number;
  zonaCodigo: string;
  iglesiaId: number;
  municipio: string | null;
  provincia: string | null;
  cargos: string[];
  iglesiaSeleccion: {
    id: number;
    nombre: string;
    direccion: string | null;
    municipio: string | null;
    provincia: string | null;
    zona_id: number;
    subzona_id: number | null;
    cp: number | null;
    activo: boolean;
    zona: { id: number; nombre: string; codigo: string; activo: boolean };
  };
};

type ResultadoIglesia = {
  tipo: "iglesia";
  id: number;
  nombre: string;
  municipio: string | null;
  provincia: string | null;
  zona: string;
  zonaId: number;
  zonaCodigo: string;
};

type ResultadoCargo = {
  tipo: "cargo";
  id: number;
  nombre: string;
};

type Resultado = ResultadoPersona | ResultadoIglesia | ResultadoCargo;
type TipoFiltro = "todos" | "persona" | "iglesia" | "cargo";

const FILTROS: { valor: TipoFiltro; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todo" },
  { valor: "persona", etiqueta: "Obreros y candidatos" },
  { valor: "iglesia", etiqueta: "Iglesias" },
  { valor: "cargo", etiqueta: "Cargos" },
];

export default function BuscadorGlobal() {
  const router = useRouter();
  const setZonaSelected = useZonasStore((state) => state.setZonaSelected);
  const setIglesiaSelected = useZonasStore((state) => state.setIglesiaSelected);
  const setMinisterioEditId = useZonasStore((state) => state.setMinisterioEditId);
  const [consulta, setConsulta] = useState("");
  const [tipo, setTipo] = useState<TipoFiltro>("todos");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const texto = consulta.trim();
    if (texto.length < 2) {
      setResultados([]);
      setError(null);
      setCargando(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setCargando(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: texto, tipo });
        const response = await fetch(`/api/gestion-ministerios/buscar?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const json = await response.json();
        if (!response.ok || !json.ok) {
          throw new Error(json.error || "No se pudo completar la búsqueda");
        }
        setResultados(json.data as Resultado[]);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Error al buscar");
        setResultados([]);
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [consulta, tipo]);

  const abrirPersona = (persona: ResultadoPersona) => {
    const iglesia = persona.iglesiaSeleccion;
    setZonaSelected({
      id: iglesia.zona.id,
      nombre: iglesia.zona.nombre,
      codigo: iglesia.zona.codigo,
      activo: iglesia.zona.activo,
    });
    setIglesiaSelected({
      id: iglesia.id,
      nombre: iglesia.nombre,
      direccion: iglesia.direccion,
      municipio: iglesia.municipio,
      provincia: iglesia.provincia,
      zona_id: iglesia.zona_id,
      subzona_id: iglesia.subzona_id,
      cp: iglesia.cp,
      facebook_url: null,
      youtube_url: null,
      tiktok_url: null,
      instagram_url: null,
      activo: iglesia.activo,
    });
    setMinisterioEditId(persona.id);
    router.push("/modulos/gestion-ministerios/editar-ministerio");
  };

  const abrirIglesia = (iglesia: ResultadoIglesia) => {
    setZonaSelected({
      id: iglesia.zonaId,
      nombre: iglesia.zona,
      codigo: iglesia.zonaCodigo,
      activo: true,
    });
    router.push(`/modulos/gestion-ministerios/editar-iglesia/${iglesia.id}`);
  };

  const abrirCargo = (cargo: ResultadoCargo) => {
    setTipo("persona");
    setConsulta(cargo.nombre);
  };

  return (
    <section className="glass-card-solid w-full p-4 sm:p-5" aria-label="Buscador global">
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-5 w-5 text-indigo-600" />
        <div>
          <h2 className="font-bold text-slate-800">Buscador global</h2>
          <p className="text-xs text-slate-500">
            Busca obreros, candidatos, iglesias o cargos en las zonas a las que tienes acceso.
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Ignora mayúsculas y tildes, y admite variantes como g/j.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={consulta}
          onChange={(event) => setConsulta(event.target.value)}
          placeholder="Nombre, iglesia, municipio, cargo o código..."
          className="input-glass w-full pl-10"
          autoComplete="off"
          aria-label="Buscar en Gestión de Ministerios"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar resultados">
        {FILTROS.map((filtro) => (
          <button
            key={filtro.valor}
            type="button"
            onClick={() => setTipo(filtro.valor)}
            aria-pressed={tipo === filtro.valor}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              tipo === filtro.valor
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {filtro.etiqueta}
          </button>
        ))}
      </div>

      {consulta.trim().length > 0 && consulta.trim().length < 2 && (
        <p className="mt-3 text-xs text-slate-500">Escribe al menos 2 caracteres.</p>
      )}
      {cargando && (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-500" role="status">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Buscando...
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
      {!cargando && !error && consulta.trim().length >= 2 && resultados.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No se encontraron resultados.</p>
      )}

      {resultados.length > 0 && (
        <ul className="mt-3 max-h-[28rem] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
          {resultados.map((resultado) => (
            <li key={`${resultado.tipo}-${resultado.id}`}>
              {resultado.tipo === "persona" ? (
                <button
                  type="button"
                  onClick={() => abrirPersona(resultado)}
                  className="flex w-full items-start gap-3 p-3 text-left hover:bg-indigo-50/60"
                >
                  <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">{resultado.nombre}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        resultado.subtipo === "Candidato"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>{resultado.subtipo}</span>
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {resultado.alias ? `«${resultado.alias}» · ` : ""}
                      {resultado.iglesia} · {resultado.zona}
                      {resultado.municipio ? ` · ${resultado.municipio}` : ""}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {resultado.codigo ? `Código: ${resultado.codigo}` : ""}
                      {resultado.cargos.length > 0 ? `${resultado.codigo ? " · " : ""}Cargos: ${resultado.cargos.join(", ")}` : ""}
                    </span>
                  </span>
                  <MapPin className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ) : resultado.tipo === "iglesia" ? (
                <button
                  type="button"
                  onClick={() => abrirIglesia(resultado)}
                  className="flex w-full items-start gap-3 p-3 text-left hover:bg-indigo-50/60"
                >
                  <Church className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-800">{resultado.nombre}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {resultado.zona}
                      {resultado.municipio ? ` · ${resultado.municipio}` : ""}
                      {resultado.provincia ? ` · ${resultado.provincia}` : ""}
                    </span>
                  </span>
                  <MapPin className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => abrirCargo(resultado)}
                  className="flex w-full items-start gap-3 p-3 text-left hover:bg-indigo-50/60"
                >
                  <BriefcaseBusiness className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-800">{resultado.nombre}</span>
                    <span className="mt-1 block text-xs text-slate-500">Buscar personas con este cargo</span>
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
