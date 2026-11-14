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

export function obtenerFragmentosBusqueda(termino: string): string[] {
  if (termino.length < 4) return [];
  const fragmentos = new Set<string>();
  for (let inicio = 0; inicio <= termino.length - 3; inicio++) {
    fragmentos.add(termino.slice(inicio, inicio + 3));
  }
  return [...fragmentos];
}

function distanciaMaximaUno(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;

  let i = 0;
  let j = 0;
  let diferencias = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }

    diferencias++;
    if (diferencias > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }

  if (i < a.length || j < b.length) diferencias++;
  return diferencias <= 1;
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
      else if (termino.length >= 5 && distanciaMaximaUno(termino, palabra)) {
        mejorPuntuacion = Math.max(mejorPuntuacion, 65);
      }
    }
    if (mejorPuntuacion === 0) return 0;
    total += mejorPuntuacion;
  }

  return total / terminos.length;
}
