/**
 * Script para geocodificar las iglesias existentes en la BDD.
 * Construye la dirección completa a partir de: direccion, municipio, provincia, cp
 * y usa Nominatim (OpenStreetMap) para obtener lat/lng.
 * 
 * Delay de 2 segundos entre peticiones para respetar rate limits de Nominatim.
 * 
 * Ejecutar: npx tsx scripts/geocode-iglesias.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL no está configurada");
  process.exit(1);
}

const adapter = new PrismaMariaDb(url);
const prisma = new PrismaClient({ adapter });

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface IglesiaData {
  id: number;
  nombre: string;
  direccion: string | null;
  municipio: string | null;
  provincia: string | null;
  cp: number | null;
}

function buildAddress(iglesia: IglesiaData): string {
  const parts: string[] = [];
  if (iglesia.direccion) parts.push(iglesia.direccion);
  if (iglesia.municipio) parts.push(iglesia.municipio);
  if (iglesia.provincia) parts.push(iglesia.provincia);
  if (iglesia.cp) parts.push(String(iglesia.cp));
  parts.push("España");
  return parts.join(", ");
}

interface NominatimResult {
  lat: string;
  lon: string;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
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
    throw new Error(`Nominatim HTTP error: ${response.status}`);
  }

  const data: NominatimResult[] = await response.json();

  if (data.length === 0) {
    return null;
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
  };
}

async function main() {
  console.log("🔍 Buscando iglesias con dirección completa pero sin coordenadas...\n");

  const iglesias = await prisma.iglesia.findMany({
    where: {
      direccion: { not: null },
      municipio: { not: null },
      provincia: { not: null },
      cp: { not: null },
      OR: [
        { latitud: null },
        { longitud: null },
      ],
    },
  });

  if (iglesias.length === 0) {
    console.log("✅ No hay iglesias pendientes de geocodificar.");
    await prisma.$disconnect();
    return;
  }

  console.log(`📍 Se encontraron ${iglesias.length} iglesias para geocodificar.\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < iglesias.length; i++) {
    const iglesia = iglesias[i] as IglesiaData;
    const address = buildAddress(iglesia);

    console.log(`[${i + 1}/${iglesias.length}] ${iglesia.nombre}`);
    console.log(`   📫 Dirección: ${address}`);

    try {
      const coords = await geocodeAddress(address);

      if (coords) {
        await prisma.iglesia.update({
          where: { id: iglesia.id },
          data: {
            latitud: coords.lat,
            longitud: coords.lon,
          },
        });
        console.log(`   ✅ Lat: ${coords.lat}, Lng: ${coords.lon}`);
        success++;
      } else {
        // Si no encuentra con dirección completa, intentar solo con municipio + provincia
        console.log(`   ⚠️  No encontrada. Intentando con municipio + provincia...`);
        const fallbackAddress = `${iglesia.municipio}, ${iglesia.provincia}, España`;
        const fallbackCoords = await geocodeAddress(fallbackAddress);

        if (fallbackCoords) {
          await prisma.iglesia.update({
            where: { id: iglesia.id },
            data: {
              latitud: fallbackCoords.lat,
              longitud: fallbackCoords.lon,
            },
          });
          console.log(`   ✅ (fallback) Lat: ${fallbackCoords.lat}, Lng: ${fallbackCoords.lon}`);
          success++;
        } else {
          console.log(`   ❌ No se pudo geocodificar`);
          failed++;
        }

        // Extra wait for fallback request
        await sleep(2000);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ Error: ${msg}`);
      failed++;
    }

    // Wait 2 seconds between requests
    if (i < iglesias.length - 1) {
      console.log(`   ⏳ Esperando 2 segundos...\n`);
      await sleep(2000);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`📊 Resumen:`);
  console.log(`   ✅ Geocodificadas: ${success}`);
  console.log(`   ❌ Fallidas: ${failed}`);
  console.log(`   📍 Total procesadas: ${iglesias.length}`);
  console.log(`${"=".repeat(50)}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
