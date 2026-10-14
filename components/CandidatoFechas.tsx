"use client";

import {
  calcularFechasCandidato,
  FASES_CANDIDATO,
  obtenerFechaHoy,
  type FaseFechaCandidato,
} from "@/lib/candidatoUtils";

const ETIQUETAS: Record<FaseFechaCandidato, string> = {
  ENSAYISTA: "Ensayista",
  CANDIDATO_LOCAL: "Candidato Local",
  CANDIDATO_NACIONAL: "Candidato Nacional",
};

const CAMPOS_FECHA = {
  ENSAYISTA: "fecha_inicio",
  CANDIDATO_LOCAL: "fecha_candidato_local",
  CANDIDATO_NACIONAL: "fecha_candidato_nacional",
} as const;

type Props = {
  faseReferencia: FaseFechaCandidato;
  fechaReferencia: string;
  onFaseChange: (fase: FaseFechaCandidato) => void;
  onFechaChange: (fecha: string) => void;
};

export default function CandidatoFechas({
  faseReferencia,
  fechaReferencia,
  onFaseChange,
  onFechaChange,
}: Props) {
  const fechas = fechaReferencia
    ? calcularFechasCandidato(fechaReferencia, faseReferencia)
    : null;
  const hoy = obtenerFechaHoy();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fase_referencia" className="font-medium text-slate-700 text-sm">
            Fecha que vas a introducir <span className="text-red-500">*</span>
          </label>
          <select
            id="fase_referencia"
            value={faseReferencia}
            onChange={(event) => onFaseChange(event.target.value as FaseFechaCandidato)}
            className="input-glass w-full"
          >
            {FASES_CANDIDATO.map((fase) => (
              <option key={fase} value={fase}>{ETIQUETAS[fase]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fecha_referencia" className="font-medium text-slate-700 text-sm">
            Inicio de {ETIQUETAS[faseReferencia]} <span className="text-red-500">*</span>
          </label>
          <input
            id="fecha_referencia"
            type="date"
            value={fechaReferencia}
            onChange={(event) => onFechaChange(event.target.value)}
            className="input-glass w-full"
          />
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="mb-2 font-semibold">Fechas calculadas automáticamente</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {FASES_CANDIDATO.map((fase) => {
            const fecha = fechas?.[CAMPOS_FECHA[fase]] ?? "";
            const futura = fecha > hoy;
            return (
              <div key={fase} className="rounded-lg bg-white/70 px-3 py-2">
                <p className="font-medium">{ETIQUETAS[fase]}</p>
                <p className="text-blue-700">
                  {fecha
                    ? `${new Date(`${fecha}T12:00:00`).toLocaleDateString("es-ES")}${futura ? " · futura" : ""}`
                    : "—"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-blue-700">
          Al guardar se recalculan todas las fechas. Las etapas futuras no se guardan hasta alcanzarlas.
        </p>
      </div>
    </div>
  );
}
