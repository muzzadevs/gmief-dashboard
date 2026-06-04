import { NextResponse } from "next/server";
import { ADMIN_TOKEN } from "@/store/adminStore";
import { TABLE_DEFINITIONS } from "@/lib/adminTableDefs";

export async function GET(request: Request) {
  // Verify admin token
  const token = request.headers.get("X-Admin-Token");
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const tables = Object.entries(TABLE_DEFINITIONS).map(([key, def]) => ({
    key,
    label: def.label,
    model: def.model,
    columnCount: def.columns.length,
  }));

  return NextResponse.json({ ok: true, data: tables });
}
