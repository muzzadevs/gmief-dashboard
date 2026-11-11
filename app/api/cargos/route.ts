import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached, CACHE_TTL } from "@/lib/cache";
import { compararCargos } from "@/lib/cargos";

export async function GET() {
  const cargos = await cached("cargos:all", CACHE_TTL.STATIC, () =>
    prisma.cargo.findMany()
  );
  return NextResponse.json(
    [...cargos].sort((a, b) => compararCargos(a.cargo, b.cargo))
  );
}
