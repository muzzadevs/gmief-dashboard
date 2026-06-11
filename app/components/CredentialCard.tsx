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
          "linear-gradient(135deg, #0a1628 0%, #122050 35%, #1a3a8a 65%, #1e4fae 100%)",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: "white",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      {/* Spain map watermark */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: "55%",
          height: "auto",
          opacity: 0.06,
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

      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3 * scale,
          background: "#c60b1e",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 1 * scale,
          left: 0,
          right: 0,
          height: 1 * scale,
          background: "#ffc400",
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: `${10 * scale}px ${14 * scale}px ${3 * scale}px`,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 11 * scale,
            fontWeight: 700,
            letterSpacing: 0.3 * scale,
            opacity: 0.95,
          }}
        >
          IGLESIA EVANGÉLICA DE FILADELFIA
        </div>
        <div
          style={{
            fontSize: 7 * scale,
            opacity: 0.5,
            marginTop: 1 * scale,
          }}
        >
          Zona de {data.zona_nombre}
        </div>
      </div>

      {/* Separator */}
      <div
        style={{
          margin: `0 ${14 * scale}px`,
          height: 1,
          background: "rgba(255,255,255,0.12)",
        }}
      />

      {/* Body */}
      <div
        style={{
          display: "flex",
          padding: `${6 * scale}px ${14 * scale}px`,
          gap: 12 * scale,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Photo */}
        <div
          style={{
            width: 65 * scale,
            height: 85 * scale,
            borderRadius: 6 * scale,
            overflow: "hidden",
            flexShrink: 0,
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid rgba(255,255,255,0.2)`,
          }}
        >
          {data.has_imagen ? (
            <Image
              src={`/api/ministerios/${data.ministerio_id}/imagen`}
              alt={fullName}
              width={65 * scale}
              height={85 * scale}
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
                color: "rgba(255,255,255,0.35)",
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
            gap: 2 * scale,
          }}
        >
          <div
            style={{
              fontSize: 13 * scale,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {fullName}
          </div>
          <div
            style={{
              fontSize: 9 * scale,
              opacity: 0.6,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {docId}
          </div>
          <div style={{ marginTop: 3 * scale }}>
            <div
              style={{
                fontSize: 5.5 * scale,
                opacity: 0.35,
                fontWeight: 600,
                letterSpacing: 1 * scale,
              }}
            >
              CÓDIGO
            </div>
            <div
              style={{
                fontSize: 16 * scale,
                fontWeight: 800,
                fontFamily: "'Courier New', monospace",
              }}
            >
              {data.codigo || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: `${6 * scale}px ${14 * scale}px`,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 9 * scale,
            fontWeight: 700,
            background: "linear-gradient(90deg, #f5c842, #d4941a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          MINISTRO DE CULTO
        </div>
        <div
          style={{
            fontSize: 6 * scale,
            opacity: 0.45,
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
        background: "#f4f6f9",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: "#1e293b",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2.5 * scale,
          background: "linear-gradient(90deg, #1e3a8a, #2563eb, #1e3a8a)",
        }}
      />

      {/* Bottom accent */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2.5 * scale,
          background: "linear-gradient(90deg, #1e3a8a, #2563eb, #1e3a8a)",
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
          padding: `${12 * scale}px ${18 * scale}px`,
        }}
      >
        <div
          style={{
            fontSize: 9 * scale,
            fontWeight: 800,
            letterSpacing: 1.5 * scale,
            marginBottom: 3 * scale,
            color: "#0f172a",
          }}
        >
          EXTRACTOS DE LEY
        </div>
        <div
          style={{
            fontSize: 5 * scale,
            fontWeight: 600,
            marginBottom: 5 * scale,
            color: "#64748b",
          }}
        >
          7/1980 de Libertad Religiosa • 24/1992 de Acuerdo Iglesia Estado
        </div>

        {/* Separator */}
        <div
          style={{
            width: "70%",
            height: 1,
            background: "#cbd5e1",
            marginBottom: 5 * scale,
          }}
        />

        <div
          style={{
            fontSize: 5.5 * scale,
            lineHeight: 1.6,
            color: "#334155",
            marginBottom: 4 * scale,
            maxWidth: "90%",
          }}
        >
          El acceso de los Ministros de Culto de la{" "}
          <strong>Iglesia Evangélica Filadelfia</strong> a centros o
          establecimientos penitenciarios, hospitalarios, asistenciales u otros
          análogos del sector público, es libre y sin limitaciones de horarios
          para su asistencia religiosa{" "}
          <strong>(Ley 7/1980, Art. 2)</strong>
        </div>

        {/* Separator */}
        <div
          style={{
            width: "50%",
            height: 1,
            background: "#e2e8f0",
            marginBottom: 4 * scale,
          }}
        />

        <div
          style={{
            fontSize: 5.5 * scale,
            lineHeight: 1.6,
            color: "#334155",
            maxWidth: "90%",
          }}
        >
          Los Ministros de Culto de las Iglesias pertenecientes a la{" "}
          <strong>Iglesia Evangélica Filadelfia</strong> no están obligados a
          declarar sobre los hechos que les hayan sido revelados en el ejercicio
          de sus funciones de culto y asistencia religiosa.{" "}
          <strong>(Ley 24/1992, Art. 3.2)</strong>
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
