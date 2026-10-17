import { NextResponse } from "next/server";
import { ADMIN_TOKEN } from "@/store/adminStore";
import { getAdminTableDefinitions } from "@/lib/adminDynamicTables";
import { requireSuperAdmin } from "@/lib/adminPermissions";

export async function GET(request: Request) {
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

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
