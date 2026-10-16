import { NextResponse } from "next/server";
import { buildClearAuthCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", buildClearAuthCookie());
  return response;
}
