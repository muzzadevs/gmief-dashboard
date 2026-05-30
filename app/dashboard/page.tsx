"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoaderPersonalizado from "../components/LoaderPersonalizado";
import { searchIncludes } from "@/lib/search";

type Modulo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  href: string;
  activo: boolean;
  orden: number;
};

// Iconos por nombre (mapeo simple)
function ModuloIcon({ icono, className }: { icono: string | null; className?: string }) {
  const cls = className || "w-8 h-8";
  switch (icono) {
    case "mapa":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      );
    case "ministerios":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      );
  }
}

// Colores por módulo
function getModuleColors(icono: string | null) {
  switch (icono) {
    case "mapa":
      return {
        bg: "from-emerald-500 to-teal-600",
        shadow: "shadow-emerald-500/25",
        iconBg: "bg-emerald-100",
        iconText: "text-emerald-700",
      };
    case "ministerios":
      return {
        bg: "from-blue-500 to-indigo-600",
        shadow: "shadow-blue-500/25",
        iconBg: "bg-blue-100",
        iconText: "text-blue-700",
      };
    default:
      return {
        bg: "from-slate-500 to-slate-700",
        shadow: "shadow-slate-500/25",
        iconBg: "bg-slate-100",
        iconText: "text-slate-700",
      };
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/modulos");
        if (!res.ok) throw new Error("Error al cargar módulos");
        const json = await res.json();
        if (json.ok && json.data) {
          setModulos(json.data);
        } else {
          throw new Error("Respuesta inválida");
        }
      } catch (err) {
        console.error("Error fetching modulos:", err);
        setError("No se pudieron cargar los módulos");
      } finally {
        setLoading(false);
      }
    };
    fetchModulos();
  }, []);

  const modulosFiltrados = busqueda.trim().length > 0
    ? modulos.filter((m) =>
        searchIncludes(m.nombre, busqueda) ||
        (m.descripcion && searchIncludes(m.descripcion, busqueda))
      )
    : modulos;

  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      {/* Header */}
      <div className="w-full flex justify-center px-3 pt-4 sm:pt-6 pb-2">
        <div className="w-full max-w-4xl">
          <div className="glass-card-solid px-5 sm:px-8 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                  filadelfiaConecta
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Panel de administración — Selecciona un módulo
                </p>
              </div>
              <button
                type="button"
                className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20 text-sm"
                onClick={() => router.push("/")}
                aria-label="Cerrar sesión"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Cerrar sesión
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Listado de módulos */}
      <div className="flex-1 w-full flex justify-center px-3 py-4">
        <div className="w-full max-w-4xl">
          {loading ? (
            <LoaderPersonalizado>Cargando módulos...</LoaderPersonalizado>
          ) : error ? (
            <div className="text-center py-12">
              <div className="glass-card-solid p-8 inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-red-400 mx-auto mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-slate-600 font-medium">{error}</p>
                <button
                  type="button"
                  className="mt-4 btn-primary bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => window.location.reload()}
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : modulosFiltrados.length === 0 ? (
            <div className="text-center text-white/60 py-12 text-sm">
              {busqueda.trim().length > 0
                ? "No se encontraron módulos con esa búsqueda"
                : "No hay módulos disponibles"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modulosFiltrados.map((modulo, index) => {
                const colors = getModuleColors(modulo.icono);
                return (
                  <button
                    key={modulo.id}
                    type="button"
                    onClick={() => router.push(modulo.href)}
                    className={`glass-card-solid p-0 overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] cursor-pointer animate-fadein group`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {/* Barra de color superior */}
                    <div className={`h-1.5 bg-gradient-to-r ${colors.bg}`} />
                    
                    <div className="p-5 sm:p-6 flex items-start gap-4">
                      {/* Icono */}
                      <div className={`${colors.iconBg} rounded-xl p-3 flex-shrink-0 transition-transform group-hover:scale-110`}>
                        <ModuloIcon icono={modulo.icono} className={`w-7 h-7 ${colors.iconText}`} />
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-slate-800 truncate group-hover:text-slate-900 transition-colors">
                          {modulo.nombre}
                        </h3>
                        {modulo.descripcion && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {modulo.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Flecha */}
                      <div className="flex-shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-all group-hover:translate-x-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Firma */}
      <span className="fixed right-6 bottom-4 z-50 select-none pointer-events-none flex items-end gap-2 text-xs text-white/70 tracking-wide">
        <span>Hecho por Kale Dor Kayiko</span>
        <a
          href="https://www.kaledorkayiko.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto inline-block align-bottom hover:scale-110 transition-transform"
          style={{ width: "23px", height: "16px" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
            <rect width="900" height="300" y="0" fill="#0072CE" />
            <rect width="900" height="300" y="300" fill="#009A00" />
            <g fill="none" stroke="#D40000" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="450" cy="300" r="180" strokeWidth="30" />
              <g strokeWidth="18">
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(0 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(22.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(45 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(67.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(90 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(112.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(135 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(157.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(180 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(202.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(225 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(247.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(270 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(292.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(315 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(337.5 450 300)" />
              </g>
              <circle cx="450" cy="300" r="42" fill="#D40000" stroke="#D40000" />
            </g>
          </svg>
        </a>
      </span>
    </main>
  );
}
