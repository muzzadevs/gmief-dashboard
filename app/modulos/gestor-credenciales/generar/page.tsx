"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import LoaderPersonalizado from "../../../components/LoaderPersonalizado";

type SolicitudItem = {
  id: number;
  ministerio_id: number;
  expedida: boolean;
  fecha_expedicion: string | null;
  ministerio_nombre: string;
  ministerio_apellidos: string | null;
  ministerio_alias: string | null;
  ministerio_codigo: string | null;
};

type Solicitud = {
  id: number;
  fecha: string;
  estado: string;
  notas: string | null;
  total_items: number;
  items_expedidos: number;
  items: SolicitudItem[];
};

export default function GenerarCredenciales() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/solicitudes-credencial");
      const json = await res.json();
      if (json.ok && json.data) {
        setSolicitudes(json.data);
      }
    } catch (err) {
      console.error("Error fetching solicitudes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return {
          bg: "bg-amber-100",
          text: "text-amber-800",
          label: "Pendiente",
          icon: "🟡",
        };
      case "EN_PROCESO":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "En proceso",
          icon: "🔵",
        };
      case "COMPLETADA":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-800",
          label: "Completada",
          icon: "✅",
        };
      default:
        return {
          bg: "bg-slate-100",
          text: "text-slate-800",
          label: estado,
          icon: "⚪",
        };
    }
  };

  // Sort: active first (PENDIENTE, EN_PROCESO), then COMPLETADA at bottom
  const sortedSolicitudes = [...solicitudes].sort((a, b) => {
    const order: Record<string, number> = { PENDIENTE: 0, EN_PROCESO: 1, COMPLETADA: 2 };
    const oa = order[a.estado] ?? 99;
    const ob = order[b.estado] ?? 99;
    if (oa !== ob) return oa - ob;
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  });

  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      {/* Header */}
      <div className="w-full flex justify-center z-[1000] px-2 sm:px-0">
        <div className="mt-3 sm:mt-4 w-full sm:w-[95%] max-w-4xl glass-card-solid px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20 sm:w-auto"
              onClick={() => router.push("/modulos/gestor-credenciales")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Volver
            </button>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Generar Credenciales
            </h2>
          </div>
        </div>
      </div>

      {/* Solicitudes list */}
      <div className="flex-1 w-full flex justify-center px-2 sm:px-4 py-4">
        <div className="w-full max-w-4xl">
          {loading ? (
            <LoaderPersonalizado>Cargando solicitudes...</LoaderPersonalizado>
          ) : sortedSolicitudes.length === 0 ? (
            <div className="text-center text-white/60 py-12 text-sm">
              No hay solicitudes. Crea una desde la sección &quot;Solicitar&quot;.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedSolicitudes.map((sol) => {
                const badge = getEstadoBadge(sol.estado);
                const isCompleted = sol.estado === "COMPLETADA";
                const fechaStr = new Date(sol.fecha).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <button
                    key={sol.id}
                    type="button"
                    onClick={() =>
                      router.push(`/modulos/gestor-credenciales/generar/${sol.id}`)
                    }
                    className={`glass-card-solid px-5 py-4 flex flex-col gap-2 animate-fadein transition-all duration-150 cursor-pointer text-left w-full hover:shadow-lg ${
                      isCompleted ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base text-slate-800">
                          Solicitud #{sol.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.bg} ${badge.text}`}
                        >
                          {badge.icon} {badge.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{fechaStr}</span>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isCompleted
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${
                              sol.total_items > 0
                                ? (sol.items_expedidos / sol.total_items) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                        {sol.items_expedidos}/{sol.total_items}
                      </span>
                    </div>

                    {/* Ministerios preview */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {sol.items.slice(0, 5).map((item) => {
                        const name = item.ministerio_alias
                          ? item.ministerio_alias
                          : `${item.ministerio_nombre} ${item.ministerio_apellidos || ""}`.trim();
                        return (
                          <span
                            key={item.id}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${
                              item.expedida
                                ? "bg-emerald-50 text-emerald-700 line-through"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.ministerio_codigo && (
                              <span className="font-mono mr-1">{item.ministerio_codigo}</span>
                            )}
                            {name}
                          </span>
                        );
                      })}
                      {sol.items.length > 5 && (
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-500">
                          +{sol.items.length - 5} más
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
