"use client";

import React, { useEffect, useState } from "react";
import LoaderPersonalizado from "../components/LoaderPersonalizado";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";
import type { Ministerio, Cargo } from "@/types/ministerios";

export default function MenuMinisterios() {
  const router = useRouter();
  const iglesiaSelected = useZonasStore((s) => s.iglesiaSelected);
  const setMinisterioEditId = useZonasStore((s) => s.setMinisterioEditId);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [avatarModal, setAvatarModal] = useState<{
    open: boolean;
    letra: string | null;
  }>({ open: false, letra: null });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    ministerio: Ministerio | null;
  }>({ open: false, ministerio: null });
  const [loading, setLoading] = useState(true);
  const [deleteExplode, setDeleteExplode] = useState(false);

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
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [iglesiaSelected, router]);

  if (!iglesiaSelected) return null;

  return (
    <main className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-blue-900 via-white to-blue-400">
      {/* Menú superior */}
      <div className="w-full flex justify-center z-[1000] mb-4 sm:sticky sm:top-0">
        <div className="mt-4 w-[95%] flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8 rounded-2xl border border-gray-200 bg-white/90 backdrop-blur px-6 py-2 shadow-sm ">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white font-semibold text-sm shadow hover:bg-gray-900 transition border border-black cursor-pointer"
            onClick={() => router.push("/MenuZonasSubZonas")}
            aria-label="Volver"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Volver
          </button>
          <div className="flex flex-row items-center gap-2 w-full">
            <span className="font-semibold text-lg text-gray-900">
              Iglesia {iglesiaSelected.nombre}
            </span>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold text-sm shadow hover:bg-green-700 transition ml-2 cursor-pointer"
              onClick={() => router.push("/MenuAgregarMinisterio")}
              aria-label="Agregar ministerio"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Agregar ministerio
            </button>
          </div>
        </div>
      </div>
      {/* Cards de ministerios */}
      <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto px-2 sm:px-0 mb-4">
        {loading ? (
          <LoaderPersonalizado>Cargando ministerios...</LoaderPersonalizado>
        ) : ministerios.length === 0 ? (
          <div className="text-center text-gray-400">
            No hay ministerios en esta iglesia
          </div>
        ) : (
          [...ministerios]
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
              return (
                <div
                  key={min.id}
                  className="bg-white/90 border border-gray-200 rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-2"
                >
                  <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:text-left sm:gap-4 w-full">
                    {/* Avatar y nombre */}
                    <div className="flex flex-col items-center sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        title="Ver avatar"
                        onClick={() =>
                          setAvatarModal({ open: true, letra: titulo[0] })
                        }
                        style={{ cursor: "zoom-in" }}
                      >
                        {titulo[0]}
                      </button>
                      <div className="flex flex-col items-center sm:items-start flex-1 min-w-0">
                        <span className="font-semibold text-lg text-gray-900 truncate">
                          {titulo}
                        </span>
                        {subtitulo && (
                          <span className="text-gray-500 text-sm truncate">
                            {subtitulo}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Código */}
                    <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto sm:ml-auto">
                      <span className="text-xs text-gray-500">Código</span>
                      <span className="font-mono text-base text-gray-800">
                        {min.codigo}
                      </span>
                      {/* Botones solo en sm+ */}
                      <div className="hidden sm:flex flex-row gap-2 w-full sm:w-auto justify-end items-end">
                        <button
                          type="button"
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-400 text-white font-semibold text-sm shadow transition cursor-pointer w-auto justify-center"
                          title="Editar ministerio"
                          onClick={() => {
                            setMinisterioEditId(min.id);
                            router.push("/MenuEditarMinisterio");
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z"
                            />
                          </svg>
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm shadow transition cursor-pointer w-auto justify-center"
                          title="Eliminar ministerio"
                          onClick={() =>
                            setDeleteModal({ open: true, ministerio: min })
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <span className="px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-700 border border-gray-200">
                      {estado}
                    </span>
                    <span className="px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-700 border border-gray-200">
                      Desde: {aprob}
                    </span>
                    {telefono && (
                      <a
                        href={`tel:${telefono}`}
                        className="px-2 py-1 rounded bg-green-100 text-xs font-medium text-green-700 border border-green-200 transition flex items-center gap-1"
                        title="Llamar"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 inline-block mr-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 6.75c0 8.284 6.716 15 15 15l2.25-2.25a1.5 1.5 0 0 0 0-2.121l-3.75-3.75a1.5 1.5 0 0 0-2.121 0l-1.125 1.125a12.042 12.042 0 0 1-5.25-5.25l1.125-1.125a1.5 1.5 0 0 0 0-2.121l-3.75-3.75a1.5 1.5 0 0 0-2.121 0L2.25 6.75z"
                          />
                        </svg>
                        {telefono}
                      </a>
                    )}
                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="px-2 py-1 rounded bg-orange-100 text-xs font-medium text-orange-700 border border-orange-200 transition flex items-center gap-1"
                        title="Enviar email"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 inline-block mr-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-.659 1.591l-7.091 7.091a2.25 2.25 0 0 1-3.182 0L2.909 8.584A2.25 2.25 0 0 1 2.25 6.993V6.75"
                          />
                        </svg>
                        {email}
                      </a>
                    )}
                    {cargoTags.map((cargo) => (
                      <span
                        key={cargo.id}
                        className="px-2 py-1 rounded bg-gray-300 text-xs font-medium text-gray-700 border border-gray-300"
                      >
                        {cargo.cargo}
                      </span>
                    ))}
                  </div>
                  {/* Botones en móvil, debajo de los tags/cargos, al final de la card */}
                  <div className="flex sm:hidden flex-row gap-2 w-full mt-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-400 text-white font-semibold text-sm shadow transition cursor-pointer w-1/2 justify-center"
                      title="Editar ministerio"
                      onClick={() => {
                        setMinisterioEditId(min.id);
                        router.push("/MenuEditarMinisterio");
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm shadow transition cursor-pointer w-1/2 justify-center"
                      title="Eliminar ministerio"
                      onClick={() =>
                        setDeleteModal({ open: true, ministerio: min })
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
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
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadein"
          onClick={() => setAvatarModal({ open: false, letra: null })}
        >
          <div
            className="flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center text-7xl font-bold text-gray-700 shadow-2xl border-4 border-white">
              {avatarModal.letra}
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminar ministerio */}
      {deleteModal.open && deleteModal.ministerio && (
        <div
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadein"
          onClick={() => setDeleteModal({ open: false, ministerio: null })}
        >
          <div
            className={`bg-white rounded-2xl p-8 max-w-sm w-full flex flex-col gap-6 transition-all duration-500 relative ${
              deleteExplode
                ? "border-4 border-red-600 shadow-explode-red"
                : "shadow-xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold text-gray-900 text-center">
              ¿Está seguro que desea eliminar a{" "}
              <span className="font-bold">
                {deleteModal.ministerio.nombre}{" "}
                {deleteModal.ministerio.apellidos}
              </span>
              ?
            </div>
            <div className="text-sm text-gray-600 text-center">
              Si lo hace se eliminará permanentemente.
            </div>
            <div className="flex gap-4 justify-center mt-2">
              <button
                className="px-4 py-2 rounded-xl bg-black text-white font-semibold text-sm shadow hover:bg-gray-900 transition border border-black"
                onClick={() => {
                  setDeleteModal({ open: false, ministerio: null });
                  setDeleteExplode(false);
                }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm shadow hover:bg-red-700 transition border border-red-600 cursor-pointer"
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
                      console.error("Error eliminando ministerio:", error);
                      alert("Error eliminando ministerio");
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
    </main>
  );
}
