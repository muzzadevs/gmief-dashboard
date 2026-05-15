"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import LoaderPersonalizado from "../components/LoaderPersonalizado";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";
import type { Ministerio, Cargo } from "@/types/ministerios";
import { calcularFase, formatDiasRestantes } from "@/lib/candidatoUtils";
import Toast, { useToast } from "../components/Toast";

export default function MenuMinisterios() {
  const router = useRouter();
  const iglesiaSelected = useZonasStore((s) => s.iglesiaSelected);
  const setMinisterioEditId = useZonasStore((s) => s.setMinisterioEditId);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [avatarModal, setAvatarModal] = useState<{
    open: boolean;
    letra: string | null;
    ministerioId: number | null;
  }>({ open: false, letra: null, ministerioId: null });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    ministerio: Ministerio | null;
  }>({ open: false, ministerio: null });
  const [aprobarModal, setAprobarModal] = useState<{
    open: boolean;
    ministerio: Ministerio | null;
  }>({ open: false, ministerio: null });
  const [loading, setLoading] = useState(true);
  const [deleteExplode, setDeleteExplode] = useState(false);
  const [aprobarLoading, setAprobarLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"TODOS" | "MINISTERIO" | "CANDIDATO">("TODOS");
  const [imgTimestamp, setImgTimestamp] = useState<number>(Date.now());
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    if (!iglesiaSelected) {
      router.push("/MenuZonasSubZonas");
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      const [minRes, carRes] = await Promise.all([
        fetch(`/api/ministerios?iglesiaId=${iglesiaSelected.id}`),
        fetch(`/api/cargos`),
      ]);
      const [minData, carData] = await Promise.all([
        minRes.json(),
        carRes.json(),
      ]);
      if (isMounted) {
        setMinisterios(minData);
        setCargos(carData);
        setImgTimestamp(Date.now());
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [iglesiaSelected, router]);

  const handleAprobar = async (min: Ministerio) => {
    setAprobarLoading(true);
    try {
      const res = await fetch(`/api/ministerios/${min.id}/aprobar`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "No se pudo aprobar el candidato");
      }
      const data = await res.json();
      showSuccess(data.message || "Candidato aprobado como obrero");

      // Actualizar lista
      if (iglesiaSelected) {
        const minRes = await fetch(`/api/ministerios?iglesiaId=${iglesiaSelected.id}`);
        const minData = await minRes.json();
        setMinisterios(minData);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al aprobar candidato");
    } finally {
      setAprobarLoading(false);
      setAprobarModal({ open: false, ministerio: null });
    }
  };

  if (!iglesiaSelected) return null;

  const filteredMinisterios =
    activeFilter === "TODOS"
      ? ministerios
      : ministerios.filter((m) => m.tipo === activeFilter);

  const countMinisterios = ministerios.filter((m) => m.tipo === "MINISTERIO").length;
  const countCandidatos = ministerios.filter((m) => m.tipo === "CANDIDATO").length;

  return (
    <main className="min-h-screen flex flex-col">
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />

      {/* Menú superior */}
      <div className="w-full flex justify-center z-[1000] mb-4 sm:sticky sm:top-0 px-2 sm:px-0">
        <div className="mt-3 sm:mt-4 w-full sm:w-[95%] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 glass-card-solid px-4 sm:px-6 py-3">
          <button
            type="button"
            className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20"
            onClick={() => router.push("/MenuZonasSubZonas")}
            aria-label="Volver"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Volver
          </button>
          <div className="flex flex-row items-center gap-3 w-full">
            <span className="font-semibold text-lg text-slate-800 truncate">
              Iglesia {iglesiaSelected.nombre}
            </span>
            <button
              type="button"
              className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 ml-auto sm:ml-2"
              onClick={() => router.push("/MenuAgregarMinisterio")}
              aria-label="Agregar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Agregar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtro de tipo */}
      {!loading && ministerios.length > 0 && (
        <div className="flex justify-center mb-4 px-3">
          <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setActiveFilter("TODOS")}
              className={`px-4 py-2 text-xs font-semibold transition-all ${
                activeFilter === "TODOS"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todos ({ministerios.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("MINISTERIO")}
              className={`px-4 py-2 text-xs font-semibold transition-all ${
                activeFilter === "MINISTERIO"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Ministerios ({countMinisterios})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("CANDIDATO")}
              className={`px-4 py-2 text-xs font-semibold transition-all ${
                activeFilter === "CANDIDATO"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Candidatos ({countCandidatos})
            </button>
          </div>
        </div>
      )}

      {/* Cards de ministerios/candidatos */}
      <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto px-3 sm:px-0 mb-6">
        {loading ? (
          <LoaderPersonalizado>Cargando...</LoaderPersonalizado>
        ) : filteredMinisterios.length === 0 ? (
          <div className="text-center text-white/60 py-12 text-sm">
            {activeFilter === "TODOS"
              ? "No hay ministerios ni candidatos en esta iglesia"
              : activeFilter === "MINISTERIO"
              ? "No hay ministerios en esta iglesia"
              : "No hay candidatos en esta iglesia"}
          </div>
        ) : (
          [...filteredMinisterios]
            .sort((a, b) => {
              const titularA = (
                a.alias ? a.alias : `${a.nombre} ${a.apellidos || ""}`
              ).toLowerCase();
              const titularB = (
                b.alias ? b.alias : `${b.nombre} ${b.apellidos || ""}`
              ).toLowerCase();
              if (titularA < titularB) return -1;
              if (titularA > titularB) return 1;
              return 0;
            })
            .map((min) => {
              const titulo = min.alias
                ? min.alias
                : `${min.nombre} ${min.apellidos}`;
              const subtitulo = min.alias
                ? `${min.nombre} ${min.apellidos}`
                : null;
              const estado = min.estado_nombre;
              const aprob = min.aprob;
              const telefono = min.telefono;
              const email = min.email;
              const cargoIds = min.cargos
                ? min.cargos.split(",").map(Number)
                : [];
              const cargoTags = cargos.filter((c) => cargoIds.includes(c.id));

              // Calcular fase si es candidato
              const faseInfo =
                min.tipo === "CANDIDATO" && min.fecha_inicio
                  ? calcularFase(min.fecha_inicio)
                  : null;

              const isCandidato = min.tipo === "CANDIDATO";
              const avatarGradient = isCandidato
                ? "from-blue-500 to-purple-600"
                : "from-blue-500 to-blue-700";

              return (
                <div
                  key={min.id}
                  className={`glass-card-solid px-5 py-4 flex flex-col gap-2 animate-fadein ${
                    isCandidato ? "border-l-4 border-l-blue-400" : ""
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:text-left sm:gap-4 w-full">
                    {/* Avatar y nombre */}
                    <div className="flex flex-col items-center sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-xl font-bold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-transform hover:scale-105`}
                        title="Ver avatar"
                        onClick={() =>
                          setAvatarModal({
                            open: true,
                            letra: titulo[0],
                            ministerioId: min.has_imagen ? min.id : null,
                          })
                        }
                        style={{ cursor: "zoom-in" }}
                      >
                        {min.has_imagen ? (
                          <Image
                            src={`/api/ministerios/${min.id}/imagen?t=${imgTimestamp}`}
                            alt={titulo}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          titulo[0]
                        )}
                      </button>
                      <div className="flex flex-col items-center sm:items-start flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-slate-800 truncate">
                            {titulo}
                          </span>
                          {isCandidato && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                              Candidato
                            </span>
                          )}
                        </div>
                        {subtitulo && (
                          <span className="text-slate-500 text-sm truncate">
                            {subtitulo}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Código / Fase */}
                    <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto sm:ml-auto">
                      {min.codigo ? (
                        <>
                          <span className="text-xs text-slate-400 uppercase tracking-wider">Código</span>
                          <span className="font-mono text-base text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                            {min.codigo}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin código</span>
                      )}
                      {/* Botones solo en sm+ */}
                      <div className="hidden sm:flex flex-row gap-2 w-full sm:w-auto justify-end items-end">
                        {isCandidato && faseInfo?.fase === "APTO_OBRERO" && (
                          <button
                            type="button"
                            className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 shadow-md text-sm"
                            title="Aprobar como obrero"
                            onClick={() => setAprobarModal({ open: true, ministerio: min })}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Aprobar
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-primary bg-amber-500 text-white hover:bg-amber-600 shadow-md text-sm"
                          title="Editar"
                          onClick={() => {
                            setMinisterioEditId(min.id);
                            router.push("/MenuEditarMinisterio");
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-primary bg-red-600 text-white hover:bg-red-700 shadow-md text-sm"
                          title="Eliminar"
                          onClick={() =>
                            setDeleteModal({ open: true, ministerio: min })
                          }
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso del candidato */}
                  {isCandidato && faseInfo && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${faseInfo.textColor} flex items-center gap-1.5`}>
                          {faseInfo.fase === "ENSAYISTA" && "🟡"}
                          {faseInfo.fase === "CANDIDATO_LOCAL" && "🔵"}
                          {faseInfo.fase === "CANDIDATO_NACIONAL" && "🟣"}
                          {faseInfo.fase === "APTO_OBRERO" && "🟢"}
                          {faseInfo.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {faseInfo.fase === "APTO_OBRERO"
                            ? "✅ Completado"
                            : `${formatDiasRestantes(faseInfo.diasRestantes)} restantes`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            faseInfo.fase === "ENSAYISTA"
                              ? "bg-amber-500"
                              : faseInfo.fase === "CANDIDATO_LOCAL"
                              ? "bg-blue-500"
                              : faseInfo.fase === "CANDIDATO_NACIONAL"
                              ? "bg-purple-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.round(faseInfo.progreso)}%` }}
                        />
                      </div>
                      {min.fecha_inicio && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Inicio: {new Date(min.fecha_inicio).toLocaleDateString("es-ES")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 items-center mt-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                      {estado}
                    </span>
                    {!isCandidato && aprob && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                        Desde: {aprob}
                      </span>
                    )}
                    {telefono && (
                      <a
                        href={`tel:${telefono}`}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-medium text-emerald-700 transition flex items-center gap-1 hover:bg-emerald-100"
                        title="Llamar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15l2.25-2.25a1.5 1.5 0 0 0 0-2.121l-3.75-3.75a1.5 1.5 0 0 0-2.121 0l-1.125 1.125a12.042 12.042 0 0 1-5.25-5.25l1.125-1.125a1.5 1.5 0 0 0 0-2.121l-3.75-3.75a1.5 1.5 0 0 0-2.121 0L2.25 6.75z" />
                        </svg>
                        {telefono}
                      </a>
                    )}
                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="px-2.5 py-1 rounded-lg bg-orange-50 text-xs font-medium text-orange-700 transition flex items-center gap-1 hover:bg-orange-100"
                        title="Enviar email"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-.659 1.591l-7.091 7.091a2.25 2.25 0 0 1-3.182 0L2.909 8.584A2.25 2.25 0 0 1 2.25 6.993V6.75" />
                        </svg>
                        {email}
                      </a>
                    )}
                    {cargoTags.map((cargo) => (
                      <span
                        key={cargo.id}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-medium text-blue-700"
                      >
                        {cargo.cargo}
                      </span>
                    ))}
                    {isCandidato && min.notas && (
                      <span className="px-2.5 py-1 rounded-lg bg-yellow-50 text-xs font-medium text-yellow-700" title={min.notas}>
                        📝 {min.notas.length > 40 ? min.notas.slice(0, 40) + "..." : min.notas}
                      </span>
                    )}
                  </div>

                  {/* Botones en móvil */}
                  <div className="flex sm:hidden flex-row gap-2 w-full mt-2">
                    {isCandidato && faseInfo?.fase === "APTO_OBRERO" && (
                      <button
                        type="button"
                        className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 shadow-md w-full text-sm"
                        title="Aprobar como obrero"
                        onClick={() => setAprobarModal({ open: true, ministerio: min })}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Aprobar
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary bg-amber-500 text-white hover:bg-amber-600 shadow-md w-1/2 text-sm"
                      title="Editar"
                      onClick={() => {
                        setMinisterioEditId(min.id);
                        router.push("/MenuEditarMinisterio");
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-primary bg-red-600 text-white hover:bg-red-700 shadow-md w-1/2 text-sm"
                      title="Eliminar"
                      onClick={() =>
                        setDeleteModal({ open: true, ministerio: min })
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Modal de avatar */}
      {avatarModal.open && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setAvatarModal({ open: false, letra: null, ministerioId: null })}
        >
          <div
            className="flex flex-col items-center animate-fadein"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-8xl font-bold text-white shadow-2xl ring-4 ring-white/20">
              {avatarModal.ministerioId ? (
                <Image
                  src={`/api/ministerios/${avatarModal.ministerioId}/imagen?t=${imgTimestamp}`}
                  alt="Foto"
                  width={320}
                  height={320}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                avatarModal.letra
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminar */}
      {deleteModal.open && deleteModal.ministerio && (
        <div
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setDeleteModal({ open: false, ministerio: null })}
        >
          <div
            className={`glass-card-solid p-8 max-w-sm w-full flex flex-col gap-6 transition-all duration-500 relative animate-fadein ${
              deleteExplode
                ? "ring-4 ring-red-500 shadow-[0_0_40px_20px_rgba(220,38,38,0.3)]"
                : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold text-slate-800 text-center">
              ¿Está seguro que desea eliminar a{" "}
              <span className="font-bold text-red-600">
                {deleteModal.ministerio.nombre}{" "}
                {deleteModal.ministerio.apellidos}
              </span>
              ?
            </div>
            <div className="text-sm text-slate-500 text-center">
              Si lo hace se eliminará permanentemente.
            </div>
            <div className="flex gap-3 justify-center mt-2">
              <button
                className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-md"
                onClick={() => {
                  setDeleteModal({ open: false, ministerio: null });
                  setDeleteExplode(false);
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary bg-red-600 text-white hover:bg-red-700 shadow-md"
                onClick={async () => {
                  setDeleteExplode(true);
                  setTimeout(async () => {
                    if (!deleteModal.ministerio) return;
                    try {
                      await fetch(
                        `/api/ministerios/${deleteModal.ministerio.id}`,
                        { method: "DELETE" }
                      );
                      setMinisterios((prev) =>
                        prev.filter((m) => m.id !== deleteModal.ministerio!.id)
                      );
                    } catch (error) {
                      console.error("Error eliminando:", error);
                      showError("Error eliminando el registro");
                    }
                    setDeleteModal({ open: false, ministerio: null });
                    setDeleteExplode(false);
                  }, 500);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de aprobar candidato */}
      {aprobarModal.open && aprobarModal.ministerio && (
        <div
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setAprobarModal({ open: false, ministerio: null })}
        >
          <div
            className="glass-card-solid p-8 max-w-sm w-full flex flex-col gap-6 animate-fadein"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-lg font-semibold text-slate-800">
                ¿Aprobar como Obrero?
              </div>
              <p className="text-sm text-slate-500 mt-2">
                <span className="font-bold text-emerald-600">
                  {aprobarModal.ministerio.nombre}{" "}
                  {aprobarModal.ministerio.apellidos}
                </span>{" "}
                será aprobado como obrero. Se le asignará un código de ministerio automáticamente y el cargo de Obrero.
              </p>
            </div>
            <div className="flex gap-3 justify-center mt-2">
              <button
                className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-md"
                onClick={() => setAprobarModal({ open: false, ministerio: null })}
                disabled={aprobarLoading}
              >
                Cancelar
              </button>
              <button
                className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                onClick={() => handleAprobar(aprobarModal.ministerio!)}
                disabled={aprobarLoading}
              >
                {aprobarLoading ? "Aprobando..." : "Aprobar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
