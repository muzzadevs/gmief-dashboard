import { NextResponse } from "next/server";
import { ADMIN_TOKEN } from "@/store/adminStore";
import { getAdminTableDefinitions } from "@/lib/adminDynamicTables";

export async function GET(request: Request) {
  // Verify admin token
  const token = request.headers.get("X-Admin-Token");
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const tableDefinitions = await getAdminTableDefinitions();
  const tables = tableDefinitions.map((def) => ({
    key: def.key,
    label: def.label,
    model: def.model,
    columnCount: def.columns.length,
  }));

  return NextResponse.json({ ok: true, data: tables });
}
