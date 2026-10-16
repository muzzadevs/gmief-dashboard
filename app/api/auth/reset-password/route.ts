import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyToken,
  hashPassword,
  DEFAULT_PASSWORD,
  COOKIE_NAME,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Verificar que quien llama es superadmin
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
    if (!payload || !payload.isSuperAdmin) {
      return NextResponse.json(
        { ok: false, error: "Solo el administrador puede resetear contraseñas" },
        { status: 403 }
      );
    }

    const { ministerioId } = await req.json();
    if (!ministerioId) {
      return NextResponse.json(
        { ok: false, error: "ministerioId requerido" },
        { status: 400 }
      );
    }

    const hash = await hashPassword(DEFAULT_PASSWORD);

    await prisma.ministerio.update({
      where: { id: ministerioId },
      data: {
        password_hash: hash,
        must_change_password: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Contraseña reiniciada correctamente. El usuario deberá cambiarla en su próximo inicio de sesión.",
    });
  } catch (error) {
    console.error("[POST /api/auth/reset-password] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
