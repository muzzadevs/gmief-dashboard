/**
 * Caché en memoria simple con TTL para datos que cambian poco.
 * Evita consultas redundantes a la base de datos remota.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Obtiene un valor de la caché o ejecuta la función para obtenerlo.
 * @param key - Clave única de caché
 * @param ttlMs - Tiempo de vida en milisegundos (por defecto 5 minutos)
 * @param fetcher - Función async que obtiene el dato si no está en caché
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  const data = await fetcher();
  store.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

/**
 * Invalida una entrada específica de la caché.
 */
export function invalidateCache(key: string): void {
  store.delete(key);
}

/**
 * Invalida todas las entradas que empiecen con un prefijo.
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

/**
 * Limpia toda la caché.
 */
export function clearCache(): void {
  store.clear();
}

// TTLs predefinidos
export const CACHE_TTL = {
  /** Datos que casi nunca cambian: cargos, estados (10 minutos) */
  STATIC: 10 * 60 * 1000,
  /** Datos que cambian con moderación: módulos (5 minutos) */
  MODERATE: 5 * 60 * 1000,
  /** Datos que cambian frecuentemente: zonas, stats (2 minutos) */
  FREQUENT: 2 * 60 * 1000,
} as const;
