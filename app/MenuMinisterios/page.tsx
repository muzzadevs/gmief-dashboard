"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";

import type { Ministerio, Cargo, Estado } from "@/types/ministerios";

export default function MenuMinisterios() {
  const router = useRouter();
  const iglesiaSelected = useZonasStore((s) => s.iglesiaSelected);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  // Estado para modal de avatar
  const [avatarModal, setAvatarModal] = useState<{
    open: boolean;
    letra: string | null;
  }>({ open: false, letra: null });

  useEffect(() => {
    if (!iglesiaSelected) {
      router.push("/MenuZonasSubZonas");
      return;
    }
    // Fetch ministerios, estados y cargos
    const fetchData = async () => {
      const [minRes, estRes, carRes] = await Promise.all([
        fetch(`/api/ministerios?iglesiaId=${iglesiaSelected.id}`),
        fetch(`/api/estados`),
        fetch(`/api/cargos`),
      ]);
      const [minData, estData, carData] = await Promise.all([
        minRes.json(),
        estRes.json(),
        carRes.json(),
      ]);
      setMinisterios(minData);
      setEstados(estData);
      setCargos(carData);
    };
    fetchData();
  }, [iglesiaSelected, router]);

  if (!iglesiaSelected) return null;

  return (
    <main
      className="min-h-screen max-h-screen flex flex-col font-sans bg-cover bg-center"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
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
      <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto px-2 sm:px-0">
        {ministerios.length === 0 ? (
          <div className="text-center text-gray-400">
            No hay ministerios en esta iglesia
          </div>
        ) : (
          ministerios.map((min) => {
            // Alias o nombre
            const titulo = min.alias
              ? min.alias
              : `${min.nombre} ${min.apellidos}`;
            // Si alias, debajo nombre+apellidos
            const subtitulo = min.alias
              ? `${min.nombre} ${min.apellidos}`
              : null;
            // Estado
            const estado = min.estado_nombre;
            // Año aprobación
            const aprob = min.aprob;
            // Teléfono y email
            const telefono = min.telefono;
            const email = min.email;
            // Cargos (ids separados por coma)
            const cargoIds = min.cargos
              ? min.cargos.split(",").map(Number)
              : [];
            const cargoTags = cargos.filter((c) => cargoIds.includes(c.id));
            return (
              <div
                key={min.id}
                className="bg-white/90 border border-gray-200 rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-2"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar genérico clickable */}
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
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-lg text-gray-900">
                      {titulo}
                    </span>
                    {subtitulo && (
                      <span className="text-gray-500 text-sm">{subtitulo}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">Código</span>
                    <span className="font-mono text-base text-gray-800">
                      {min.codigo}
                    </span>
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
                      className="px-2 py-1 rounded bg-blue-100 text-xs font-medium text-blue-700 border border-blue-200 hover:bg-blue-200 transition"
                      title="Llamar"
                    >
                      {telefono}
                    </a>
                  )}
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="px-2 py-1 rounded bg-green-100 text-xs font-medium text-green-700 border border-green-200 hover:bg-green-200 transition"
                      title="Enviar email"
                    >
                      {email}
                    </a>
                  )}
                  {cargoTags.map((cargo) => (
                    <span
                      key={cargo.id}
                      className="px-2 py-1 rounded bg-purple-100 text-xs font-medium text-purple-700 border border-purple-200"
                    >
                      {cargo.cargo}
                    </span>
                  ))}
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
    </main>
  );
}
