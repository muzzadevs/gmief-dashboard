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
}

function formatExpiryDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const NAVY = "#1a2d50";
const LBL = "#7a8ca3";
const SEP = "#d0d8e2";

function FieldRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: "clamp(11px,1.8cqi,16px)", fontWeight: 700, color: LBL, letterSpacing: 1.2, textTransform: "uppercase" as const }}>{label}</div>
      <div style={{ fontSize: "clamp(20px,3.8cqi,34px)", fontWeight: 700, color: "#1e293b", fontFamily: mono ? "'Courier New',monospace" : "inherit", letterSpacing: mono ? 1 : 0 }}>{value}</div>
      <div style={{ height: 2, background: SEP, marginTop: 4, width: "80%" }} />
    </div>
  );
}
function CardFront({ data }: { data: CredentialData }) {
  const expiry = formatExpiryDate();
  const docId = data.dni || data.nie || "\u2014";
  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
    <div style={{ width: "100%", aspectRatio: "86/54", borderRadius: 14, overflow: "hidden", background: "#fff", fontFamily: "'Segoe UI',Arial,sans-serif", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Mapa de Espa\u00f1a de fondo */}
      <div style={{
        position: "absolute",
        top: "10%",
        right: "2%",
        width: "45%",
        height: "60%",
        backgroundImage: "url(/spainMap.png)",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        opacity: 0.08,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* HEADER */}
      <div style={{ textAlign: "center", padding: "3.5% 5% 0", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "clamp(26px,6cqi,52px)", fontWeight: 800, color: NAVY, letterSpacing: 1, lineHeight: 1.15 }}>IGLESIA EVANG\u00c9LICA FILADELFIA</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: "1%" }}>
          <div style={{ flex: 1, maxWidth: 140, height: 1.5, background: NAVY }} />
          <span style={{ fontSize: "clamp(12px,2cqi,18px)", color: LBL, fontWeight: 600, letterSpacing: 1.5 }}>CIF R480047J</span>
          <div style={{ flex: 1, maxWidth: 140, height: 1.5, background: NAVY }} />
        </div>
      </div>

      {/* CUERPO */}
      <div style={{ flex: 1, display: "flex", padding: "2.5% 5% 0", gap: "4%", position: "relative", minHeight: 0, zIndex: 1 }}>
        {/* Foto */}
        <div style={{ width: "28%", aspectRatio: "3/3.6", borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#e8ecf0", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${SEP}` }}>
          {data.has_imagen ? (
            <Image src={`/api/ministerios/${data.ministerio_id}/imagen`} alt={data.nombre} width={260} height={312} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
          ) : (
            <span style={{ fontSize: 60, fontWeight: 700, color: "#b0bec5" }}>{data.nombre[0]}</span>
          )}
        </div>
        {/* Datos */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: "3%", minWidth: 0 }}>
          <div>
            <div style={{ fontSize: "clamp(28px,5.5cqi,48px)", fontWeight: 800, color: NAVY, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.nombre.toUpperCase()}</div>
            <div style={{ fontSize: "clamp(18px,3.2cqi,30px)", fontWeight: 700, color: NAVY, marginTop: "0.5%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(data.apellidos || "").toUpperCase()}</div>
          </div>
          <FieldRow label="Documento" value={docId} mono />
          <FieldRow label="N\u00ba de Credencial" value={data.codigo || "\u2014"} mono />
          <FieldRow label="V\u00e1lida hasta" value={expiry} />
        </div>
      </div>

      {/* BARRA MINISTERIO */}
      <div style={{ background: NAVY, margin: "2.5% 0 0", display: "flex", alignItems: "center", gap: "3%", padding: "2% 4%", position: "relative", zIndex: 1 }}>
        <div style={{ width: "7%", aspectRatio: "1", borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Image src="/TEMPLOGOIEF.png" alt="Logo" width={80} height={80} style={{ width: "80%", height: "auto", objectFit: "contain", filter: "brightness(2)" }} unoptimized />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "clamp(14px,2.6cqi,24px)", fontWeight: 800, color: "#fff", letterSpacing: 2 }}>MINISTRO DE CULTO</div>
          <div style={{ fontSize: "clamp(9px,1.4cqi,13px)", color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
            &ldquo;Id por todo el mundo y predicad el evangelio a toda criatura&rdquo;{" "}
            <span style={{ fontStyle: "normal", fontWeight: 700 }}>Marcos 16:15</span>
          </div>
        </div>
      </div>

      {/* PIE */}
      <div style={{ padding: "1.5% 5%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f4f6f8", borderTop: `1px solid ${SEP}`, position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: "clamp(11px,1.6cqi,15px)", color: LBL, fontWeight: 600 }}>
          {data.iglesia_nombre} &middot; <span style={{ color: NAVY, fontWeight: 700 }}>[{data.zona_codigo}]</span> {data.zona_nombre}
        </span>
        <span style={{ fontSize: "clamp(11px,1.6cqi,15px)", color: LBL, fontWeight: 600 }}>Caduca: {expiry}</span>
      </div>
    </div>
    </div>
  );
}
function CardBack() {
  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
    <div style={{ width: "100%", aspectRatio: "86/54", borderRadius: 14, overflow: "hidden", background: "#f4f6f8", fontFamily: "'Segoe UI',Arial,sans-serif", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "5%" }}>
        <Image src="/TEMPLOGOIEF.png" alt="IEF" width={120} height={40} style={{ height: "clamp(36px,5cqi,56px)", width: "auto", objectFit: "contain" }} unoptimized />
      </div>
      {/* Titulo */}
      <div style={{ textAlign: "center", marginTop: "2.5%" }}>
        <div style={{ fontSize: "clamp(22px,4.5cqi,38px)", fontWeight: 800, color: NAVY, letterSpacing: 2 }}>EXTRACTOS DE LEY</div>
        <div style={{ fontSize: "clamp(11px,1.8cqi,16px)", color: LBL, fontWeight: 600, marginTop: "1%", letterSpacing: 0.5 }}>
          Ley 7/1980 de Libertad Religiosa &bull; Ley 24/1992 Acuerdo Iglesia-Estado
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", margin: "2% 0" }}>
        <div style={{ width: "60%", height: 1.5, background: `linear-gradient(90deg,transparent,${SEP},transparent)` }} />
      </div>
      {/* Textos legales */}
      <div style={{ flex: 1, padding: "0 7%", textAlign: "center" }}>
        <div style={{ fontSize: "clamp(12px,2cqi,18px)", lineHeight: 1.6, color: "#3a4a5e", marginBottom: "2%" }}>
          El acceso de los Ministros de Culto de la <strong>Iglesia Evang\u00e9lica Filadelfia</strong> a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros an\u00e1logos del sector p\u00fablico, es libre y sin limitaciones de horarios para su asistencia religiosa. <strong style={{ color: NAVY }}>(Ley 7/1980, Art. 2)</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2%" }}>
          <div style={{ width: "40%", height: 1, background: `linear-gradient(90deg,transparent,${SEP},transparent)` }} />
        </div>
        <div style={{ fontSize: "clamp(12px,2cqi,18px)", lineHeight: 1.6, color: "#3a4a5e" }}>
          Los Ministros de Culto de las Iglesias pertenecientes a la <strong>Iglesia Evang\u00e9lica Filadelfia</strong> no est\u00e1n obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. <strong style={{ color: NAVY }}>(Ley 24/1992, Art. 3.2)</strong>
        </div>
      </div>
      {/* Barra azul */}
      <div style={{ background: NAVY, padding: "2% 5%", textAlign: "center", marginTop: "auto" }}>
        <div style={{ fontSize: "clamp(12px,2cqi,16px)", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>IGLESIA EVANG\u00c9LICA FILADELFIA</div>
      </div>
    </div>
    </div>
  );
}

export default function CredentialCard({ data, side }: CredentialCardProps) {
  if (side === "front") return <CardFront data={data} />;
  return <CardBack />;
}