import { normalizeSearchText } from "@/lib/search";

export function normalizarBusquedaDifusa(texto: string): string {
  return normalizeSearchText(texto).replace(/[gj]/g, "j");
}

export function obtenerTerminosBusqueda(consulta: string): string[] {
  return normalizeSearchText(consulta)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
}

export function obtenerVariantesBusqueda(termino: string): string[] {
  let variantes = [""];
  for (const letra of termino) {
    if (letra === "g" || letra === "j") {
      variantes = variantes.flatMap((prefijo) => [`${prefijo}g`, `${prefijo}j`]);
      if (variantes.length > 32) variantes = variantes.slice(0, 32);
    } else {
      variantes = variantes.map((prefijo) => `${prefijo}${letra}`);
    }
  }
  return [...new Set(variantes)];
}

export function puntuarCoincidencia(consulta: string, texto: string): number {
  const consultaNormalizada = normalizarBusquedaDifusa(consulta);
  const textoNormalizado = normalizarBusquedaDifusa(texto);
  const terminos = consultaNormalizada.split(/\s+/).filter(Boolean);
  const palabras = textoNormalizado.split(/[^a-z0-9]+/).filter(Boolean);
  if (terminos.length === 0 || palabras.length === 0) return 0;

  let total = 0;
  for (const termino of terminos) {
    let mejorPuntuacion = 0;
    for (const palabra of palabras) {
      if (palabra === termino) mejorPuntuacion = Math.max(mejorPuntuacion, 100);
      else if (palabra.startsWith(termino)) mejorPuntuacion = Math.max(mejorPuntuacion, 90);
      else if (palabra.includes(termino)) mejorPuntuacion = Math.max(mejorPuntuacion, 80);
    }
    if (mejorPuntuacion === 0) return 0;
    total += mejorPuntuacion;
  }

  return total / terminos.length;
}
