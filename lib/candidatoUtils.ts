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

export const FASES_CANDIDATO = ["ENSAYISTA", "CANDIDATO_LOCAL", "CANDIDATO_NACIONAL"] as const;
export type FaseFechaCandidato = (typeof FASES_CANDIDATO)[number];

const MESES_HASTA_LOCAL = 6;
const MESES_HASTA_NACIONAL = 18;
const MESES_NACIONAL_A_OBRERO = 60;
const DESPLAZAMIENTOS_MESES: Record<
  FaseFechaCandidato,
  { inicio: number; local: number; nacional: number }
> = {
  ENSAYISTA: { inicio: 0, local: MESES_HASTA_LOCAL, nacional: MESES_HASTA_NACIONAL },
  CANDIDATO_LOCAL: { inicio: -MESES_HASTA_LOCAL, local: 0, nacional: 12 },
  CANDIDATO_NACIONAL: { inicio: -MESES_HASTA_NACIONAL, local: -12, nacional: 0 },
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
  posicion: number;
  progreso: number;
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

function sumarMeses(fecha: string, meses: number): string {
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  const diaOriginal = resultado.getUTCDate();
  resultado.setUTCDate(1);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  const ultimoDiaDelMes = new Date(
    Date.UTC(resultado.getUTCFullYear(), resultado.getUTCMonth() + 1, 0)
  ).getUTCDate();
  resultado.setUTCDate(Math.min(diaOriginal, ultimoDiaDelMes));
  return resultado.toISOString().slice(0, 10);
}

function diferenciaDias(inicio: string, fin: string): number {
  return Math.round(
    (new Date(`${fin}T00:00:00.000Z`).getTime() -
      new Date(`${inicio}T00:00:00.000Z`).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function obtenerFechasEtapas(fechaInicio: string): {
  fechaInicio: string;
  fechaLocal: string;
  fechaNacional: string;
  fechaAptoObrero: string;
} {
  const fechas = calcularFechasCandidato(fechaInicio, "ENSAYISTA");
  return {
    fechaInicio: fechas.fecha_inicio,
    fechaLocal: fechas.fecha_candidato_local,
    fechaNacional: fechas.fecha_candidato_nacional,
    fechaAptoObrero: sumarMeses(fechas.fecha_candidato_nacional, MESES_NACIONAL_A_OBRERO),
  };
}

export function obtenerFechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function calcularFechasCandidato(
  fechaReferencia: string | Date,
  faseReferencia: FaseFechaCandidato
): FechasCandidato {
  const referencia = fechaUTC(fechaReferencia);
  const desplazamientos = DESPLAZAMIENTOS_MESES[faseReferencia];

  return {
    fecha_inicio: sumarMeses(referencia, desplazamientos.inicio),
    fecha_candidato_local: sumarMeses(referencia, desplazamientos.local),
    fecha_candidato_nacional: sumarMeses(referencia, desplazamientos.nacional),
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
  const fechas = obtenerFechasEtapas(inicio);

  if (hoy < fechas.fechaLocal) {
    const duracionDias = diferenciaDias(fechas.fechaInicio, fechas.fechaLocal);
    const diasTranscurridos = diferenciaDias(fechas.fechaInicio, hoy);
    return {
      fase: "ENSAYISTA",
      label: "Ensayista",
      progreso: Math.min(100, Math.max(0, (diasTranscurridos / duracionDias) * 100)),
      diasRestantes: diferenciaDias(hoy, fechas.fechaLocal),
      color: "amber",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
    };
  } else if (hoy < fechas.fechaNacional) {
    const duracionDias = diferenciaDias(fechas.fechaLocal, fechas.fechaNacional);
    const diasTranscurridos = diferenciaDias(fechas.fechaLocal, hoy);
    return {
      fase: "CANDIDATO_LOCAL",
      label: "Candidato Local",
      progreso: Math.min(100, Math.max(0, (diasTranscurridos / duracionDias) * 100)),
      diasRestantes: diferenciaDias(hoy, fechas.fechaNacional),
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    };
  } else if (hoy < fechas.fechaAptoObrero) {
    const duracionDias = diferenciaDias(fechas.fechaNacional, fechas.fechaAptoObrero);
    const diasTranscurridos = diferenciaDias(fechas.fechaNacional, hoy);
    return {
      fase: "CANDIDATO_NACIONAL",
      label: "Candidato Nacional",
      progreso: Math.min(100, Math.max(0, (diasTranscurridos / duracionDias) * 100)),
      diasRestantes: diferenciaDias(hoy, fechas.fechaAptoObrero),
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
  const fechas = obtenerFechasEtapas(inicio);
  const etapas: {
    fase: FaseCandidato;
    label: string;
    inicio: string;
    fin: string | null;
  }[] = [
    { fase: "ENSAYISTA", label: "Ensayista", inicio: fechas.fechaInicio, fin: fechas.fechaLocal },
    { fase: "CANDIDATO_LOCAL", label: "Candidato Local", inicio: fechas.fechaLocal, fin: fechas.fechaNacional },
    { fase: "CANDIDATO_NACIONAL", label: "Candidato Nacional", inicio: fechas.fechaNacional, fin: fechas.fechaAptoObrero },
    { fase: "APTO_OBRERO", label: "Apto para Obrero", inicio: fechas.fechaAptoObrero, fin: null },
  ];

  const duracionTotal = diferenciaDias(fechas.fechaInicio, fechas.fechaAptoObrero);
  return etapas.map((etapa) => {
    const estado = etapa.fin !== null && hoy >= etapa.fin
      ? "completada"
      : hoy >= etapa.inicio
        ? "actual"
        : "pendiente";
    const duracionDias = etapa.fin === null
      ? null
      : diferenciaDias(etapa.inicio, etapa.fin);
    const diasEnEtapa = diferenciaDias(etapa.inicio, hoy);
    return {
      fase: etapa.fase,
      label: etapa.label,
      estado,
      diasRestantes: estado === "actual" && etapa.fin !== null
        ? diferenciaDias(hoy, etapa.fin)
        : estado === "pendiente"
          ? diferenciaDias(hoy, etapa.inicio)
          : 0,
      duracionDias,
      posicion: (diferenciaDias(fechas.fechaInicio, etapa.inicio) / duracionTotal) * 100,
      progreso: etapa.fin === null
        ? 0
        : estado === "completada"
          ? 100
          : estado === "actual"
            ? duracionDias === null
              ? 0
              : Math.min(100, Math.max(0, (diasEnEtapa / duracionDias) * 100))
            : 0,
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
