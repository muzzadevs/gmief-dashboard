"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type IglesiaMapa = {
  id: number;
  nombre: string;
  direccion: string | null;
  municipio: string | null;
  provincia: string | null;
  cp: number | null;
  latitud: number;
  longitud: number;
  zona: { nombre: string } | null;
  subzona: { nombre: string } | null;
};

function buildFullAddress(iglesia: IglesiaMapa): string {
  const parts: string[] = [];
  if (iglesia.direccion) parts.push(iglesia.direccion);
  if (iglesia.municipio) parts.push(iglesia.municipio);
  if (iglesia.provincia) parts.push(iglesia.provincia);
  if (iglesia.cp) parts.push(String(iglesia.cp));
  return parts.join(", ");
}

const markerIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [15, 25],
  iconAnchor: [7.5, 25],
  popupAnchor: [1, -21],
  shadowUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [25, 25],
});

interface SpainMapProps {
  onLoadingChange?: (loading: boolean) => void;
}

export default function SpainMap({ onLoadingChange }: SpainMapProps) {
  const [iglesias, setIglesias] = useState<IglesiaMapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const center: LatLngTuple = [40.463667, -3.74922];

  const fetchIglesias = useCallback(async () => {
    try {
      setLoading(true);
      onLoadingChange?.(true);
      const res = await fetch("/api/iglesias/mapa");
      if (!res.ok) throw new Error("Error al cargar las iglesias");
      const data = await res.json();
      if (data.ok && data.data) {
        setIglesias(data.data);
      } else {
        throw new Error(data.message || "Error desconocido");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      console.error("Error fetching iglesias para mapa:", err);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange]);

  useEffect(() => {
    fetchIglesias();
  }, [fetchIglesias]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center p-6">
          <div className="text-red-400 text-lg font-semibold mb-2">
            Error al cargar el mapa
          </div>
          <div className="text-white/60 text-sm mb-4">{error}</div>
          <button
            onClick={fetchIglesias}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loader overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 animate-spin"></div>
          </div>
          <span className="text-white/80 text-sm font-medium">
            Cargando iglesias en el mapa...
          </span>
          <span className="text-white/40 text-xs mt-1">
            Obteniendo datos de la base de datos
          </span>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={6}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        {/* Base gris sin etiquetas */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        {/* Etiquetas encima */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />

        {/* Marcadores de iglesias desde BDD */}
        {!loading &&
          iglesias.map((iglesia) => {
            const fullAddress = buildFullAddress(iglesia);
            return (
              <Marker
                key={iglesia.id}
                position={[iglesia.latitud, iglesia.longitud]}
                icon={markerIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <div
                      className="font-bold mb-1"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {iglesia.nombre}
                    </div>
                    <div
                      className="mb-2"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {fullAddress || "Sin dirección"}
                    </div>
                    {fullAddress && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          fullAddress
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 bg-black rounded hover:cursor-pointer transition"
                        style={{
                          color: "#fff",
                          fontFamily: "Poppins, sans-serif",
                          fontWeight: 500,
                          textDecoration: "none",
                          fontSize: "1em",
                        }}
                      >
                        Abrir en maps
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Contador de iglesias */}
      {!loading && iglesias.length > 0 && (
        <div className="fixed bottom-3 right-3 z-[1000] bg-slate-800/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg">
          📍 {iglesias.length} iglesias en el mapa
        </div>
      )}
    </div>
  );
}
