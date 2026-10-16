import { NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieToken = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const token = cookieToken || bearerToken;
  if (!token) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "Token inválido o expirado" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    ministerioId: payload.ministerioId,
    username: payload.username,
    isSuperAdmin: payload.isSuperAdmin,
    mustChangePassword: payload.mustChangePassword,
  });
}
