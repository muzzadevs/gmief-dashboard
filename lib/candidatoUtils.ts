export type FaseCandidato =
  | "ENSAYISTA"
  | "CANDIDATO_LOCAL"
  | "CANDIDATO_NACIONAL"
  | "APTO_OBRERO";

export interface FaseInfo {
  fase: FaseCandidato;
  label: string;
  progreso: number; // 0-100 dentro de la fase actual
  diasRestantes: number;
  color: string; // tailwind color class
  bgColor: string;
  textColor: string;
}

// Periodos acumulados en días
export const FASES_CANDIDATO = ["ENSAYISTA", "CANDIDATO_LOCAL", "CANDIDATO_NACIONAL"] as const;
export type FaseFechaCandidato = (typeof FASES_CANDIDATO)[number];

const ENSAYISTA_DIAS = 183;
const LOCAL_DIAS = ENSAYISTA_DIAS + 365;
const NACIONAL_DIAS = LOCAL_DIAS + 1826;
const DIAS_POR_FASE: Record<FaseFechaCandidato, number> = {
  ENSAYISTA: 0,
  CANDIDATO_LOCAL: ENSAYISTA_DIAS,
  CANDIDATO_NACIONAL: LOCAL_DIAS,
};

export interface FechasCandidato {
  fecha_inicio: string;
  fecha_candidato_local: string;
  fecha_candidato_nacional: string;
}

export interface EtapaStepperCandidato {
  fase: FaseCandidato;
  label: string;
  estado: "completada" | "actual" | "pendiente";
  diasRestantes: number;
  duracionDias: number | null;
}

function fechaUTC(fecha: string | Date): string {
  if (fecha instanceof Date) {
    if (Number.isNaN(fecha.getTime())) throw new Error("La fecha no es válida");
    return fecha.toISOString().slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error("La fecha no es válida");
  const parsed = new Date(`${fecha}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fecha) {
    throw new Error("La fecha no es válida");
  }
  return fecha;
}

function sumarDias(fecha: string, dias: number): string {
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

export function obtenerFechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function calcularFechasCandidato(
  fechaReferencia: string | Date,
  faseReferencia: FaseFechaCandidato
): FechasCandidato {
  const referencia = fechaUTC(fechaReferencia);
  const diasDesdeEnsayista = DIAS_POR_FASE[faseReferencia];
  const fechaInicio = sumarDias(referencia, -diasDesdeEnsayista);

  return {
    fecha_inicio: fechaInicio,
    fecha_candidato_local: sumarDias(fechaInicio, ENSAYISTA_DIAS),
    fecha_candidato_nacional: sumarDias(fechaInicio, LOCAL_DIAS),
  };
}

export function calcularFechasCandidatoAlcanzadas(
  fechaInicio: string | Date,
  hoy = obtenerFechaHoy()
): FechasCandidato {
  const fechas = calcularFechasCandidato(fechaInicio, "ENSAYISTA");
  return {
    fecha_inicio: fechas.fecha_inicio,
    fecha_candidato_local: fechas.fecha_candidato_local <= hoy ? fechas.fecha_candidato_local : "",
    fecha_candidato_nacional: fechas.fecha_candidato_nacional <= hoy ? fechas.fecha_candidato_nacional : "",
  };
}

export function calcularFase(fechaInicio: string | Date): FaseInfo {
  const inicio = fechaUTC(fechaInicio);
  const hoy = obtenerFechaHoy();
  const diffDias = Math.floor(
    (new Date(`${hoy}T00:00:00.000Z`).getTime() -
      new Date(`${inicio}T00:00:00.000Z`).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDias < ENSAYISTA_DIAS) {
    return {
      fase: "ENSAYISTA",
      label: "Ensayista",
      progreso: Math.min(100, Math.max(0, (diffDias / ENSAYISTA_DIAS) * 100)),
      diasRestantes: ENSAYISTA_DIAS - diffDias,
      color: "amber",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
    };
  } else if (diffDias < LOCAL_DIAS) {
    const diasEnFase = diffDias - ENSAYISTA_DIAS;
    const duracionFase = LOCAL_DIAS - ENSAYISTA_DIAS;
    return {
      fase: "CANDIDATO_LOCAL",
      label: "Candidato Local",
      progreso: Math.min(100, Math.max(0, (diasEnFase / duracionFase) * 100)),
      diasRestantes: LOCAL_DIAS - diffDias,
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    };
  } else if (diffDias < NACIONAL_DIAS) {
    const diasEnFase = diffDias - LOCAL_DIAS;
    const duracionFase = NACIONAL_DIAS - LOCAL_DIAS;
    return {
      fase: "CANDIDATO_NACIONAL",
      label: "Candidato Nacional",
      progreso: Math.min(100, Math.max(0, (diasEnFase / duracionFase) * 100)),
      diasRestantes: NACIONAL_DIAS - diffDias,
      color: "purple",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    };
  } else {
    return {
      fase: "APTO_OBRERO",
      label: "Apto para Obrero",
      progreso: 100,
      diasRestantes: 0,
      color: "emerald",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
    };
  }
}

export function calcularStepperCandidato(
  fechaInicio: string | Date
): EtapaStepperCandidato[] {
  const inicio = fechaUTC(fechaInicio);
  const hoy = obtenerFechaHoy();
  const diffDias = Math.floor(
    (new Date(`${hoy}T00:00:00.000Z`).getTime() -
      new Date(`${inicio}T00:00:00.000Z`).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const etapas: {
    fase: FaseCandidato;
    label: string;
    inicio: number;
    fin: number | null;
  }[] = [
    { fase: "ENSAYISTA", label: "Ensayista", inicio: 0, fin: ENSAYISTA_DIAS },
    { fase: "CANDIDATO_LOCAL", label: "Candidato Local", inicio: ENSAYISTA_DIAS, fin: LOCAL_DIAS },
    { fase: "CANDIDATO_NACIONAL", label: "Candidato Nacional", inicio: LOCAL_DIAS, fin: NACIONAL_DIAS },
    { fase: "APTO_OBRERO", label: "Apto para Obrero", inicio: NACIONAL_DIAS, fin: null },
  ];

  return etapas.map((etapa) => {
    const estado = etapa.fin !== null && diffDias >= etapa.fin
      ? "completada"
      : diffDias >= etapa.inicio
        ? "actual"
        : "pendiente";
    return {
      fase: etapa.fase,
      label: etapa.label,
      estado,
      diasRestantes: estado === "actual" && etapa.fin !== null
        ? etapa.fin - diffDias
        : Math.max(0, etapa.inicio - diffDias),
      duracionDias: etapa.fin === null ? null : etapa.fin - etapa.inicio,
    };
  });
}

export function formatDiasRestantes(dias: number): string {
  if (dias <= 0) return "Completado";
  const años = Math.floor(dias / 365);
  const meses = Math.floor((dias % 365) / 30);
  const diasResto = dias % 30;

  const partes: string[] = [];
  if (años > 0) partes.push(`${años}a`);
  if (meses > 0) partes.push(`${meses}m`);
  if (diasResto > 0 && años === 0) partes.push(`${diasResto}d`);

  return partes.join(" ") || "< 1d";
}
