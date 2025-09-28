"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type MarkerIglesia = {
  nombre: string;
  direccion: string;
  lat: number;
  lang: number;
};

const marcadores: MarkerIglesia[] = [
  {
    nombre: "Irún",
    lat: 43.335131,
    lang: -1.804054,
    direccion: "Edificio Velasco 112, Irun, Gipuzkoa, 20303",
  },
  {
    nombre: "Errenteria",
    lat: 43.3150168,
    lang: -1.8992856,
    direccion: "C/ Sonsorena s/n, Errenteria, Gipuzkoa, 20100",
  },
  {
    nombre: "Erandio",
    lat: 43.3055981,
    lang: -2.9729697,
    direccion: "Rivera de Axpe, portal C1, Local 104, Erandio, Bizkaia, 48950",
  },
  {
    nombre: "El Maná",
    lat: 43.2703088,
    lang: -2.0502559,
    direccion:
      "Polígono Industrial Usurbil, Pabelon 18-20, Usurbil, Gipuzkoa, 20170",
  },
  {
    nombre: "Eibar",
    lat: 43.1810452,
    lang: -2.4850378654141867,
    direccion: "Avda. Otaola 20, Eibar, Gipuzkoa, 20600",
  },
  {
    nombre: "Cueto",
    lat: 43.4618932,
    lang: -3.8100255,
    direccion: "C/ Hermanos Tonety s/n, Santander, Cantabria, 39012",
  },
  {
    nombre: "Cazoña Alta",
    lat: 43.4575099,
    lang: -3.8452191,
    direccion: "C/ Cardenal Herrera Oria 47, Santander, Cantabria, 39011",
  },
  {
    nombre: "Cazoña",
    lat: 43.449827184,
    lang: -3.853870343,
    direccion: "Santander, Cantabria, 39011",
  },
  {
    nombre: "Casa del alfarero",
    lat: 43.2459197,
    lang: -2.9884396,
    direccion: "C/ Perxeta 17, Alonsotegi, Bizkaia, 48810",
  },
  {
    nombre: "Casa de salvación",
    lat: 43.238815949999996,
    lang: -2.87765705,
    direccion: "Avda. Cervantes 57, Basauri, Bizkaia, 48970",
  },
  {
    nombre: "Casa de Dios",
    lat: 43.3445267,
    lang: -4.0576079,
    direccion: "Avda. Palencia 26, Torrelavega, Cantabria, 39300",
  },
  {
    nombre: "Bilbao",
    lat: 43.2542771,
    lang: -2.9280874,
    direccion: "C/ Olano 12, Bilbao, Bizkaia, 48003",
  },
  {
    nombre: "Bethèl",
    lat: 43.3025649,
    lang: -1.9492848,
    direccion: "Paseo Ubarburu 15, Donostia-SS, Gipuzkoa, 20014",
  },
  {
    nombre: "Betania",
    lat: 43.314798,
    lang: -1.974583,
    direccion: "C/ Virgen del Carmen 44, Donostia-SS, Gipuzkoa, 20012",
  },
  {
    nombre: "Bermeo",
    lat: 43.416741,
    lang: -2.7288,
    direccion: "Artike Bidea 3, Bermeo, Bizkaia, 48370",
  },
  {
    nombre: "Betesda",
    lat: 43.144527800000006,
    lang: -2.2037955488327494,
    direccion: "Gipuzkoa",
  },
  {
    nombre: "Barakaldo",
    lat: 43.29639,
    lang: -2.98813,
    direccion: "C/ Behurko Viejo 39, Barakaldo, Bizkaia, 48902",
  },
  {
    nombre: "Azpeitia",
    lat: 43.1838618,
    lang: -2.2657422,
    direccion: "Azpeitia, Gipuzkoa, 20730",
  },
  {
    nombre: "Albercicias",
    lat: 43.4618932,
    lang: -3.8100255,
    direccion: "Santander, Cantabria",
  },
  {
    nombre: "La Paz",
    lat: 43.4587497,
    lang: -3.8195946,
    direccion: "C/ Alta 70, Santander, Cantabria, 39008",
  },
  {
    nombre: "La Peña",
    lat: 43.2406323,
    lang: -2.9196095,
    direccion: "C/ Olatxu 1 Bajo, Bilbao, Bizkaia, 48003",
  },
  {
    nombre: "Las Primicias",
    lat: 43.303062,
    lang: -3.0392135,
    direccion: "Poligono Elgero Pabellon 20, Trápaga, Bizkaia, 48510",
  },
  {
    nombre: "Lasarte",
    lat: 43.2684642,
    lang: -2.0193784,
    direccion: "Lasarte, Gipuzkoa, 20160",
  },
  {
    nombre: "Llanes",
    lat: 43.41897258021747,
    lang: -4.7531728893953655,
    direccion: "C/ Manuel Sanchez Noriega, Llanes, Asturias, 33509",
  },
  {
    nombre: "Los Caños",
    lat: 43.25440995926844,
    lang: -2.9187619087509518,
    direccion: "Camino del Bosque 6, Bilbao, Bizkaia, 48004",
  },
  {
    nombre: "Lutxana",
    lat: 43.29401335,
    lang: -3.0129957650357913,
    direccion:
      "Poligono El Juncal 25, 3º, Pta. 18 A-B, Trápaga, Bizkaia, 48510",
  },
  {
    nombre: "Muriedas",
    lat: 43.4618932,
    lang: -3.8100255,
    direccion: "Santander, Cantabria",
  },
  {
    nombre: "Nuevo Amanecer",
    lat: 43.2332639,
    lang: -2.8453385,
    direccion:
      "Polig. Irubide; C/ Ibaizabal, Pabellón 2B, Galdakao, Bizkaia, 48960",
  },
  {
    nombre: "Nueva Galilea",
    lat: 43.3949637,
    lang: -3.449786,
    direccion: "C/ Almirante Forntán 22, Colindres, Cantabria, 39750",
  },
  {
    nombre: "Nueva Jerusalen",
    lat: 43.3442924,
    lang: -4.0355054,
    direccion: "Avda. Bilbao 64, Torrelavega, Cantabria, 39300",
  },
  {
    nombre: "Nueva Santoña",
    lat: 43.3487303,
    lang: -4.0515082,
    direccion: "Torrelavega, Cantabria",
  },
  {
    nombre: "Otxarkoaga",
    lat: 43.258534,
    lang: -2.937123,
    direccion: "C/ Julian Gayarre 57, Bajo, Bilbao, Bizkaia, 40004",
  },
  {
    nombre: "Rios de Vida",
    lat: 43.252192758886075,
    lang: -2.9422224013646887,
    direccion: "C/ Dctor. Diaz Emparanza, Bilbao, Bizkaia, 48002",
  },
  {
    nombre: "Reinosa",
    lat: 43.004002458507976,
    lang: -4.138928988543979,
    direccion: "Calle Concha Espina s/n, Reinosa, Cantabria, 39200",
  },
  {
    nombre: "San Miguel",
    lat: 43.235372,
    lang: -2.8920543,
    direccion: "Basauri, Bizkaia",
  },
  {
    nombre: "Santander",
    lat: 43.462335,
    lang: -3.837829,
    direccion: "C/Albericia 11, 2º, Santander, Cantabria, 39011",
  },
  {
    nombre: "Santander Centro",
    lat: 43.4587497,
    lang: -3.8195946,
    direccion: "C/ Alta 70, Santander, Cantabria, 39008",
  },
  {
    nombre: "Santoña",
    lat: 43.44580454029269,
    lang: -3.458756900228714,
    direccion: "C/ Baldomero Villegas 11, 4 C, Santoña, Cantabria, 39740",
  },
  {
    nombre: "Santurtzi",
    lat: 43.3287527,
    lang: -3.0318766,
    direccion: "C/ Trasera de Itsale 12 Bjo, Santurtzi, Bizkaia, 48980",
  },
  {
    nombre: "Shèkinah",
    lat: 43.238932,
    lang: -2.877811,
    direccion: "Polígono Avda. Cervantes 11, Basauri, Bizkaia, 48970",
  },
  {
    nombre: "Sestao",
    lat: 43.29401335,
    lang: -3.0129957650357913,
    direccion: "Poligono El Juncal 31, Trápaga, Bizkaia, 48510",
  },
  {
    nombre: "Torrelavega",
    lat: 43.3388185,
    lang: -4.0468165,
    direccion: "Avda. Joaquin Fdz. Vallejo 262, Torrelavega, Cantabria, 39300",
  },
  {
    nombre: "Vida Nueva",
    lat: 43.2503165,
    lang: -2.9399928,
    direccion:
      "Larraskitu 35, esquina Dctr. Diaz Emparanza, Bilbao, Bizkaia, 48002",
  },
  {
    nombre: "Zorroza",
    lat: 43.286863,
    lang: -2.992336,
    direccion: "C/ Kareaga, Pabellón 5, Barakaldo, Bizkaia, 48903",
  },
  {
    nombre: "Zumárraga",
    lat: 43.0859968,
    lang: -2.3140925,
    direccion: "Urdanete Hiribidea 14, Zumárraga, Gipuzkoa, 20700",
  },
];

