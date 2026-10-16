import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

function getToken(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieToken = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return cookieToken || bearerToken || null;
}

// GET: Listar usuarios (ministerios) con info de auth
export async function GET(req: Request) {
  const token = getToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isSuperAdmin) {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const ministerios = await prisma.ministerio.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      username: true,
      codigo: true,
      tipo: true,
      activo: true,
      must_change_password: true,
      password_hash: true,
      cargos: {
        include: { cargo: { select: { id: true, cargo: true } } },
      },
    },
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
  });

  // Para cada ministerio, obtener los roles derivados de sus cargos
  const allRolCargos = await prisma.rolCargo.findMany({
    include: { rol: { select: { nombre: true } } },
  });

  const cargoRolMap = new Map<number, string[]>();
  for (const rc of allRolCargos) {
    if (!cargoRolMap.has(rc.cargo_id)) cargoRolMap.set(rc.cargo_id, []);
    const arr = cargoRolMap.get(rc.cargo_id)!;
    if (!arr.includes(rc.rol.nombre)) arr.push(rc.rol.nombre);
  }

  const result = ministerios.map((m) => {
    const cargoNames = m.cargos.map((c) => c.cargo.cargo);
    const rolesSet = new Set<string>();
    for (const c of m.cargos) {
      const roles = cargoRolMap.get(c.cargo.id) || [];
      roles.forEach((r) => rolesSet.add(r));
    }
    return {
      id: m.id,
      nombre: m.nombre,
      apellidos: m.apellidos,
      username: m.username,
      codigo: m.codigo,
      tipo: m.tipo,
      activo: m.activo,
      must_change_password: m.must_change_password,
      tiene_password: !!m.password_hash,
      cargos: cargoNames,
      roles: [...rolesSet],
    };
  });

  return NextResponse.json({ ok: true, data: result });
}
