import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PASSWORD,
  isSuperAdminCredentials,
  verifyPassword,
  hashPassword,
  generateToken,
  buildAuthCookie,
  resolverPermisos,
} from "@/lib/auth";
import type { LoginResponse, UserInfo } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json<LoginResponse>(
        { ok: false, error: "Usuario y contraseña requeridos" },
        { status: 400 }
      );
    }

    const usernameNorm = username.trim();

    // ── 1. Comprobar admin maestro ──
    if (isSuperAdminCredentials(usernameNorm, password)) {
      const token = generateToken({
        ministerioId: null,
        username: usernameNorm,
        isSuperAdmin: true,
        mustChangePassword: false,
      });

      // Super admin: todos los permisos
      const modulos = await prisma.modulo.findMany({ where: { activo: true }, select: { id: true } });
      const permisos = await prisma.permiso.findMany({ select: { clave: true } });
      const permisosClaves = permisos.map((p) => p.clave);

      const allPermisos: Record<number, string[]> = {};
      for (const m of modulos) {
        allPermisos[m.id] = permisosClaves;
      }

      const user: UserInfo = {
        ministerioId: null,
        username: usernameNorm,
        nombre: "Administrador",
        apellidos: "Sistema",
        isSuperAdmin: true,
        zonaId: null,
        subzonaId: null,
        permisos: allPermisos,
      };

      const response = NextResponse.json<LoginResponse>({
        ok: true,
        token,
        user,
        mustChangePassword: false,
      });

      response.headers.set("Set-Cookie", buildAuthCookie(token));
      return response;
    }

    // ── 2. Buscar ministerio por username ──
    const ministerio = await prisma.ministerio.findUnique({
      where: { username: usernameNorm },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        username: true,
        password_hash: true,
        must_change_password: true,
        activo: true,
        iglesia: {
          select: { zona_id: true, subzona_id: true },
        },
      },
    });

    if (!ministerio) {
      return NextResponse.json<LoginResponse>(
        { ok: false, error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    if (!ministerio.activo) {
      return NextResponse.json<LoginResponse>(
        { ok: false, error: "Esta cuenta está desactivada" },
        { status: 403 }
      );
    }

    // ── 3. Verificar contraseña ──
    let passwordValid = false;

    if (ministerio.password_hash) {
      // Tiene password personalizada → verificar con bcrypt
      passwordValid = await verifyPassword(password, ministerio.password_hash);
    } else {
      // No tiene password_hash → usar la contraseña por defecto
      passwordValid = password === DEFAULT_PASSWORD;

      // Si coincide, hashear y guardar para futuras verificaciones
      if (passwordValid) {
        const hash = await hashPassword(DEFAULT_PASSWORD);
        await prisma.ministerio.update({
          where: { id: ministerio.id },
          data: { password_hash: hash },
        });
      }
    }

    if (!passwordValid) {
      return NextResponse.json<LoginResponse>(
        { ok: false, error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    // ── 4. Resolver permisos ──
    const permisos = await resolverPermisos(ministerio.id);

    // ── 5. Generar token ──
    const mustChange = ministerio.must_change_password;
    const token = generateToken({
      ministerioId: ministerio.id,
      username: ministerio.username!,
      isSuperAdmin: false,
      mustChangePassword: mustChange,
    });

    const user: UserInfo = {
      ministerioId: ministerio.id,
      username: ministerio.username!,
      nombre: ministerio.nombre,
      apellidos: ministerio.apellidos,
      isSuperAdmin: false,
      zonaId: ministerio.iglesia.zona_id,
      subzonaId: ministerio.iglesia.subzona_id,
      permisos,
    };

    const response = NextResponse.json<LoginResponse>({
      ok: true,
      token,
      user,
      mustChangePassword: mustChange,
    });

    response.headers.set("Set-Cookie", buildAuthCookie(token));
    return response;
  } catch (error) {
    console.error("[POST /api/auth/login] Error:", error);
    return NextResponse.json<LoginResponse>(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
