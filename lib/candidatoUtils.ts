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
const ENSAYISTA_DIAS = 183; // ~6 meses
const LOCAL_DIAS = ENSAYISTA_DIAS + 365; // 6m + 1 año = ~548 días
const NACIONAL_DIAS = LOCAL_DIAS + 1826; // 6m + 1a + 5 años = ~2374 días

export function calcularFase(fechaInicio: string | Date): FaseInfo {
  const inicio = new Date(fechaInicio);
  const hoy = new Date();

  // Normalizar a medianoche para cálculos consistentes
  inicio.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  const diffMs = hoy.getTime() - inicio.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

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
