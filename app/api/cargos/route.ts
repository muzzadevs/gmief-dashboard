import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cargos = await prisma.cargo.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(cargos);
}
