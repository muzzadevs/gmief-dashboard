"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import LoaderPersonalizado from "../../../../components/LoaderPersonalizado";
import Toast, { useToast } from "../../../../components/Toast";
import type { CredentialData } from "../../../../components/CredentialCard";
import { generateCredentialPdf } from "@/lib/credentialPdf";

const CredentialCard3D = dynamic(
  () => import("../../../../components/CredentialCard3D"),
  { ssr: false }
);

type MinisterioItem = {
  id: number;
  nombre: string;
  apellidos: string | null;
  alias: string | null;
  codigo: string | null;
  dni: string | null;
  nie: string | null;
  has_imagen: boolean;
  iglesia_nombre: string;
  zona_nombre: string;
  zona_codigo: string;
  cargos: string[];
};

type SolicitudItem = {
  id: number;
  expedida: boolean;
  fecha_expedicion: string | null;
  ministerio: MinisterioItem;
};

type SolicitudDetail = {
  id: number;
  fecha: string;
  estado: string;
  notas: string | null;
  items: SolicitudItem[];
};

export default function SolicitudDetalle() {
  const router = useRouter();
  const params = useParams();
  const solicitudId = params.id as string;
  const [solicitud, setSolicitud] = useState<SolicitudDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<SolicitudItem | null>(null);
  const [expediting, setExpediting] = useState<number | null>(null);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const fetchSolicitud = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/solicitudes-credencial/${solicitudId}`);
      const json = await res.json();
      if (json.ok && json.data) {
        setSolicitud(json.data);
      }
    } catch (err) {
      console.error("Error fetching solicitud:", err);
    } finally {
      setLoading(false);
    }
  }, [solicitudId]);

  useEffect(() => {
    fetchSolicitud();
  }, [fetchSolicitud]);

  const handleExpedir = async (item: SolicitudItem) => {
    setExpediting(item.id);
    try {
      // 1. Generate PDF download
      const pdfData = {
        nombre: item.ministerio.nombre,
        apellidos: item.ministerio.apellidos,
        codigo: item.ministerio.codigo,
        dni: item.ministerio.dni,
        nie: item.ministerio.nie,
        zona_nombre: item.ministerio.zona_nombre,
        zona_codigo: item.ministerio.zona_codigo,
        has_imagen: item.ministerio.has_imagen,
        ministerio_id: item.ministerio.id,
      };
      await generateCredentialPdf(pdfData);

      // 2. Mark as expedited in backend
      const res = await fetch(`/api/solicitudes-credencial/${solicitudId}/expedir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id }),
      });

      const json = await res.json();
      if (json.ok) {
        showSuccess(`Credencial expedida para ${item.ministerio.nombre} ${item.ministerio.apellidos || ""}`);
        await fetchSolicitud();
      } else {
        showError(json.error || "Error al expedir credencial");
      }
    } catch (err) {
      console.error("Error expeding:", err);
      showError("Error al expedir credencial");
    } finally {
      setExpediting(null);
    }
  };

  const getCredentialData = (m: MinisterioItem): CredentialData => ({
    nombre: m.nombre,
    apellidos: m.apellidos,
    codigo: m.codigo,
    dni: m.dni,
    nie: m.nie,
    zona_nombre: m.zona_nombre,
    zona_codigo: m.zona_codigo,
    has_imagen: m.has_imagen,
    ministerio_id: m.id,
    iglesia_nombre: m.iglesia_nombre,
    cargos: m.cargos,
  });

  const getDisplayName = (m: MinisterioItem) =>
    m.alias ? m.alias : `${m.nombre} ${m.apellidos || ""}`.trim();

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return { bg: "bg-amber-100", text: "text-amber-800", label: "Pendiente", icon: "🟡" };
      case "EN_PROCESO":
        return { bg: "bg-blue-100", text: "text-blue-800", label: "En proceso", icon: "🔵" };
      case "COMPLETADA":
        return { bg: "bg-emerald-100", text: "text-emerald-800", label: "Solicitud Terminada", icon: "✅" };
      default:
        return { bg: "bg-slate-100", text: "text-slate-800", label: estado, icon: "⚪" };
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen min-h-dvh flex flex-col">
        <LoaderPersonalizado>Cargando solicitud...</LoaderPersonalizado>
      </main>
    );
  }

  if (!solicitud) {
    return (
      <main className="min-h-screen min-h-dvh flex flex-col items-center justify-center">
        <div className="text-center text-white/60 py-12 text-sm">Solicitud no encontrada</div>
      </main>
    );
  }

  const badge = getEstadoBadge(solicitud.estado);
  const totalExpedidos = solicitud.items.filter((i) => i.expedida).length;

  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={hideToast} />

      {/* Header */}
      <div className="w-full flex justify-center z-[1000] px-2 sm:px-0">
        <div className="mt-3 sm:mt-4 w-full sm:w-[95%] max-w-4xl glass-card-solid px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20 sm:w-auto"
              onClick={() => router.push("/modulos/gestor-credenciales/generar")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Volver
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Solicitud #{solicitud.id}
              </h2>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.bg} ${badge.text}`}>
                {badge.icon} {badge.label}
              </span>
              <span className="text-xs text-slate-500">
                {totalExpedidos}/{solicitud.items.length} expedidas
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  solicitud.estado === "COMPLETADA" ? "bg-emerald-500" : "bg-blue-500"
                }`}
                style={{
                  width: `${solicitud.items.length > 0 ? (totalExpedidos / solicitud.items.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 w-full flex justify-center px-2 sm:px-4 py-4">
        <div className="w-full max-w-4xl flex flex-col gap-3">
          {solicitud.items.map((item) => {
            const m = item.ministerio;
            const displayName = getDisplayName(m);
            const subName = m.alias ? `${m.nombre} ${m.apellidos || ""}`.trim() : null;
            const isExpediting = expediting === item.id;

            return (
              <div
                key={item.id}
                className={`glass-card-solid px-5 py-4 flex flex-col gap-3 animate-fadein ${
                  item.expedida ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {m.has_imagen ? (
                      <Image
                        src={`/api/ministerios/${m.id}/imagen`}
                        alt={displayName}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      displayName[0]
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base text-slate-800">{displayName}</span>
                      {m.codigo && (
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {m.codigo}
                        </span>
                      )}
                      {item.expedida && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          ✅ Expedida
                        </span>
                      )}
                    </div>
                    {subName && <span className="text-xs text-slate-500 block">{subName}</span>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-slate-400">[{m.zona_codigo}] {m.iglesia_nombre}</span>
                      <span className="text-[11px] text-slate-400">• Zona de {m.zona_nombre}</span>
                    </div>
                    {m.cargos.length > 0 && (
                      <div className="flex gap-1.5 mt-1">
                        {m.cargos.map((c, i) => (
                          <span key={i} className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!item.expedida && (
                      <>
                        <button
                          type="button"
                          className="btn-primary bg-blue-600 text-white hover:bg-blue-700 shadow-md text-xs"
                          onClick={() => setPreviewItem(item)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="hidden sm:inline">Vista previa</span>
                        </button>
                        <button
                          type="button"
                          className="btn-primary bg-amber-500 text-white hover:bg-amber-600 shadow-md text-xs disabled:opacity-50"
                          onClick={() => handleExpedir(item)}
                          disabled={isExpediting}
                        >
                          {isExpediting ? (
                            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 7.131H5.25" />
                            </svg>
                          )}
                          <span className="hidden sm:inline">Expedir</span>
                        </button>
                      </>
                    )}
                    {item.expedida && item.fecha_expedicion && (
                      <span className="text-[10px] text-emerald-600 text-center">
                        {new Date(item.fecha_expedicion).toLocaleDateString("es-ES")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3D Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="w-full max-w-3xl flex flex-col gap-4 animate-fadein"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-white font-bold text-lg">
                {getDisplayName(previewItem.ministerio)}
                {previewItem.ministerio.codigo && (
                  <span className="ml-2 text-sm font-mono text-white/50">
                    {previewItem.ministerio.codigo}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <CredentialCard3D key={previewItem.id} data={getCredentialData(previewItem.ministerio)} />

            <div className="flex gap-3 justify-center mt-2">
              <button
                type="button"
                className="btn-primary bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 text-sm px-6 py-2.5"
                onClick={() => {
                  handleExpedir(previewItem);
                  setPreviewItem(null);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 7.131H5.25" />
                </svg>
                Expedir Credencial y Descargar PDF
              </button>
              <button
                type="button"
                className="btn-primary bg-white/10 text-white hover:bg-white/20 shadow-lg text-sm px-6 py-2.5 border border-white/10"
                onClick={() => setPreviewItem(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
