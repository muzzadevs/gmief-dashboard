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

/* Patrón de líneas decorativas diagonales */
function DiagPattern({ W, H }: { W: number; H: number }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.04 }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1={-W * 0.2 + i * (W / 6)} y1={0} x2={i * (W / 6)} y2={H} stroke="#fff" strokeWidth={0.6} />
      ))}
    </svg>
  );
}

/* Estilo base del contenedor */
const cardBase = (W: number, H: number, s: number): React.CSSProperties => ({
  width: W, height: H, borderRadius: 8 * s, overflow: "hidden", position: "relative",
  background: "linear-gradient(145deg, #0d1b2a 0%, #1b2d4f 50%, #0d1b2a 100%)",
  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", color: "#fff",
  boxShadow: `0 ${4 * s}px ${20 * s}px rgba(0,0,0,0.35)`,
});


/* ═══════════════════════════════════════════
   FRENTE DE LA CREDENCIAL
   ═══════════════════════════════════════════ */
export function CredentialCardFront({ data, scale = 1 }: { data: CredentialData; scale?: number }) {
  const expiry = formatExpiryDate();
  const docId = data.dni || data.nie || "\u2014";
  const fullName = `${data.nombre} ${data.apellidos || ""}`.trim();
  const W = 340 * scale; const H = 214 * scale; const s = scale;

  return (
    <div style={cardBase(W, H, s)}>
      <DiagPattern W={W} H={H} />
      <div style={{ position: "absolute", right: -5 * s, top: "15%", width: "42%", opacity: 0.04, pointerEvents: "none" }}>
        <Image src="/spainMap.png" alt="" width={340} height={300} style={{ width: "100%", height: "auto" }} unoptimized />
      </div>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 * s, padding: `${6 * s}px ${10 * s}px 0`, position: "relative", zIndex: 1 }}>
        <div style={{ height: 22 * s, flexShrink: 0 }}>
          <Image src="/TEMPLOGOIEF.png" alt="IE Filadelfia" width={Math.round(110 * s)} height={Math.round(22 * s)} style={{ height: 22 * s, width: "auto", objectFit: "contain" }} unoptimized />
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: 5 * s, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 1.2 * s, lineHeight: 1.3 }}>IGLESIA EVANGÉLICA FILADELFIA</div>
        </div>
      </div>
      <div style={{ margin: `${3 * s}px ${10 * s}px`, height: 1.5 * s, borderRadius: 1, background: "linear-gradient(90deg, #c8920e, #d4a017 40%, #e8c547 60%, #d4a017 80%, #c8920e)", opacity: 0.8, position: "relative", zIndex: 1 }} />
      <div style={{ textAlign: "center", padding: `${1 * s}px ${10 * s}px`, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 8.5 * s, fontWeight: 800, letterSpacing: 2.5 * s, color: "#d4a017" }}>MINISTRO DE CULTO</div>
      </div>

      {/* Cuerpo: Foto + Datos */}
      <div style={{ display: "flex", padding: `${4 * s}px ${10 * s}px 0`, gap: 8 * s, position: "relative", zIndex: 1 }}>
        <div style={{ width: 60 * s, height: 72 * s, borderRadius: 4 * s, overflow: "hidden", flexShrink: 0, background: "#2a3a5a", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(212,160,23,0.5)", boxShadow: `0 ${2 * s}px ${6 * s}px rgba(0,0,0,0.3)` }}>
          {data.has_imagen ? (
            <Image src={`/api/ministerios/${data.ministerio_id}/imagen`} alt={fullName} width={Math.round(60 * s)} height={Math.round(72 * s)} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
          ) : (
            <span style={{ fontSize: 24 * s, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{fullName[0]}</span>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 * s, minWidth: 0 }}>
          <div>
            <div style={{ fontSize: 3.5 * s, fontWeight: 600, color: "rgba(212,160,23,0.7)", letterSpacing: 0.8 * s, textTransform: "uppercase", marginBottom: 0.5 * s }}>Nombre y Apellidos</div>
            <div style={{ fontSize: 7.5 * s, fontWeight: 700, color: "#fff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</div>
          </div>
          <div style={{ display: "flex", gap: 8 * s }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 3.5 * s, fontWeight: 600, color: "rgba(212,160,23,0.7)", letterSpacing: 0.8 * s, textTransform: "uppercase", marginBottom: 0.5 * s }}>DNI / NIE</div>
              <div style={{ fontSize: 6.5 * s, fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: 0.5 * s }}>{docId}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 3.5 * s, fontWeight: 600, color: "rgba(212,160,23,0.7)", letterSpacing: 0.8 * s, textTransform: "uppercase", marginBottom: 0.5 * s }}>N\u00ba Credencial</div>
              <div style={{ fontSize: 6.5 * s, fontWeight: 700, color: "#fff", fontFamily: "'Courier New', monospace", letterSpacing: 0.5 * s }}>{data.codigo || "\u2014"}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 3.5 * s, fontWeight: 600, color: "rgba(212,160,23,0.7)", letterSpacing: 0.8 * s, textTransform: "uppercase", marginBottom: 0.5 * s }}>Iglesia</div>
            <div style={{ fontSize: 5.5 * s, fontWeight: 500, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {data.iglesia_nombre}
              <span style={{ color: "rgba(255,255,255,0.4)", margin: `0 ${3 * s}px` }}>&middot;</span>
              <span style={{ color: "rgba(212,160,23,0.6)", fontSize: 4.5 * s, fontWeight: 600 }}>[{data.zona_codigo}] {data.zona_nombre}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 22 * s, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 100%)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: `0 ${10 * s}px ${3 * s}px`, zIndex: 2 }}>
        <div style={{ fontSize: 3.8 * s, color: "rgba(212,160,23,0.7)", fontStyle: "italic", lineHeight: 1.3, maxWidth: "55%" }}>
          &ldquo;Id por todo el mundo y predicad el evangelio a toda criatura&rdquo;{" "}
          <span style={{ fontStyle: "normal", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Marcos 16:15</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ fontSize: 4 * s, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 * s }}>Caduca: {expiry}</div>
          <div style={{ fontSize: 3.2 * s, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 * s }}>CIF R480047J</div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   REVERSO DE LA CREDENCIAL
   ═══════════════════════════════════════════ */
