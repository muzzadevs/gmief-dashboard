"use client";

import {
  calcularFechaAptoObrero,
  calcularFechasCandidato,
  calcularFase,
  FASES_CANDIDATO,
  type FaseFechaCandidato,
  type FaseCandidato,
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

const ETAPAS = [
  { fase: "ENSAYISTA", etiqueta: "Ensayista" },
  { fase: "CANDIDATO_LOCAL", etiqueta: "Cand. Local" },
  { fase: "CANDIDATO_NACIONAL", etiqueta: "Candidato Nacional" },
  { fase: "APTO_OBRERO", etiqueta: "Apto para obrero" },
] as const satisfies readonly { fase: FaseCandidato; etiqueta: string }[];

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
  const fechasEtapas = fechas
    ? {
        ...fechas,
        fecha_apto_obrero: calcularFechaAptoObrero(fechas.fecha_inicio),
      }
    : null;
  const faseInfo = fechas ? calcularFase(fechas.fecha_inicio) : null;
  const indiceFaseActual = faseInfo
    ? ETAPAS.findIndex((etapa) => etapa.fase === faseInfo.fase)
    : -1;

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
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,4.2fr)_minmax(0,1.4fr)]">
          {ETAPAS.map((etapa, index) => {
            const fecha = etapa.fase === "APTO_OBRERO"
              ? fechasEtapas?.fecha_apto_obrero ?? ""
              : fechasEtapas?.[CAMPOS_FECHA[etapa.fase]] ?? "";
            const estado = index < indiceFaseActual
              ? "completada"
              : index === indiceFaseActual
                ? "actual"
                : "pendiente";
            const estilos = estado === "completada"
              ? "border-teal-200 bg-teal-100 text-teal-900"
              : estado === "actual"
                ? "border-amber-200 bg-white text-amber-950"
                : "border-slate-200 bg-slate-100 text-slate-500";
            const fondoActual = estado === "actual" && faseInfo
              ? `linear-gradient(to right, #ead2a4 ${faseInfo.progreso}%, #ffffff ${faseInfo.progreso}%)`
              : undefined;
            return (
              <div
                key={etapa.fase}
                className={`rounded-lg border px-3 py-2 ${estilos} ${fecha ? "" : "opacity-60"}`}
                style={fondoActual ? { background: fondoActual } : undefined}
                aria-current={estado === "actual" ? "step" : undefined}
                aria-disabled={!fecha}
              >
                <p className="font-medium">{etapa.etiqueta}</p>
                <p>
                  {fecha
                    ? new Date(`${fecha}T12:00:00`).toLocaleDateString("es-ES")
                    : "—"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-blue-700">
          {fechas
            ? "Al guardar se recalculan las fechas. Las etapas futuras no se guardan hasta alcanzarlas."
            : "Introduce la fecha de inicio para calcular las fechas de las etapas."}
        </p>
      </div>
    </div>
  );
}
