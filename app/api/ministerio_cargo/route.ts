import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ministerioDentroDeAlcance, resolverAlcanceZona } from "@/lib/auth";

export async function POST(req: Request) {
  const { ministerio_id, cargos } = await req.json();
  if (!ministerio_id || !Array.isArray(cargos) || cargos.length === 0) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  const scope = await resolverAlcanceZona(req);
  if (!(await ministerioDentroDeAlcance(scope, Number(ministerio_id)))) {
    return NextResponse.json({ error: "Ministerio fuera de tu zona o subzona" }, { status: 403 });
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
