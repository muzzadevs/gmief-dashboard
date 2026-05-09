import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { ministerio_id, cargos } = await req.json();
  if (!ministerio_id || !Array.isArray(cargos) || cargos.length === 0) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // Insertar todos los cargos para el ministerio
  await prisma.ministerioCargo.createMany({
    data: cargos.map((cargo_id: number) => ({
      ministerio_id,
      cargo_id,
    })),
  });

  return NextResponse.json({ ok: true });
}
