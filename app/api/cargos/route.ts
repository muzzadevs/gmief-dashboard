import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  const cargos = await cached("cargos:all", CACHE_TTL.STATIC, () =>
    prisma.cargo.findMany({ orderBy: { id: "asc" } })
  );
  return NextResponse.json(cargos);
}