export function CredentialCardBack({ scale = 1 }: { scale?: number }) {
  const W = 340 * scale; const H = 214 * scale; const s = scale;

  return (
    <div style={cardBase(W, H, s)}>
      <DiagPattern W={W} H={H} />
      {/* Logo superior tenue */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 6 * s, position: "relative", zIndex: 1, opacity: 0.25 }}>
        <Image src="/TEMPLOGOIEF.png" alt="IE Filadelfia" width={Math.round(60 * s)} height={Math.round(14 * s)} style={{ height: 14 * s, width: "auto", objectFit: "contain" }} unoptimized />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: `${3 * s}px ${12 * s}px`, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 7 * s, fontWeight: 800, letterSpacing: 2 * s, color: "#d4a017", marginBottom: 1.5 * s }}>EXTRACTOS DE LEY</div>
        <div style={{ fontSize: 3.5 * s, fontWeight: 600, marginBottom: 3 * s, color: "rgba(255,255,255,0.45)", letterSpacing: 0.5 * s }}>Ley 7/1980 de Libertad Religiosa &bull; Ley 24/1992 Acuerdo Iglesia-Estado</div>
        <div style={{ width: "60%", height: 1, marginBottom: 3 * s, background: "linear-gradient(90deg, transparent, #c8920e, transparent)", opacity: 0.5 }} />
        <div style={{ fontSize: 4.2 * s, lineHeight: 1.45, color: "rgba(255,255,255,0.75)", marginBottom: 2.5 * s, maxWidth: "95%" }}>
          El acceso de los Ministros de Culto de la <strong style={{ color: "rgba(255,255,255,0.9)" }}>Iglesia Evangélica Filadelfia</strong> a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros análogos del sector público, es libre y sin limitaciones de horarios para su asistencia religiosa <strong style={{ color: "#d4a017" }}>(Ley 7/1980, Art. 2)</strong>
        </div>
        <div style={{ width: "40%", height: 1, marginBottom: 2.5 * s, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
        <div style={{ fontSize: 4.2 * s, lineHeight: 1.45, color: "rgba(255,255,255,0.75)", maxWidth: "95%" }}>
          Los Ministros de Culto de las Iglesias pertenecientes a la <strong style={{ color: "rgba(255,255,255,0.9)" }}>Iglesia Evangélica Filadelfia</strong> no están obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. <strong style={{ color: "#d4a017" }}>(Ley 24/1992, Art. 3.2)</strong>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 14 * s, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)", display: "flex", justifyContent: "center", alignItems: "flex-end", padding: `0 ${10 * s}px ${2.5 * s}px`, zIndex: 2 }}>
        <div style={{ fontSize: 3.5 * s, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5 * s }}>IGLESIA EVANGÉLICA FILADELFIA</div>
      </div>
    </div>
  );
}

export default function CredentialCard({ data, side, scale = 1 }: CredentialCardProps) {
  if (side === "front") return <CredentialCardFront data={data} scale={scale} />;
  return <CredentialCardBack scale={scale} />;
}

