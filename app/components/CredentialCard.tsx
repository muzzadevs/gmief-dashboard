"use client";

import React from "react";
import Image from "next/image";

export type CredentialData = {
  nombre: string;
  apellidos: string | null;
  codigo: string | null;
  dni: string | null;
  nie: string | null;
  zona_nombre: string;
  zona_codigo: string;
  has_imagen: boolean;
  ministerio_id: number;
  iglesia_nombre: string;
  cargos: string[];
};

interface CredentialCardProps {
  data: CredentialData;
  side: "front" | "back";
  scale?: number;
}

function formatExpiryDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const NAVY = "#1a2d50";
const LABEL = "#7a8ca3";
const SEP = "#d0d8e2";

/* ═══════════════════════════════════════════
   FRENTE
   ═══════════════════════════════════════════ */
export function CredentialCardFront({ data, scale = 1 }: { data: CredentialData; scale?: number }) {
  const s = scale;
  const W = 540 * s;
  const H = 340 * s;
  const expiry = formatExpiryDate();
  const docId = data.dni || data.nie || "\u2014";
  const nombre = data.nombre;
  const apellidos = data.apellidos || "";

  return (
    <div style={{ width: W, height: H, borderRadius: 10 * s, overflow: "hidden", position: "relative", background: "#ffffff", fontFamily: "'Segoe UI', Arial, sans-serif", boxShadow: `0 ${2*s}px ${12*s}px rgba(0,0,0,0.18)`, display: "flex", flexDirection: "column" }}>

      {/* ── HEADER: título grande centrado ── */}
      <div style={{ textAlign: "center", paddingTop: 10 * s }}>
        <div style={{ fontSize: 18 * s, fontWeight: 800, color: NAVY, letterSpacing: 1 * s, lineHeight: 1.1 }}>
          IGLESIA EVANGÉLICA FILADELFIA
        </div>
        {/* CIF con líneas a los lados */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 * s, marginTop: 4 * s }}>
          <div style={{ flex: 1, maxWidth: 100 * s, height: 1, background: NAVY }} />
          <span style={{ fontSize: 7 * s, color: LABEL, fontWeight: 600, letterSpacing: 1 * s }}>CIF R480047J</span>
          <div style={{ flex: 1, maxWidth: 100 * s, height: 1, background: NAVY }} />
        </div>
      </div>

      {/* ── CUERPO: foto + datos ── */}
      <div style={{ flex: 1, display: "flex", padding: `${6*s}px ${14*s}px ${0}px`, gap: 14 * s, position: "relative" }}>
        {/* Foto grande */}
        <div style={{ width: 110 * s, height: 132 * s, borderRadius: 4 * s, overflow: "hidden", flexShrink: 0, background: "#e8ecf0", display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${SEP}` }}>
          {data.has_imagen ? (
            <Image src={`/api/ministerios/${data.ministerio_id}/imagen`} alt={nombre} width={Math.round(110*s)} height={Math.round(132*s)} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
          ) : (
            <span style={{ fontSize: 40 * s, fontWeight: 700, color: "#b0bec5" }}>{nombre[0]}</span>
          )}
        </div>

        {/* Columna de datos */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Nombre grande */}
          <div style={{ marginBottom: 6 * s }}>
            <div style={{ fontSize: 20 * s, fontWeight: 800, color: NAVY, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre.toUpperCase()}</div>
            <div style={{ fontSize: 13 * s, fontWeight: 700, color: NAVY, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apellidos.toUpperCase()}</div>
          </div>

          {/* DOCUMENTO */}
          <div style={{ marginBottom: 4 * s }}>
            <div style={{ fontSize: 6 * s, fontWeight: 700, color: LABEL, letterSpacing: 1 * s, textTransform: "uppercase" }}>Documento</div>
            <div style={{ fontSize: 12 * s, fontWeight: 700, color: "#1e293b", letterSpacing: 0.5 * s }}>{docId}</div>
            <div style={{ height: 1, background: SEP, marginTop: 3 * s }} />
          </div>

          {/* N.º DE CREDENCIAL */}
          <div style={{ marginBottom: 4 * s }}>
            <div style={{ fontSize: 6 * s, fontWeight: 700, color: LABEL, letterSpacing: 1 * s, textTransform: "uppercase" }}>N.º de Credencial</div>
            <div style={{ fontSize: 12 * s, fontWeight: 800, color: "#1e293b", fontFamily: "'Courier New', monospace" }}>{data.codigo || "\u2014"}</div>
            <div style={{ height: 1, background: SEP, marginTop: 3 * s }} />
          </div>

          {/* VÁLIDA HASTA */}
          <div>
            <div style={{ fontSize: 6 * s, fontWeight: 700, color: LABEL, letterSpacing: 1 * s, textTransform: "uppercase" }}>Válida hasta</div>
            <div style={{ fontSize: 12 * s, fontWeight: 700, color: "#1e293b" }}>{expiry}</div>
            <div style={{ height: 1, background: SEP, marginTop: 3 * s }} />
          </div>
        </div>

        {/* Mapa de España marca de agua */}
        <div style={{ position: "absolute", right: 6 * s, top: 2 * s, width: "30%", opacity: 0.08, pointerEvents: "none" }}>
          <Image src="/spainMap.png" alt="" width={200} height={200} style={{ width: "100%", height: "auto" }} unoptimized />
        </div>
      </div>

      {/* ── BARRA AZUL: Ministro de Culto + cita ── */}
      <div style={{ background: NAVY, padding: `${7*s}px ${14*s}px`, display: "flex", alignItems: "center", gap: 8 * s }}>
        <div style={{ height: 28 * s, flexShrink: 0 }}>
          <Image src="/TEMPLOGOIEF.png" alt="IEF" width={Math.round(70*s)} height={Math.round(28*s)} style={{ height: 28 * s, width: "auto", objectFit: "contain", filter: "brightness(2)" }} unoptimized />
        </div>
        <div style={{ width: 1, height: 22 * s, background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12 * s, fontWeight: 800, color: "#ffffff", letterSpacing: 1.5 * s }}>MINISTRO DE CULTO</div>
          <div style={{ fontSize: 6 * s, color: "rgba(255,255,255,0.65)", fontStyle: "italic", marginTop: 1 * s, lineHeight: 1.3 }}>
            &ldquo;Id por todo el mundo y predicad el evangelio a toda criatura.&rdquo;{" "}
            <span style={{ fontStyle: "normal", fontWeight: 700 }}>Marcos 16:15</span>
          </div>
        </div>
      </div>

      {/* ── PIE: iglesia + zona + caducidad ── */}
      <div style={{ padding: `${3*s}px ${14*s}px ${4*s}px`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f7f8fa", borderTop: `1px solid ${SEP}` }}>
        <div style={{ fontSize: 6 * s, color: LABEL, fontWeight: 600 }}>
          {data.iglesia_nombre} · <span style={{ color: NAVY, fontWeight: 700 }}>[{data.zona_codigo}]</span> {data.zona_nombre}
        </div>
        <div style={{ fontSize: 5.5 * s, color: LABEL, fontWeight: 600 }}>
          Caduca: {expiry}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   REVERSO
   ═══════════════════════════════════════════ */
export function CredentialCardBack({ scale = 1 }: { scale?: number }) {
  const s = scale;
  const W = 540 * s;
  const H = 340 * s;

  return (
    <div style={{ width: W, height: H, borderRadius: 10 * s, overflow: "hidden", position: "relative", background: "#ffffff", fontFamily: "'Segoe UI', Arial, sans-serif", boxShadow: `0 ${2*s}px ${12*s}px rgba(0,0,0,0.18)`, display: "flex", flexDirection: "column" }}>

      {/* Logo superior */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 14 * s }}>
        <Image src="/TEMPLOGOIEF.png" alt="IEF" width={Math.round(100*s)} height={Math.round(28*s)} style={{ height: 28 * s, width: "auto", objectFit: "contain" }} unoptimized />
      </div>

      {/* Título */}
      <div style={{ textAlign: "center", marginTop: 8 * s }}>
        <div style={{ fontSize: 14 * s, fontWeight: 800, color: NAVY, letterSpacing: 1.5 * s }}>EXTRACTOS DE LEY</div>
        <div style={{ fontSize: 6.5 * s, color: LABEL, fontWeight: 600, marginTop: 3 * s, letterSpacing: 0.5 * s }}>
          Ley 7/1980 de Libertad Religiosa &bull; Ley 24/1992 Acuerdo Iglesia-Estado
        </div>
      </div>

      {/* Separador */}
      <div style={{ display: "flex", justifyContent: "center", margin: `${6*s}px 0` }}>
        <div style={{ width: "60%", height: 1, background: `linear-gradient(90deg, transparent, ${SEP}, transparent)` }} />
      </div>

      {/* Textos legales */}
      <div style={{ flex: 1, padding: `0 ${20*s}px`, textAlign: "center" }}>
        <div style={{ fontSize: 7 * s, lineHeight: 1.5, color: "#3a4a5e", marginBottom: 6 * s }}>
          El acceso de los Ministros de Culto de la <strong>Iglesia Evangélica Filadelfia</strong> a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros análogos del sector público, es libre y sin limitaciones de horarios para su asistencia religiosa. <strong style={{ color: NAVY }}>(Ley 7/1980, Art. 2)</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 * s }}>
          <div style={{ width: "40%", height: 1, background: `linear-gradient(90deg, transparent, ${SEP}, transparent)` }} />
        </div>
        <div style={{ fontSize: 7 * s, lineHeight: 1.5, color: "#3a4a5e" }}>
          Los Ministros de Culto de las Iglesias pertenecientes a la <strong>Iglesia Evangélica Filadelfia</strong> no están obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. <strong style={{ color: NAVY }}>(Ley 24/1992, Art. 3.2)</strong>
        </div>
      </div>

      {/* Barra azul inferior */}
      <div style={{ background: NAVY, padding: `${6*s}px ${14*s}px`, textAlign: "center" }}>
        <div style={{ fontSize: 7 * s, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 2 * s }}>IGLESIA EVANGÉLICA FILADELFIA</div>
      </div>
    </div>
  );
}

export default function CredentialCard({ data, side, scale = 1 }: CredentialCardProps) {
  if (side === "front") return <CredentialCardFront data={data} scale={scale} />;
  return <CredentialCardBack scale={scale} />;
}


