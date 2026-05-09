import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const codigo = searchParams.get("codigo");
  if (!codigo) {
    return NextResponse.json({ error: "codigo requerido" }, { status: 400 });
  }

  const ministerio = await prisma.ministerio.findUnique({
    where: { codigo },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      codigo: true,
    },
  });

  if (!ministerio) {
    return NextResponse.json(null);
  }

  return NextResponse.json(ministerio);
}
