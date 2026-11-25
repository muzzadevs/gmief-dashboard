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

export function CredentialCardFront({
  data,
  scale = 1,
}: {
  data: CredentialData;
  scale?: number;
}) {
  const expiry = formatExpiryDate();
  const docId = data.dni || data.nie || "—";
  const fullName = `${data.nombre} ${data.apellidos || ""}`.trim();

  return (
    <div
      className="credential-card-front"
      style={{
        width: 340 * scale,
        height: 214 * scale,
        borderRadius: 12 * scale,
        overflow: "hidden",
        position: "relative",
        background:
          "linear-gradient(145deg, #0a1628 0%, #0f2140 40%, #163060 70%, #1a3a7a 100%)",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: "white",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      }}
    >
      {/* Spain map watermark */}
      <div
        style={{
          position: "absolute",
          right: -10 * scale,
          bottom: 20 * scale,
          width: "50%",
          height: "auto",
          opacity: 0.04,
          pointerEvents: "none",
        }}
      >
        <Image
          src="/spainMap.png"
          alt=""
          width={340}
          height={300}
          style={{ width: "100%", height: "auto" }}
          unoptimized
        />
      </div>

      {/* Top Spanish flag accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3 * scale,
          background: "linear-gradient(180deg, #c60b1e 0%, #c60b1e 33%, #ffc400 33%, #ffc400 66%, #c60b1e 66%, #c60b1e 100%)",
        }}
      />

      {/* Header area with logo */}
      <div
        style={{
          padding: `${8 * scale}px ${12 * scale}px ${4 * scale}px`,
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            height: 30 * scale,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Image
            src="/TEMPLOGOIEF.png"
            alt="IE Filadelfia"
            width={Math.round(130 * scale)}
            height={Math.round(30 * scale)}
            style={{
              height: 30 * scale,
              width: "auto",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
            }}
            unoptimized
          />
        </div>
        <div
          style={{
            fontSize: 6 * scale,
            opacity: 0.4,
            textAlign: "right",
            lineHeight: 1.3,
          }}
        >
          <div>Zona de {data.zona_nombre}</div>
        </div>
      </div>

      {/* Gold separator line */}
      <div
        style={{
          margin: `0 ${12 * scale}px`,
          height: 1,
          background: "linear-gradient(90deg, #c8920e, #f0c030, #c8920e)",
          opacity: 0.5,
        }}
      />

      {/* Body */}
      <div
        style={{
          display: "flex",
          padding: `${5 * scale}px ${12 * scale}px`,
          gap: 10 * scale,
          position: "relative",
          zIndex: 1,
          flex: 1,
        }}
      >
        {/* Photo */}
        <div
          style={{
            width: 72 * scale,
            height: 90 * scale,
            borderRadius: 6 * scale,
            overflow: "hidden",
            flexShrink: 0,
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1.5px solid rgba(212,180,80,0.35)`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {data.has_imagen ? (
            <Image
              src={`/api/ministerios/${data.ministerio_id}/imagen`}
              alt={fullName}
              width={Math.round(72 * scale)}
              height={Math.round(90 * scale)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              unoptimized
            />
          ) : (
            <span
              style={{
                fontSize: 28 * scale,
                fontWeight: 700,
                color: "rgba(255,255,255,0.3)",
              }}
            >
              {fullName[0]}
            </span>
          )}
        </div>

        {/* Info */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 1 * scale,
          }}
        >
          {/* Full name */}
          <div
            style={{
              fontSize: 12.5 * scale,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: 0.2 * scale,
            }}
          >
            {fullName}
          </div>
          {/* DNI/NIE */}
          <div
            style={{
              fontSize: 8 * scale,
              opacity: 0.55,
              fontFamily: "'Courier New', monospace",
              marginTop: 1 * scale,
            }}
          >
            {docId}
          </div>
          {/* Code section */}
          <div style={{ marginTop: 4 * scale }}>
            <div
              style={{
                fontSize: 5 * scale,
                opacity: 0.3,
                fontWeight: 600,
                letterSpacing: 1.5 * scale,
                textTransform: "uppercase",
              }}
            >
              CÓDIGO
            </div>
            <div
              style={{
                fontSize: 15 * scale,
                fontWeight: 800,
                fontFamily: "'Courier New', monospace",
                background: "linear-gradient(90deg, #f0c030, #e0a820)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: 1 * scale,
              }}
            >
              {data.codigo || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - gold bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 24 * scale,
          background: "linear-gradient(90deg, #b8860b, #d4a017, #f0c030, #d4a017, #b8860b)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: `0 ${12 * scale}px`,
        }}
      >
        <div
          style={{
            fontSize: 8 * scale,
            fontWeight: 800,
            color: "#0a1628",
            letterSpacing: 1.5 * scale,
          }}
        >
          MINISTRO DE CULTO
        </div>
        <div
          style={{
            fontSize: 6 * scale,
            color: "rgba(10,22,40,0.6)",
            fontWeight: 600,
          }}
        >
          Validez: {expiry}
        </div>
      </div>
    </div>
  );
}

export function CredentialCardBack({ scale = 1 }: { scale?: number }) {
  return (
    <div
      className="credential-card-back"
      style={{
        width: 340 * scale,
        height: 214 * scale,
        borderRadius: 12 * scale,
        overflow: "hidden",
        position: "relative",
        background:
          "linear-gradient(145deg, #0a1628 0%, #0f2140 40%, #163060 70%, #1a3a7a 100%)",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: "white",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      }}
    >
      {/* Top gold accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2 * scale,
          background: "linear-gradient(90deg, #b8860b, #f0c030, #b8860b)",
        }}
      />

      {/* Bottom gold accent */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2 * scale,
          background: "linear-gradient(90deg, #b8860b, #f0c030, #b8860b)",
        }}
      />

      {/* Centered content */}
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: `${10 * scale}px ${16 * scale}px`,
        }}
      >
        {/* Logo small */}
        <div
          style={{
            height: 18 * scale,
            marginBottom: 4 * scale,
            opacity: 0.5,
          }}
        >
          <Image
            src="/TEMPLOGOIEF.png"
            alt="IE Filadelfia"
            width={Math.round(80 * scale)}
            height={Math.round(18 * scale)}
            style={{
              height: 18 * scale,
              width: "auto",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
            }}
            unoptimized
          />
        </div>

        <div
          style={{
            fontSize: 8 * scale,
            fontWeight: 800,
            letterSpacing: 2 * scale,
            marginBottom: 2 * scale,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          EXTRACTOS DE LEY
        </div>
        <div
          style={{
            fontSize: 4.5 * scale,
            fontWeight: 600,
            marginBottom: 4 * scale,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          7/1980 de Libertad Religiosa • 24/1992 Acuerdo Iglesia-Estado
        </div>

        {/* Separator */}
        <div
          style={{
            width: "70%",
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(240,192,48,0.4), transparent)",
            marginBottom: 5 * scale,
          }}
        />

        <div
          style={{
            fontSize: 5.2 * scale,
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.6)",
            marginBottom: 4 * scale,
            maxWidth: "92%",
          }}
        >
          El acceso de los Ministros de Culto de la{" "}
          <strong style={{ color: "rgba(255,255,255,0.85)" }}>Iglesia Evangélica Filadelfia</strong> a centros o
          establecimientos penitenciarios, hospitalarios, asistenciales u otros
          análogos del sector público, es libre y sin limitaciones de horarios
          para su asistencia religiosa{" "}
          <strong style={{ color: "#f0c030" }}>(Ley 7/1980, Art. 2)</strong>
        </div>

        {/* Separator */}
        <div
          style={{
            width: "50%",
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            marginBottom: 4 * scale,
          }}
        />

        <div
          style={{
            fontSize: 5.2 * scale,
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.6)",
            maxWidth: "92%",
          }}
        >
          Los Ministros de Culto de las Iglesias pertenecientes a la{" "}
          <strong style={{ color: "rgba(255,255,255,0.85)" }}>Iglesia Evangélica Filadelfia</strong> no están obligados a
          declarar sobre los hechos que les hayan sido revelados en el ejercicio
          de sus funciones de culto y asistencia religiosa.{" "}
          <strong style={{ color: "#f0c030" }}>(Ley 24/1992, Art. 3.2)</strong>
        </div>
      </div>
    </div>
  );
}

export default function CredentialCard({
  data,
  side,
  scale = 1,
}: CredentialCardProps) {
  if (side === "front") {
    return <CredentialCardFront data={data} scale={scale} />;
  }
  return <CredentialCardBack scale={scale} />;
}
