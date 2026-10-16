import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "fc_auth_token";

/** Rutas que NO requieren autenticación */
const PUBLIC_PATHS = [
  "/",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/login-fotos",
];

/** Prefijos que siempre son públicos */
const PUBLIC_PREFIXES = [
  "/_next",
  "/loginFotos",
  "/faviconFC",
  "/FCLogoTemporal",
];

/** Extensiones de archivo estático que siempre son públicas */
const PUBLIC_EXTENSIONS = [".ico", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".css", ".js", ".map"];

function isPublicRoute(pathname: string): boolean {
  // Rutas exactas públicas
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // Prefijos públicos
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;

  // Extensiones de archivos estáticos
  if (PUBLIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return true;

  return false;
}

/**
 * Decodifica un JWT SIN verificar firma (la verificación completa
 * se hace en las API routes con la lib de Node).
 * Solo comprobamos que existe y no ha expirado para decidir
 * si redirigir al login — es suficiente para middleware Edge.
 */
function isTokenNotExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas → dejar pasar
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Comprobar cookie de autenticación
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token || !isTokenNotExpired(token)) {
    // Si es una API → responder 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "NO_AUTH" },
        { status: 401 }
      );
    }

    // Si es una página → redirigir al login
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files inside _next
     * https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
