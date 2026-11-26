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

const NAVY = "#0f172a";
const BLUE = "#1e3a8a";
const LBL = "#64748b";
const SEP = "#cbd5e1";
const VAL = "#1e293b";
const FT = "Poppins, Arial, sans-serif";

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: "1.5%" }}>
      <div style={{ fontSize: "clamp(10px,1.6cqi,14px)", fontWeight: 700, color: BLUE, letterSpacing: 1.5, textTransform: "uppercase" as const, fontFamily: FT }}>{label}</div>
      <div style={{ fontSize: "clamp(18px,3.4cqi,32px)", fontWeight: 700, color: VAL, fontFamily: FT, lineHeight: 1.2, marginTop: "0.3%" }}>{value}</div>
    </div>
  );
}

function CardFront({ data }: { data: CredentialData }) {
  const expiry = formatExpiryDate();
  const docId = data.dni || data.nie || "\u2014";
  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
      <div style={{ width: "100%", aspectRatio: "86/54", borderRadius: 14, overflow: "hidden", background: "#fff", fontFamily: FT, boxShadow: "0 4px 24px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Mapa de fondo */}
        <div style={{
          position: "absolute", top: "8%", right: "0", width: "50%", height: "70%",
          backgroundImage: "url(/spainMap.png)", backgroundSize: "contain",
          backgroundRepeat: "no-repeat", backgroundPosition: "center right",
          opacity: 0.10, pointerEvents: "none", zIndex: 0,
        }} />

        {/* Header - titulo */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`, padding: "3% 4% 2.5%", textAlign: "center" }}>
          <div style={{ fontSize: "clamp(20px,5cqi,44px)", fontWeight: 800, color: "#fff", letterSpacing: 2, lineHeight: 1.1, fontFamily: FT }}>IGLESIA EVANG\u00c9LICA FILADELFIA</div>
          <div style={{ fontSize: "clamp(9px,1.5cqi,13px)", color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: "0.5%", letterSpacing: 2, fontFamily: FT }}>CIF R480047J</div>
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, display: "flex", padding: "3% 4% 0", gap: "4%", position: "relative", zIndex: 1, minHeight: 0 }}>
          {/* Foto */}
          <div style={{ width: "30%", aspectRatio: "3/3.8", borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #e2e8f0" }}>
            {data.has_imagen ? (
              <Image src={`/api/ministerios/${data.ministerio_id}/imagen`} alt={data.nombre} width={300} height={380} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
            ) : (
              <span style={{ fontSize: "clamp(40px,8cqi,80px)", fontWeight: 800, color: "#94a3b8", fontFamily: FT }}>{data.nombre[0]}</span>
            )}
          </div>
          {/* Datos */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
            <div style={{ marginBottom: "2%" }}>
              <div style={{ fontSize: "clamp(24px,5cqi,46px)", fontWeight: 800, color: NAVY, lineHeight: 1.05, fontFamily: FT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.nombre.toUpperCase()}</div>
              <div style={{ fontSize: "clamp(16px,3cqi,28px)", fontWeight: 700, color: BLUE, lineHeight: 1.1, fontFamily: FT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(data.apellidos || "").toUpperCase()}</div>
            </div>
            <FieldRow label="Documento" value={docId} />
            <FieldRow label="N.\u00ba de Credencial" value={data.codigo || "\u2014"} />
            <FieldRow label="V\u00e1lida hasta" value={expiry} />
          </div>
        </div>

        {/* Barra ministerio */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`, display: "flex", alignItems: "center", gap: "3%", padding: "2% 4%", marginTop: "auto" }}>
          <div style={{ width: "8%", aspectRatio: "1", borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Image src="/TEMPLOGOIEF.png" alt="Logo" width={80} height={80} style={{ width: "75%", height: "auto", objectFit: "contain", filter: "brightness(2)" }} unoptimized />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "clamp(12px,2.4cqi,22px)", fontWeight: 800, color: "#fff", letterSpacing: 2, fontFamily: FT }}>MINISTRO DE CULTO</div>
            <div style={{ fontSize: "clamp(8px,1.2cqi,11px)", color: "rgba(255,255,255,0.55)", fontFamily: FT, marginTop: 1 }}>
              &ldquo;Id por todo el mundo y predicad el evangelio a toda criatura&rdquo; <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>Marcos 16:15</span>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div style={{ padding: "1.2% 4%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f1f5f9", borderTop: `1px solid ${SEP}` }}>
          <span style={{ fontSize: "clamp(9px,1.4cqi,13px)", color: LBL, fontWeight: 600, fontFamily: FT }}>
            {data.iglesia_nombre} &middot; [{data.zona_codigo}] {data.zona_nombre}
          </span>
          <span style={{ fontSize: "clamp(9px,1.4cqi,13px)", color: LBL, fontWeight: 600, fontFamily: FT }}>Caduca: {expiry}</span>
        </div>
      </div>
    </div>
  );
}
function CardBack() {
  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
      <div style={{ width: "100%", aspectRatio: "86/54", borderRadius: 14, overflow: "hidden", background: "#fff", fontFamily: FT, boxShadow: "0 4px 24px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`, padding: "2.5% 4% 2%", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2%", marginBottom: "1%" }}>
            <Image src="/TEMPLOGOIEF.png" alt="IEF" width={120} height={40} style={{ height: "clamp(24px,3.5cqi,40px)", width: "auto", objectFit: "contain", filter: "brightness(2)" }} unoptimized />
          </div>
          <div style={{ fontSize: "clamp(18px,4cqi,36px)", fontWeight: 800, color: "#fff", letterSpacing: 3, fontFamily: FT }}>EXTRACTOS DE LEY</div>
          <div style={{ fontSize: "clamp(9px,1.4cqi,13px)", color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: "0.5%", fontFamily: FT }}>
            Ley 7/1980 de Libertad Religiosa &bull; Ley 24/1992 Acuerdo Iglesia-Estado
          </div>
        </div>

        {/* Textos legales - ocupan todo el espacio */}
        <div style={{ flex: 1, padding: "4% 6%", display: "flex", flexDirection: "column", justifyContent: "center", gap: "4%" }}>
          <div style={{ fontSize: "clamp(12px,2.2cqi,20px)", lineHeight: 1.7, color: "#334155", textAlign: "justify", fontFamily: FT }}>
            El acceso de los Ministros de Culto de la <strong style={{ color: NAVY }}>Iglesia Evang\u00e9lica Filadelfia</strong> a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros an\u00e1logos del sector p\u00fablico, es libre y sin limitaciones de horarios para su asistencia religiosa. <strong style={{ color: BLUE }}>(Ley 7/1980, Art. 2)</strong>
          </div>
          <div style={{ width: "50%", height: 1.5, background: `linear-gradient(90deg, transparent, ${SEP}, transparent)`, alignSelf: "center" }} />
          <div style={{ fontSize: "clamp(12px,2.2cqi,20px)", lineHeight: 1.7, color: "#334155", textAlign: "justify", fontFamily: FT }}>
            Los Ministros de Culto de las Iglesias pertenecientes a la <strong style={{ color: NAVY }}>Iglesia Evang\u00e9lica Filadelfia</strong> no est\u00e1n obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. <strong style={{ color: BLUE }}>(Ley 24/1992, Art. 3.2)</strong>
          </div>
        </div>

        {/* Barra azul inferior */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`, padding: "1.8% 5%", textAlign: "center", marginTop: "auto" }}>
          <div style={{ fontSize: "clamp(10px,1.6cqi,14px)", fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 3, fontFamily: FT }}>IGLESIA EVANG\u00c9LICA FILADELFIA</div>
        </div>
      </div>
    </div>
  );
}

export default function CredentialCard({ data, side }: CredentialCardProps) {
  if (side === "front") return <CardFront data={data} />;
  return <CardBack />;
}