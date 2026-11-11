export function compararCargos(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}
