import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Genera el siguiente código de ministerio para una iglesia dada.
// Formato: {codigo_zona}{número_autoincremental_3_dígitos}
// Ejemplo: Si la zona tiene código "ABC", el primer ministerio será "ABC000", luego "ABC001", etc.
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
    orderBy: {
      codigo: "desc",
    },
  });

  // 3. Encontrar el siguiente número autoincremental
  let nextNumber = 0;

  if (ministeriosConCodigo.length > 0) {
    // Extraer las partes numéricas de los códigos existentes
    const numbers = ministeriosConCodigo
      .map((m) => {
        if (!m.codigo) return -1;
        const numPart = m.codigo.slice(codigoZona.length);
        const parsed = parseInt(numPart, 10);
        return isNaN(parsed) ? -1 : parsed;
      })
      .filter((n) => n >= 0);

    if (numbers.length > 0) {
      nextNumber = Math.max(...numbers) + 1;
    }
  }

  if (nextNumber > 999) {
    return NextResponse.json(
      { error: "Se ha alcanzado el límite máximo de códigos para esta zona (999)" },
      { status: 409 }
    );
  }

  // 4. Generar el código con el número en formato de 3 dígitos
  const codigo = `${codigoZona}${String(nextNumber).padStart(3, "0")}`;

  return NextResponse.json({ codigo, codigoZona });
}
