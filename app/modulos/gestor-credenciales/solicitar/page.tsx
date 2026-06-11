"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoaderPersonalizado from "../../../components/LoaderPersonalizado";
import Toast, { useToast } from "../../../components/Toast";
import { searchIncludes } from "@/lib/search";

type MinisterioBuscar = {
  id: number;
  nombre: string;
  apellidos: string | null;
  alias: string | null;
  codigo: string | null;
  has_imagen: boolean;
  iglesia_nombre: string;
  zona_nombre: string;
  zona_codigo: string;
  cargos: string[];
};

export default function SolicitarCredenciales() {
  const router = useRouter();
  const [ministerios, setMinisterios] = useState<MinisterioBuscar[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [creando, setCreando] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const fetchMinisterios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ministerios/buscar?q=");
      const json = await res.json();
      if (json.ok && json.data) {
        setMinisterios(json.data);
      }
    } catch (err) {
      console.error("Error fetching ministerios:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMinisterios();
  }, [fetchMinisterios]);

  const toggleSeleccion = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const filtrados = getMinisteriosFiltrados();
    setSeleccionados(new Set(filtrados.map((m) => m.id)));
  };

  const clearSelection = () => {
    setSeleccionados(new Set());
  };

  const getMinisteriosFiltrados = () => {
    if (!busqueda.trim()) return ministerios;
    return ministerios.filter(
      (m) =>
        searchIncludes(m.nombre, busqueda) ||
        (m.apellidos && searchIncludes(m.apellidos, busqueda)) ||
        (m.alias && searchIncludes(m.alias, busqueda)) ||
        (m.codigo && searchIncludes(m.codigo, busqueda))
    );
  };

  const handleCrearSolicitud = async () => {
    if (seleccionados.size === 0) {
      showError("Debe seleccionar al menos un ministerio");
      return;
    }

    setCreando(true);
    try {
      const res = await fetch("/api/solicitudes-credencial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ministerio_ids: Array.from(seleccionados),
        }),
      });

      const json = await res.json();
      if (json.ok) {
        showSuccess(`Solicitud creada con ${seleccionados.size} ministerio(s)`);
        setTimeout(() => {
          router.push("/modulos/gestor-credenciales");
        }, 1500);
      } else {
        showError(json.error || "Error al crear solicitud");
      }
    } catch (err) {
      console.error("Error creating solicitud:", err);
      showError("Error al crear solicitud");
    } finally {
      setCreando(false);
    }
  };

  const filtrados = getMinisteriosFiltrados();

  const getDisplayName = (m: MinisterioBuscar) =>
    m.alias ? m.alias : `${m.nombre} ${m.apellidos || ""}`.trim();

  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={hideToast} />

      {/* Header */}
      <div className="w-full flex justify-center z-[1000] px-2 sm:px-0">
        <div className="mt-3 sm:mt-4 w-full sm:w-[95%] max-w-4xl glass-card-solid px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
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
              Solicitar Credenciales
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, apellidos, alias o código..."
                className="input-glass w-full"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                className="btn-primary bg-blue-600 text-white hover:bg-blue-700 shadow-md text-xs sm:text-sm flex-1 sm:flex-initial"
                onClick={selectAll}
              >
                Todos
              </button>
              <button
                type="button"
                className="btn-primary bg-slate-500 text-white hover:bg-slate-600 shadow-md text-xs sm:text-sm flex-1 sm:flex-initial"
                onClick={clearSelection}
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Selection counter & submit */}
          {seleccionados.size > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-700">
                {seleccionados.size} ministerio(s) seleccionado(s)
              </span>
              <button
                type="button"
                className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50"
                onClick={handleCrearSolicitud}
                disabled={creando}
              >
                {creando ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creando...
                  </span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Crear Solicitud
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 w-full flex justify-center px-2 sm:px-4 py-4">
        <div className="w-full max-w-4xl">
          {loading ? (
            <LoaderPersonalizado>Cargando ministerios...</LoaderPersonalizado>
          ) : filtrados.length === 0 ? (
            <div className="text-center text-white/60 py-12 text-sm">
              {busqueda.trim()
                ? "No se encontraron ministerios con esa búsqueda"
                : "No hay ministerios disponibles"}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtrados.map((m) => {
                const isSelected = seleccionados.has(m.id);
                const displayName = getDisplayName(m);
                const subName = m.alias ? `${m.nombre} ${m.apellidos || ""}`.trim() : null;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSeleccion(m.id)}
                    className={`glass-card-solid px-4 py-3 flex items-center gap-3 animate-fadein transition-all duration-150 cursor-pointer text-left w-full ${
                      isSelected
                        ? "ring-2 ring-blue-500 bg-blue-50/80"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "bg-blue-600 border-blue-600"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {m.has_imagen ? (
                        <Image
                          src={`/api/ministerios/${m.id}/imagen`}
                          alt={displayName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        displayName[0]
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800 truncate">
                          {displayName}
                        </span>
                        {m.codigo && (
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {m.codigo}
                          </span>
                        )}
                      </div>
                      {subName && (
                        <span className="text-xs text-slate-500 truncate block">{subName}</span>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-slate-400">
                          [{m.zona_codigo}] {m.iglesia_nombre}
                        </span>
                        {m.cargos.length > 0 && (
                          <span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {m.cargos[0]}
                          </span>
                        )}
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
