import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const cargos = await query(
    `SELECT id, cargo FROM cargos ORDER BY id`);
  return NextResponse.json(cargos);
}
