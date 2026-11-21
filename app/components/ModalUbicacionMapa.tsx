"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

interface ModalUbicacionMapaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (latitud: number, longitud: number) => void;
  latitud: number | null;
  longitud: number | null;
  nombreIglesia: string;
  saving?: boolean;
}

function FlyToInitial({
  position,
  hasPosition,
}: {
  position: LatLngTuple;
  hasPosition: boolean;
}) {
  const map = useMap();
  const flown = useRef(false);

  useEffect(() => {
    if (hasPosition && !flown.current) {
      flown.current = true;
      map.flyTo(position, 17, { duration: 0.8 });
    }
  }, [map, position, hasPosition]);

  return null;
}

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function ModalUbicacionMapa({
  isOpen,
  onClose,
  onSave,
  latitud,
  longitud,
  nombreIglesia,
  saving = false,
}: ModalUbicacionMapaProps) {
  const hasInitialPosition = latitud !== null && longitud !== null;
  const spainCenter: LatLngTuple = [40.463667, -3.74922];

  const [markerPosition, setMarkerPosition] = useState<LatLngTuple | null>(
    hasInitialPosition ? [latitud, longitud] : null
  );
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (latitud !== null && longitud !== null) {
        setMarkerPosition([latitud, longitud]);
      } else {
        setMarkerPosition(null);
      }
      setMapKey((k) => k + 1);
    }
  }, [isOpen, latitud, longitud]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
  }, []);

  const handleMarkerDragEnd = useCallback((e: L.DragEndEvent) => {
    const marker = e.target as L.Marker;
    const pos = marker.getLatLng();
    setMarkerPosition([pos.lat, pos.lng]);
  }, []);

  const handleSave = () => {
    if (markerPosition) {
      onSave(markerPosition[0], markerPosition[1]);
    }
  };

  const handleRemoveLocation = () => {
    setMarkerPosition(null);
  };

  if (!isOpen) return null;

  const initialCenter: LatLngTuple = hasInitialPosition
    ? [latitud, longitud]
    : spainCenter;
  const initialZoom = hasInitialPosition ? 17 : 6;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-[95vw] h-[90vh] max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadein">
        <ModalHeader
          nombreIglesia={nombreIglesia}
          onClose={onClose}
        />
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs sm:text-sm flex-shrink-0">
          <span className="font-semibold">Instrucciones:</span> Haz clic en el
          mapa para colocar el marcador en la ubicación exacta de la iglesia.
          También puedes arrastrar el marcador para ajustar la posición.
        </div>
        <div className="flex-1 relative">
          <MapContainer
            key={mapKey}
            center={initialCenter}
            zoom={initialZoom}
            className="w-full h-full"
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              className="leaflet-map-gray-tiles"
              maxZoom={19}
            />
            <MapClickHandler onClick={handleMapClick} />
            <FlyToInitial
              position={initialCenter}
              hasPosition={hasInitialPosition}
            />
            {markerPosition && (
              <Marker
                position={markerPosition}
                icon={markerIcon}
                draggable={true}
                eventHandlers={{ dragend: handleMarkerDragEnd }}
              />
            )}
          </MapContainer>
        </div>
        <ModalFooter
          markerPosition={markerPosition}
          saving={saving}
          onRemove={handleRemoveLocation}
          onCancel={onClose}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

function ModalHeader({
  nombreIglesia,
  onClose,
}: {
  nombreIglesia: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg">📍</span>
        <div className="min-w-0">
          <h3 className="font-bold text-sm sm:text-base truncate">
            Ubicación en el Mapa
          </h3>
          <p className="text-xs text-white/60 truncate">{nombreIglesia}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Cerrar"
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
  );
}


function ModalFooter({
  markerPosition,
  saving,
  onRemove,
  onCancel,
  onSave,
}: {
  markerPosition: LatLngTuple | null;
  saving: boolean;
  onRemove: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
      <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 min-w-0">
        {markerPosition ? (
          <>
            <span className="font-mono bg-white px-2 py-1 rounded border text-slate-700">
              Lat: {markerPosition[0].toFixed(6)}
            </span>
            <span className="font-mono bg-white px-2 py-1 rounded border text-slate-700">
              Lng: {markerPosition[1].toFixed(6)}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 text-xs underline flex-shrink-0"
              title="Quitar marcador"
            >
              Quitar
            </button>
          </>
        ) : (
          <span className="text-slate-400 italic">
            Haz clic en el mapa para colocar el marcador
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!markerPosition || saving}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-600/25 hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar ubicación"}
        </button>
      </div>
    </div>
  );
}

