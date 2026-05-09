import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const estados = await prisma.estado.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(estados);
}
