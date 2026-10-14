import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarCodigoSiguiente } from "@/lib/codigoMinisterio";

// Genera el siguiente código de ministerio para una iglesia dada.
// Formato: {codigo_zona}{número_autoincremental_4_dígitos}
// El primer número disponible es 0001; 0000 se conserva para registros existentes.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const iglesiaId = searchParams.get("iglesiaId");

  if (!iglesiaId) {
    return NextResponse.json(
      { error: "iglesiaId es requerido" },
      { status: 400 }
    );
  }

  // 1. Obtener la iglesia con su zona
  const iglesia = await prisma.iglesia.findUnique({
    where: { id: Number(iglesiaId) },
    include: {
      zona: {
        select: { codigo: true },
      },
    },
  });

  if (!iglesia) {
    return NextResponse.json(
      { error: "Iglesia no encontrada" },
      { status: 404 }
    );
  }

  const codigoZona = iglesia.zona.codigo.toUpperCase();

  // 2. Buscar todos los ministerios cuyo código empiece por el código de la zona
  const ministeriosConCodigo = await prisma.ministerio.findMany({
    where: {
      codigo: {
        startsWith: codigoZona,
      },
    },
    select: {
      codigo: true,
    },
  });

  // 3. Encontrar el siguiente número autoincremental
  const codigo = generarCodigoSiguiente(
    codigoZona,
    ministeriosConCodigo.map((ministerio) => ministerio.codigo)
  );
  if (!codigo) {
    return NextResponse.json(
      { error: "Se ha alcanzado el límite máximo de códigos para esta zona (9999)" },
      { status: 409 }
    );
  }

  return NextResponse.json({ codigo, codigoZona });
}
