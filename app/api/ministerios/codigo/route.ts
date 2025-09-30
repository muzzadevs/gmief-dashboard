import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const codigo = searchParams.get("codigo");
  if (!codigo) {
    return NextResponse.json({ error: "codigo requerido" }, { status: 400 });
  }
  const ministerio = (await query(
    `SELECT id, nombre, apellidos, codigo FROM ministerios WHERE codigo = ?`,
    [codigo]
  )) as any[];
  if (!ministerio || ministerio.length === 0) {
    return NextResponse.json(null);
  }
  return NextResponse.json(ministerio[0]);
}
