import React, { useEffect, useState } from "react";
import LoaderPersonalizado from "./LoaderPersonalizado";
import { FaUsers, FaEdit } from "react-icons/fa";
import { useRouter } from "next/navigation";
import type { Iglesia } from "@/types/subzonas";
import { useZonasStore } from "@/store/zonasStore";
import { searchStartsWith } from "@/lib/search";

interface Props {
  busqueda?: string;
}

type IglesiaStats = Record<number, { ministerios: number; candidatos: number }>;

export default function Iglesias({ busqueda = "" }: Props) {
  const zonaSelected = useZonasStore((s) => s.zonaSelected);
  const subzonaSelected = useZonasStore((s) => s.subzonaSelected);
  const iglesias = useZonasStore((s) => s.iglesias);
  const fetchIglesias = useZonasStore((s) => s.fetchIglesias);
  const setIglesiaSelected = useZonasStore((s) => s.setIglesiaSelected);
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = useState<IglesiaStats>({});

  useEffect(() => {
    let isMounted = true;
    if (zonaSelected) {
      setLoading(true);
      const subzonaId = subzonaSelected?.id || null;

      Promise.all([
        fetchIglesias(zonaSelected.id, subzonaId),
        fetch(
          `/api/iglesias/stats?zonaId=${zonaSelected.id}${subzonaId ? `&subzonaId=${subzonaId}` : ""}`
        )
          .then((res) => res.json())
          .then((json) => {
            if (json.ok && json.data) return json.data;
            return {};
          })
          .catch(() => ({})),
      ]).then(([, statsData]) => {
        if (isMounted) {
          setStats(statsData);
          setLoading(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [zonaSelected, subzonaSelected, fetchIglesias]);

  if (!zonaSelected) return null;

  const iglesiasFiltradas = (
    busqueda.trim().length > 0
      ? iglesias.filter((ig: Iglesia) =>
          searchStartsWith(ig.nombre, busqueda)
        )
      : iglesias
  )
    .slice()
    .sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    );

  if (loading) {
    return <LoaderPersonalizado>Cargando iglesias...</LoaderPersonalizado>;
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-7xl mx-auto">
      {iglesiasFiltradas.map((iglesia: Iglesia) => {
        const partes = [
          iglesia.direccion,
          iglesia.municipio,
          iglesia.provincia,
          iglesia.cp ? iglesia.cp : "",
        ];
        const haySinInfo = partes.some(
          (v) => v === null || v === "" || v === "NULL"
        );
        const direccion = haySinInfo
          ? "Sin información"
          : partes.filter((v) => v && v !== "0" && v !== "NULL").join(", ");
        const direccionMaps = encodeURIComponent(
          partes.filter((v) => v && v !== "0" && v !== "NULL").join(", ")
        );

        const iglesiaStats = stats[iglesia.id];
        const countMin = iglesiaStats?.ministerios ?? 0;
        const countCand = iglesiaStats?.candidatos ?? 0;

        return (
          <div
            key={iglesia.id}
            className="glass-card-solid px-5 py-4 flex flex-col animate-fadein"
          >
            <div className="flex flex-row items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-base text-slate-800 truncate">
                    {iglesia.nombre || "sin información"}
                  </span>
                  {/* Badges de ministerios y candidatos */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px]">
                    <span className="font-bold">{countMin}</span> {countMin === 1 ? "Obrero" : "Obreros"}
                  </span>
                  {countCand > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px]">
                      <span className="font-bold">{countCand}</span> {countCand === 1 ? "Candidato" : "Candidatos"}
                    </span>
                  )}
                </div>
                {haySinInfo ? (
                  <div className="text-slate-500 text-sm leading-snug">
                    Sin información
                  </div>
                ) : (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${direccionMaps}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 no-underline text-sm leading-snug transition flex items-center gap-1.5 cursor-pointer hover:underline truncate"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-blue-600 flex-shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 2.25c-4.556 0-8.25 3.364-8.25 7.5 0 5.25 7.5 12 8.25 12s8.25-6.75 8.25-12c0-4.136-3.694-7.5-8.25-7.5z"
                      />
                      <circle cx="12" cy="9.75" r="2.25" fill="currentColor" />
                    </svg>
                    {direccion}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  className="btn-primary bg-amber-500 text-white hover:bg-amber-600 shadow-md text-sm"
                  onClick={() => {
                    router.push(`/modulos/gestion-ministerios/editar-iglesia/${iglesia.id}`);
                  }}
                  aria-label="Editar iglesia"
                >
                  <FaEdit className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  type="button"
                  className="btn-primary bg-blue-700 text-white hover:bg-blue-800 shadow-md text-sm"
                  onClick={() => {
                    setIglesiaSelected(iglesia);
                    router.push("/modulos/gestion-ministerios/ministerios");
                  }}
                  aria-label="Gestionar ministerios"
                >
                  <FaUsers className="w-4 h-4" />
                  <span className="hidden sm:inline">Ministerios</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {iglesiasFiltradas.length === 0 && (
        <div className="text-center text-white/60 py-12 text-sm">
          No hay iglesias para mostrar
        </div>
      )}
    </div>
  );
}
