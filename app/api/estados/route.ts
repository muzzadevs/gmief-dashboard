import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const estados = await query(
    `SELECT id, nombre FROM estados ORDER BY id`);
  return NextResponse.json(estados);
}