export default function SpainMap() {
  const center: LatLngTuple = [40.463667, -3.74922];

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
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        {/* Etiquetas encima */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />

        {/* Marcadores de iglesias */}
        {marcadores.map((iglesia, idx) => (
          <Marker
            key={iglesia.nombre + idx}
            position={[iglesia.lat, iglesia.lang]}
            icon={L.icon({
              iconUrl:
                "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
              iconSize: [15, 25],
              iconAnchor: [7.5, 25],
              popupAnchor: [1, -21],
              shadowUrl:
                "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
              shadowSize: [25, 25],
            })}
          >
            <Popup>
              <div className="text-sm">
                <div
                  className="font-bold mb-1"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
                >
                  {iglesia.nombre}
                </div>
                <div
                  className="mb-2"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {iglesia.direccion}
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    iglesia.direccion
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
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
// import type { LatLngTuple, Layer } from "leaflet";
// import type { FeatureCollection, Feature } from "geojson";
// import "leaflet/dist/leaflet.css";

// // GeoJSON pegado (coordenadas [lng, lat])
// const CUSTOM_GEOJSON: FeatureCollection = {
//   type: "FeatureCollection",
//   features: [
//     {
//       type: "Feature",
//       properties: {},
//       geometry: {
//         type: "Polygon",
//         coordinates: [[
//           [-3.1064371688454457, 43.364815150207676],
//           [-3.0631793043912126, 43.305294431581245],
//           [-3.07177834028289, 43.247485514069524],
//           [-3.0245646738353855, 43.22072186948668],
//           [-3.216928564004945, 43.13876002458437],
//           [-3.131179203715135, 43.11807643884248],
//           [-3.167686714336014, 43.08502313595588],
//           [-3.1342477328477116, 43.06549746473024],
//           [-3.1731796350512127, 42.991806918260664],
//           [-2.9454322941095654, 42.858476296901785],
//           [-2.6680896506237843, 42.91518938903147],
//           [-2.483938434199956, 43.02935995283107],
//           [-2.429511962908464, 43.185002744562865],
//           [-2.385838516031953, 43.26139744334185],
//           [-2.4611483487152555, 43.34681538044799],
//           [-2.5313868020238317, 43.36868554811798],
//           [-2.6315487795024524, 43.397385062667695],
//           [-2.6769538947570766, 43.41084578752859],
//           [-2.681874991037091, 43.37631951161748],
//           [-2.697961238996953, 43.415663675737676],
//           [-2.7448445651324676, 43.429183235687276],
//           [-2.7548266961887578, 43.45148868684947],
//           [-2.803928996283105, 43.42954183843065],
//           [-2.8165772246207155, 43.43424778075672],
//           [-2.9446068667113536, 43.43424778075672],
//           [-2.950817433590032, 43.42297229985783],
//           [-2.9441465931886626, 43.417825826902316],
//           [-2.946654855928159, 43.409898550925305],
//           [-2.9648958474974165, 43.415024316631815],
//           [-2.990423154869859, 43.38998890971604],
//           [-3.0355703621542034, 43.37210493857168],
//           [-3.014684607520252, 43.33011146358223],
//           [-2.980116368681138, 43.3074651525514],
//           [-3.0350329810345045, 43.33592696901766],
//           [-3.071274060408996, 43.353479349868934],
//           [-3.1064371688454457, 43.364815150207676]
//         ]]
//       }
//     }
//   ]
// };

// export default function SpainMap() {
//   const [mounted, setMounted] = useState(false);
//   useEffect(() => setMounted(true), []);

//   const center: LatLngTuple = [40.463667, -3.74922];

//   if (!mounted) return <div className="w-full h-full" />;

//   return (
//     <div className="relative w-full h-full">
//       <MapContainer
//         center={center}
//         zoom={6}
//         className="w-full h-full"
//         zoomControl={false}
//         attributionControl={false}
//       >
//         {/* Base gris sin etiquetas */}
//         <TileLayer
//           url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
//           attribution='&copy; OpenStreetMap contributors &copy; CARTO'
//         />
//         {/* Etiquetas encima */}
//         <TileLayer
//           url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
//           attribution='&copy; OpenStreetMap contributors &copy; CARTO'
//         />

//         {/* GeoJSON con evento click */}
//         <GeoJSON
//           data={CUSTOM_GEOJSON}
//           style={() => ({
//             color: "#ef4444",
//             weight: 1,
//             fillColor: "#ef4444",
//             fillOpacity: 0.18
//           })}
//           onEachFeature={(_feature: Feature, layer: Layer) => {
//             layer.on({
//               click: () => alert("ZONA CANTABRIA")
//             });
//           }}
//         />
//       </MapContainer>
//     </div>
//   );
// }
