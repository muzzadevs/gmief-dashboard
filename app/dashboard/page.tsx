"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import LoaderPersonalizado from "../components/LoaderPersonalizado";
import { searchIncludes } from "@/lib/search";
import { useAuthStore } from "@/store/authStore";

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
    case "credenciales":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
        </svg>
      );
    case "admin":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
    case "credenciales":
      return {
        bg: "from-amber-500 to-orange-600",
        shadow: "shadow-amber-500/25",
        iconBg: "bg-amber-100",
        iconText: "text-amber-700",
      };
    case "admin":
      return {
        bg: "from-purple-500 to-violet-600",
        shadow: "shadow-purple-500/25",
        iconBg: "bg-purple-100",
        iconText: "text-purple-700",
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
  const { user, restoreSession, logout, canAccessModule } = useAuthStore();
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/modulos");
        if (!res.ok) throw new Error("Error al cargar módulos");
        const json = await res.json();
        if (json.ok && json.data) {
          // Filtrar por módulos activos y que el usuario tenga permiso "ver"
          const activos = (json.data as Modulo[]).filter((modulo) => modulo.activo);
          const accesibles = user?.isSuperAdmin
            ? activos
            : activos.filter((m) => canAccessModule(m.id));
          setModulos(accesibles);
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
  }, [user, canAccessModule]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/");
  }, [logout, router]);

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
                  {user ? (
                    <>Bienvenido, <span className="font-semibold text-slate-700">{user.nombre}{user.apellidos ? ` ${user.apellidos}` : ""}</span>{user.isSuperAdmin && <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>}</>
                  ) : (
                    "Panel de administración"
                  )}
                </p>
              </div>
              <button
                type="button"
                className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20 text-sm"
                onClick={handleLogout}
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

    </main>
  );
}
