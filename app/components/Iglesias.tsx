import { useEffect } from "react";
import { FaUsers } from "react-icons/fa";
import { useRouter } from "next/navigation";
import type { Iglesia } from "@/types/subzonas";
import { useZonasStore } from "@/store/zonasStore";

export default function Iglesias() {
  const zonaSelected = useZonasStore((s) => s.zonaSelected);
  const subzonaSelected = useZonasStore((s) => s.subzonaSelected);
  const iglesias = useZonasStore((s) => s.iglesias);
  const fetchIglesias = useZonasStore((s) => s.fetchIglesias);
  const setIglesiaSelected = useZonasStore((s) => s.setIglesiaSelected);
  const router = useRouter();

  useEffect(() => {
    if (zonaSelected) {
      fetchIglesias(zonaSelected.id, subzonaSelected?.id || null);
    }
  }, [zonaSelected, subzonaSelected, fetchIglesias]);

  if (!zonaSelected) return null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
      {iglesias.map((iglesia: Iglesia) => {
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
        return (
          <div
            key={iglesia.id}
            className="bg-white/90 border border-gray-200 rounded-2xl shadow-sm px-5 py-4 flex flex-col"
          >
            <div className="flex flex-row items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base text-gray-900 truncate">
                  {iglesia.nombre || "sin información"}
                </div>
                {haySinInfo ? (
                  <div className="text-gray-700 text-sm leading-snug">
                    Sin información
                  </div>
                ) : (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${direccionMaps}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 no-underline text-sm leading-snug transition flex items-center gap-2 cursor-pointer hover:underline truncate"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-blue-700"
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
              <button
                type="button"
                className="px-4 py-2 rounded-xl cursor-pointer"
                style={{
                  background: "#022c55",
                  color: "white",
                  border: "none",
                }}
                onClick={() => {
                  setIglesiaSelected(iglesia);
                  router.push("/MenuMinisterios");
                }}
                aria-label="Gestionar ministerios"
              >
                <span className="flex items-center gap-2">
                  <FaUsers className="w-5 h-5" />
                  <span className="hidden sm:inline">Ministerios</span>
                </span>
              </button>
            </div>
          </div>
        );
      })}
      {iglesias.length === 0 && (
        <div className="text-center text-gray-400">
          No hay iglesias para mostrar
        </div>
      )}
    </div>
  );
}
