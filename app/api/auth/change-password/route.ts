import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyToken,
  hashPassword,
  generateToken,
  buildAuthCookie,
  resolverPermisos,
  COOKIE_NAME,
} from "@/lib/auth";
import type { UserInfo } from "@/types/auth";

export async function POST(req: Request) {
  try {
    // Obtener token de cookie o header
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
      return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 401 });
    }

    if (payload.isSuperAdmin) {
      return NextResponse.json(
        { ok: false, error: "El admin maestro no puede cambiar su contraseña desde aquí" },
        { status: 400 }
      );
    }

    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { ok: false, error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const hash = await hashPassword(newPassword);

    await prisma.ministerio.update({
      where: { id: payload.ministerioId! },
      data: {
        password_hash: hash,
        must_change_password: false,
      },
    });

    // Generar nuevo token sin mustChangePassword
    const newToken = generateToken({
      ministerioId: payload.ministerioId,
      username: payload.username,
      isSuperAdmin: false,
      mustChangePassword: false,
    });

    // Obtener info actualizada del usuario
    const ministerio = await prisma.ministerio.findUnique({
      where: { id: payload.ministerioId! },
      select: {
        nombre: true,
        apellidos: true,
        username: true,
        iglesia: { select: { zona_id: true, subzona_id: true } },
      },
    });

    const permisos = await resolverPermisos(payload.ministerioId!);

    const user: UserInfo = {
      ministerioId: payload.ministerioId,
      username: payload.username,
      nombre: ministerio?.nombre || "",
      apellidos: ministerio?.apellidos || null,
      isSuperAdmin: false,
      zonaId: ministerio?.iglesia.zona_id ?? null,
      subzonaId: ministerio?.iglesia.subzona_id ?? null,
      permisos,
    };

    const response = NextResponse.json({ ok: true, token: newToken, user });
    response.headers.set("Set-Cookie", buildAuthCookie(newToken));
    return response;
  } catch (error) {
    console.error("[POST /api/auth/change-password] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
