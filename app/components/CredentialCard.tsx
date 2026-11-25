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

export function CredentialCardFront({ data, scale = 1 }: { data: CredentialData; scale?: number }) {
  const expiry = formatExpiryDate();
  const docId = data.dni || data.nie || "\u2014";
  const fullName = `${data.nombre} ${data.apellidos || ""}`.trim();
  const W = 340 * scale; const H = 214 * scale; const s = scale;
  return (
    <div className="credential-card-front" style={{ width: W, height: H, borderRadius: 10 * s, overflow: "hidden", position: "relative", background: "#f0ede6", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#0c1929", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.07 }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0.18, 0.35, 0.52, 0.68, 0.84].map((f, i) => (<path key={i} d={`M0,${H*f} Q${W*0.25},${H*(f-0.06)} ${W*0.5},${H*f} T${W},${H*(f+0.04)}`} fill="none" stroke="#8a9bb5" strokeWidth={0.8} />))}
      </svg>
      <div style={{ position: "absolute", right: 5*s, top: "30%", width: "38%", opacity: 0.08, pointerEvents: "none" }}>
        <Image src="/spainMap.png" alt="" width={340} height={300} style={{ width: "100%", height: "auto" }} unoptimized />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: `${7*s}px ${10*s}px 0`, position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ height: 28*s }}><Image src="/TEMPLOGOIEF.png" alt="IE Filadelfia" width={Math.round(140*s)} height={Math.round(28*s)} style={{ height: 28*s, width: "auto", objectFit: "contain" }} unoptimized /></div>
          <div style={{ fontSize: 4.5*s, fontWeight: 600, color: "#1a2d50", opacity: 0.5, marginTop: 1*s, letterSpacing: 0.5*s }}>CIF R480047J</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5*s, marginTop: 2*s }}>
          {["FE","SERVICIO","COMUNIDAD","ESPERANZA"].map((w)=>(<div key={w} style={{ fontSize: 3.8*s, fontWeight: 600, letterSpacing: 1.5*s, color: "#1a2d50", opacity: 0.35 }}>{w}</div>))}
          <div style={{ position: "absolute", right: 50*s, top: 8*s, width: 1, height: 26*s, background: "linear-gradient(180deg, #c8920e, #d4a017)", opacity: 0.5 }} />
        </div>
      </div>
      <div style={{ padding: `${2*s}px ${10*s}px ${1*s}px ${88*s}px`, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 10*s, fontWeight: 800, color: "#0c1929", letterSpacing: 0.3*s }}>MINISTRO DE CULTO</div>
      </div>
      <div style={{ display: "flex", padding: `${2*s}px ${10*s}px`, gap: 8*s, position: "relative", zIndex: 1 }}>
        <div style={{ width: 68*s, height: 78*s, borderRadius: 4*s, overflow: "hidden", flexShrink: 0, background: "#ddd", display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid #bbb" }}>
          {data.has_imagen ? (<Image src={`/api/ministerios/${data.ministerio_id}/imagen`} alt={fullName} width={Math.round(68*s)} height={Math.round(78*s)} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />) : (<span style={{ fontSize: 26*s, fontWeight: 700, color: "#999" }}>{fullName[0]}</span>)}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2.5*s }}>
          {([["NOMBRE Y APELLIDOS", fullName, 6.5], ["DNI", docId, 6], ["N\u00daMERO DE CREDENCIAL", data.codigo || "\u2014", 7], ["FECHA DE CADUCIDAD", expiry, 6]] as [string,string,number][]).map(([label, value, fs]) => (<div key={label}><div style={{ fontSize: 4*s, fontWeight: 700, color: "#1a2d50", letterSpacing: 0.5*s, marginBottom: 1*s }}>{label}</div><div style={{ background: "rgba(200,200,210,0.35)", borderRadius: 2*s, padding: `${1.5*s}px ${4*s}px`, fontSize: fs*s, fontWeight: label === "N\u00daMERO DE CREDENCIAL" ? 700 : 600, fontFamily: label === "N\u00daMERO DE CREDENCIAL" ? "'Courier New', monospace" : "inherit", color: "#0c1929", minHeight: 10*s }}>{value}</div></div>))}
        </div>
      </div>
      <div style={{ position: "absolute", right: 10*s, bottom: 28*s, fontSize: 4.5*s, fontWeight: 600, letterSpacing: 2*s, color: "#1a2d50", opacity: 0.3, textAlign: "right", lineHeight: 1.5, zIndex: 1 }}>AL SERVICIO<br/>DEL EVANGELIO</div>
      <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 24*s, zIndex: 2 }} viewBox={`0 0 ${W} ${24*s}`} preserveAspectRatio="none"><path d={`M0,${8*s} Q${W*0.35},0 ${W*0.55},${6*s} T${W},${2*s} L${W},${24*s} L0,${24*s} Z`} fill="#0c1929"/></svg>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 18*s, display: "flex", justifyContent: "space-between", alignItems: "center", padding: `0 ${10*s}px`, zIndex: 3 }}>
        <div style={{ fontSize: 3.8*s, fontStyle: "italic", color: "#c8920e", maxWidth: "55%", lineHeight: 1.3 }}>&ldquo;Id por todo el mundo y predicad el evangelio a toda criatura&rdquo; <span style={{ fontStyle: "normal", fontWeight: 600 }}>Marcos 16:15</span></div>
        <div style={{ width: 0.5, height: 10*s, background: "rgba(255,255,255,0.25)" }}/>
        <div style={{ fontSize: 4*s, fontWeight: 600, color: "rgba(255,255,255,0.7)", textAlign: "right", letterSpacing: 0.5*s, lineHeight: 1.4 }}>IGLESIA EVANG\u00c9LICA<br/>FILADELFIA</div>
      </div>
    </div>
  );
}

