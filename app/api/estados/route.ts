import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  const estados = await cached("estados:all", CACHE_TTL.STATIC, () =>
    prisma.estado.findMany({ orderBy: { id: "asc" } })
  );
  return NextResponse.json(estados);
}
