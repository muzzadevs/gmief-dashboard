export function generarCodigoSiguiente(
  codigoZona: string,
  codigosExistentes: Array<string | null>
): string | null {
  const prefijo = codigoZona.toUpperCase();
  const mayorNumero = codigosExistentes.reduce((mayor, codigo) => {
    if (!codigo?.startsWith(prefijo)) return mayor;
    const sufijo = codigo.slice(prefijo.length);
    if (!/^\d{4}$/.test(sufijo)) return mayor;
    return Math.max(mayor, Number(sufijo));
  }, 0);

  const siguienteNumero = mayorNumero + 1;
  if (siguienteNumero > 9999) return null;
  return `${prefijo}${String(siguienteNumero).padStart(4, "0")}`;
}