export function CredentialCardBack({ scale = 1 }: { scale?: number }) {
  const W = 340 * scale; const H = 214 * scale; const s = scale;
  return (
    <div className="credential-card-back" style={{ width: W, height: H, borderRadius: 10*s, overflow: "hidden", position: "relative", background: "#f0ede6", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#0c1929", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.07 }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0.18, 0.35, 0.52, 0.68, 0.84].map((f, i) => (<path key={i} d={`M0,${H*f} Q${W*0.25},${H*(f-0.06)} ${W*0.5},${H*f} T${W},${H*(f+0.04)}`} fill="none" stroke="#8a9bb5" strokeWidth={0.8} />))}
      </svg>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 8*s, position: "relative", zIndex: 1, opacity: 0.35 }}>
        <Image src="/TEMPLOGOIEF.png" alt="IE Filadelfia" width={Math.round(70*s)} height={Math.round(16*s)} style={{ height: 16*s, width: "auto", objectFit: "contain" }} unoptimized />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: `${4*s}px ${14*s}px`, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 8*s, fontWeight: 800, letterSpacing: 1.5*s, marginBottom: 2*s, color: "#0c1929" }}>EXTRACTOS DE LEY</div>
        <div style={{ fontSize: 4*s, fontWeight: 600, marginBottom: 4*s, color: "#5a6a7a" }}>Ley 7/1980 de Libertad Religiosa \u2022 Ley 24/1992 Acuerdo Iglesia-Estado</div>
        <div style={{ width: "70%", height: 1, marginBottom: 4*s, opacity: 0.4, background: "linear-gradient(90deg, transparent, #c8920e, transparent)" }}/>
        <div style={{ fontSize: 4.8*s, lineHeight: 1.5, color: "#2a3a50", marginBottom: 3*s, maxWidth: "95%" }}>El acceso de los Ministros de Culto de la <strong>Iglesia Evang\u00e9lica Filadelfia</strong> a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros an\u00e1logos del sector p\u00fablico, es libre y sin limitaciones de horarios para su asistencia religiosa <strong style={{ color: "#b8860b" }}>(Ley 7/1980, Art. 2)</strong></div>
        <div style={{ width: "50%", height: 1, marginBottom: 3*s, background: "linear-gradient(90deg, transparent, rgba(26,45,80,0.2), transparent)" }}/>
        <div style={{ fontSize: 4.8*s, lineHeight: 1.5, color: "#2a3a50", maxWidth: "95%" }}>Los Ministros de Culto de las Iglesias pertenecientes a la <strong>Iglesia Evang\u00e9lica Filadelfia</strong> no est\u00e1n obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. <strong style={{ color: "#b8860b" }}>(Ley 24/1992, Art. 3.2)</strong></div>
      </div>
      <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 16*s, zIndex: 2 }} viewBox={`0 0 ${W} ${16*s}`} preserveAspectRatio="none"><path d={`M0,${6*s} Q${W*0.35},0 ${W*0.55},${4*s} T${W},${1*s} L${W},${16*s} L0,${16*s} Z`} fill="#0c1929"/></svg>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 12*s, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3 }}>
        <div style={{ fontSize: 4*s, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5*s }}>IGLESIA EVANG\u00c9LICA FILADELFIA</div>
      </div>
    </div>
  );
}

export default function CredentialCard({ data, side, scale = 1 }: CredentialCardProps) {
  if (side === "front") return <CredentialCardFront data={data} scale={scale} />;
  return <CredentialCardBack scale={scale} />;
}
