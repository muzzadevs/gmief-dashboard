"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";
import LoaderPersonalizado from "../../components/LoaderPersonalizado";
import ModalAgregarZona from "../../components/ModalAgregarZona";
import ModalEditarZonas from "../../components/ModalEditarZonas";
import { searchIncludes } from "@/lib/search";

type Zona = { id: number; nombre: string; codigo: string; activo: boolean };
type ZonaStats = Record<number, { ministerios: number; candidatos: number }>;

export default function GestionMinisteriosHome() {
  const router = useRouter();
  const setZonaSelected = useZonasStore((s) => s.setZonaSelected);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [isModalAgregarOpen, setIsModalAgregarOpen] = useState(false);
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
  const [stats, setStats] = useState<ZonaStats>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [zonasRes, statsRes] = await Promise.all([
          fetch("/api/zonas"),
          fetch("/api/zonas/stats"),
        ]);
        const zonasJson = await zonasRes.json();
        const statsJson = await statsRes.json();

        if (zonasJson.ok && zonasJson.data) {
          setZonas(zonasJson.data);
        }
        if (statsJson.ok && statsJson.data) {
          setStats(statsJson.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const zonasFiltradas =
    busqueda.trim().length > 0
      ? zonas.filter((z) => searchIncludes(z.nombre, busqueda))
      : zonas;

  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      {/* Menú superior */}
      <div className="w-full flex justify-center z-[1000] px-2 sm:px-0">
        <div className="mt-3 sm:mt-4 w-full sm:w-[95%] max-w-4xl glass-card-solid px-4 sm:px-6 py-3 sm:py-4">
          {/* Primera fila: Botón volver + Título */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
            <button
              type="button"
              className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20 sm:w-auto"
              onClick={() => router.push("/dashboard")}
              aria-label="Volver al menú principal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Menú principal
            </button>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Gestión de Ministerios
            </h2>
          </div>

          {/* Segunda fila: Buscador + Botones */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar zonas..."
                className="input-glass w-full"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex-1 sm:flex-initial text-xs sm:text-sm"
                onClick={() => setIsModalAgregarOpen(true)}
                aria-label="Agregar Zona"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">Agregar </span>Zona
              </button>
              <button
                type="button"
                className="btn-primary bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 flex-1 sm:flex-initial text-xs sm:text-sm"
                onClick={() => setIsModalEditarOpen(true)}
                aria-label="Editar Zonas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                <span className="hidden sm:inline">Editar </span>Zonas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listado de zonas */}
      <div className="flex-1 w-full flex justify-center px-2 sm:px-4 py-4">
        <div className="w-full max-w-4xl">
          {loading ? (
            <LoaderPersonalizado>Cargando zonas...</LoaderPersonalizado>
          ) : zonasFiltradas.length === 0 ? (
            <div className="text-center text-white/60 py-12 text-sm">
              {busqueda.trim().length > 0
                ? "No se encontraron zonas con esa búsqueda"
                : "No hay zonas disponibles"}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {zonasFiltradas
                .slice()
                .sort((a, b) => {
                  // Inactivos al final
                  if (a.activo !== b.activo) return a.activo ? -1 : 1;
                  return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
                })
                .map((zona) => {
                  const zonaStats = stats[zona.id];
                  const countMin = zonaStats?.ministerios ?? 0;
                  const countCand = zonaStats?.candidatos ?? 0;

                  const isInactive = !zona.activo;

                  return (
                    <div
                      key={zona.id}
                      className={`glass-card-solid px-5 py-4 flex flex-col animate-fadein ${
                        isInactive ? "opacity-50 grayscale" : ""
                      }`}
                    >
                      <div className="flex flex-row items-center gap-4 w-full">
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold text-base truncate ${isInactive ? "text-slate-400" : "text-slate-800"}`}>
                              {zona.nombre}
                            </span>
                            {isInactive && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-bold">
                                Inactivo
                              </span>
                            )}
                            {/* Badges de ministerios y candidatos */}
                            {!isInactive && (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px]">
                                  <span className="font-bold">{countMin}</span> {countMin === 1 ? "Obrero" : "Obreros"}
                                </span>
                                {countCand > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px]">
                                    <span className="font-bold">{countCand}</span> {countCand === 1 ? "Candidato" : "Candidatos"}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          {zona.codigo && (
                            <div className={`text-xs ${isInactive ? "text-slate-400" : "text-slate-500"}`}>
                              Código: <span className="font-mono font-semibold">{zona.codigo}</span>
                            </div>
                          )}
                        </div>

                        {/* Botón Iglesias */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            className={`btn-primary shadow-md text-sm ${
                              isInactive
                                ? "bg-slate-400 text-white cursor-not-allowed"
                                : "bg-blue-700 text-white hover:bg-blue-800"
                            }`}
                            disabled={isInactive}
                            onClick={() => {
                              if (isInactive) return;
                              setZonaSelected(zona);
                              router.push("/modulos/gestion-ministerios/zonas-subzonas");
                            }}
                            aria-label={`Ver iglesias de ${zona.nombre}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6M3.75 9v.75A2.25 2.25 0 006 12h12a2.25 2.25 0 002.25-2.25V9" />
                            </svg>
                            <span className="hidden sm:inline">Iglesias</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar Zona */}
      <ModalAgregarZona
        isOpen={isModalAgregarOpen}
        onClose={() => setIsModalAgregarOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Modal Editar Zonas */}
      <ModalEditarZonas
        isOpen={isModalEditarOpen}
        onClose={() => setIsModalEditarOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </main>
  );
}
