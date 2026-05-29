/**
 * Utilidad de geocodificación con Nominatim (OpenStreetMap).
 * Construye una dirección a partir de los campos de una iglesia
 * y devuelve las coordenadas lat/lng.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface AddressFields {
  direccion?: string | null;
  municipio?: string | null;
  provincia?: string | null;
  cp?: number | null;
}

interface GeocodingResult {
  latitud: number;
  longitud: number;
}

function buildAddress(fields: AddressFields): string {
  const parts: string[] = [];
  if (fields.direccion) parts.push(fields.direccion);
  if (fields.municipio) parts.push(fields.municipio);
  if (fields.provincia) parts.push(fields.provincia);
  if (fields.cp) parts.push(String(fields.cp));
  parts.push("España");
  return parts.join(", ");
}

async function queryNominatim(address: string): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    q: address,
    format: "json",
    limit: "1",
    countrycodes: "es",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      "User-Agent": "gmief-dashboard/1.0 (geocoding iglesias)",
    },
  });

  if (!response.ok) {
    console.error(`[Geocode] Nominatim HTTP error: ${response.status}`);
    return null;
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    return null;
  }

  return {
    latitud: parseFloat(data[0].lat),
    longitud: parseFloat(data[0].lon),
  };
}

/**
 * Geocodifica una dirección de iglesia.
 * Primero intenta con la dirección completa.
 * Si falla, intenta solo con municipio + provincia como fallback.
 * 
 * Devuelve null si no se puede geocodificar.
 */
export async function geocodeIglesia(fields: AddressFields): Promise<GeocodingResult | null> {
  // Necesitamos al menos municipio y provincia para geocodificar
  if (!fields.municipio || !fields.provincia) {
    return null;
  }

  // Intento 1: dirección completa
  const fullAddress = buildAddress(fields);
  const result = await queryNominatim(fullAddress);
  if (result) return result;

  // Intento 2: fallback con municipio + provincia
  const fallbackAddress = `${fields.municipio}, ${fields.provincia}, España`;
  return await queryNominatim(fallbackAddress);
}

/**
 * Verifica si los campos de dirección han cambiado y requieren re-geocodificación.
 */
export function addressFieldsChanged(
  current: AddressFields,
  previous: AddressFields
): boolean {
  return (
    current.direccion !== previous.direccion ||
    current.municipio !== previous.municipio ||
    current.provincia !== previous.provincia ||
    current.cp !== previous.cp
  );
}
