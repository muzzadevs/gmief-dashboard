"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// GeoJSON pegado (coordenadas [lng, lat])
const CUSTOM_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-3.1064371688454457, 43.364815150207676],
          [-3.0631793043912126, 43.305294431581245],
          [-3.07177834028289, 43.247485514069524],
          [-3.0245646738353855, 43.22072186948668],
          [-3.216928564004945, 43.13876002458437],
          [-3.131179203715135, 43.11807643884248],
          [-3.167686714336014, 43.08502313595588],
          [-3.1342477328477116, 43.06549746473024],
          [-3.1731796350512127, 42.991806918260664],
          [-2.9454322941095654, 42.858476296901785],
          [-2.6680896506237843, 42.91518938903147],
          [-2.483938434199956, 43.02935995283107],
          [-2.429511962908464, 43.185002744562865],
          [-2.385838516031953, 43.26139744334185],
          [-2.4611483487152555, 43.34681538044799],
          [-2.5313868020238317, 43.36868554811798],
          [-2.6315487795024524, 43.397385062667695],
          [-2.6769538947570766, 43.41084578752859],
          [-2.681874991037091, 43.37631951161748],
          [-2.697961238996953, 43.415663675737676],
          [-2.7448445651324676, 43.429183235687276],
          [-2.7548266961887578, 43.45148868684947],
          [-2.803928996283105, 43.42954183843065],
          [-2.8165772246207155, 43.43424778075672],
          [-2.9446068667113536, 43.43424778075672],
          [-2.950817433590032, 43.42297229985783],
          [-2.9441465931886626, 43.417825826902316],
          [-2.946654855928159, 43.409898550925305],
          [-2.9648958474974165, 43.415024316631815],
          [-2.990423154869859, 43.38998890971604],
          [-3.0355703621542034, 43.37210493857168],
          [-3.014684607520252, 43.33011146358223],
          [-2.980116368681138, 43.3074651525514],
          [-3.0350329810345045, 43.33592696901766],
          [-3.071274060408996, 43.353479349868934],
          [-3.1064371688454457, 43.364815150207676]
        ]]
      }
    }
  ]
};

export default function SpainMap() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const center: LatLngTuple = [40.463667, -3.74922];

  if (!mounted) return <div className="w-full h-full" />;

  return (
    <div className="relative w-full h-full">
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
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        {/* Etiquetas encima */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />

        {/* GeoJSON con evento click */}
        <GeoJSON
          data={CUSTOM_GEOJSON as any}
          style={() => ({
            color: "#ef4444",
            weight: 1,
            fillColor: "#ef4444",
            fillOpacity: 0.18
          })}
          onEachFeature={(_feature, layer) => {
            layer.on({
              click: () => alert("ZONA CANTABRIA")
            });
          }}
        />
      </MapContainer>
    </div>
  );
}
