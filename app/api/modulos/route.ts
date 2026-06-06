import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const modulos = await prisma.modulo.findMany({
      orderBy: { orden: "asc" },
    });

    return NextResponse.json({ ok: true, data: modulos }, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET /api/modulos] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "DB_ERROR",
        message: "Error al obtener módulos",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
