/**
 * Script de seed para inicializar el sistema de autenticación.
 * Ejecutar con: npx tsx scripts/seed-auth.ts
 * 
 * Acciones:
 * 1. Crear permisos base del sistema (ver, editar, borrar)
 * 2. Crear roles base (Administrador, Lector)
 * 3. Copiar codigo → username para ministerios existentes
 * 4. Generar username temporal para candidatos sin código
 * 5. Insertar módulo "Administración" si no existe
 */

import "dotenv/config";

// Dynamic import to work with ESM/CJS
async function main() {
  // Use the generated prisma client path
  const { PrismaClient } = await import("../generated/prisma/client.js");
  const { PrismaMariaDb } = await import("@prisma/adapter-mariadb");

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const adapter = new PrismaMariaDb(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = new (PrismaClient as any)({ adapter });

  console.log("🔧 Iniciando seed de autenticación...\n");

  // ── 1. Permisos base ──
  console.log("📋 Creando permisos base...");
  const permisosBase = [
    { clave: "ver", nombre: "Ver", descripcion: "Acceder y visualizar contenido del módulo", es_sistema: true, orden: 1 },
    { clave: "editar", nombre: "Editar", descripcion: "Crear y modificar registros", es_sistema: true, orden: 2 },
    { clave: "borrar", nombre: "Borrar", descripcion: "Eliminar registros", es_sistema: true, orden: 3 },
  ];

  for (const p of permisosBase) {
    await prisma.permiso.upsert({
      where: { clave: p.clave },
      update: {},
      create: p,
    });
    console.log(`  ✅ Permiso "${p.clave}" → OK`);
  }

  // ── 2. Roles base ──
  console.log("\n👥 Creando roles base...");
  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: "Administrador" },
    update: {},
    create: { nombre: "Administrador", descripcion: "Acceso total a todos los módulos", es_sistema: true },
  });
  console.log(`  ✅ Rol "Administrador" (id=${rolAdmin.id}) → OK`);

  const rolLector = await prisma.rol.upsert({
    where: { nombre: "Lector" },
    update: {},
    create: { nombre: "Lector", descripcion: "Solo lectura en todos los módulos", es_sistema: true },
  });
  console.log(`  ✅ Rol "Lector" (id=${rolLector.id}) → OK`);

  // ── 3. Asignar permisos a roles base ──
  console.log("\n🔐 Asignando permisos a roles base...");
  const todosPermisos = await prisma.permiso.findMany();
  const todosModulos = await prisma.modulo.findMany({ where: { activo: true } });
  const permisoVer = todosPermisos.find((p) => p.clave === "ver");

  // Admin: todos los permisos en todos los módulos
  for (const modulo of todosModulos) {
    for (const permiso of todosPermisos) {
      await prisma.rolModuloPermiso.upsert({
        where: {
          rol_id_modulo_id_permiso_id: {
            rol_id: rolAdmin.id,
            modulo_id: modulo.id,
            permiso_id: permiso.id,
          },
        },
        update: {},
        create: { rol_id: rolAdmin.id, modulo_id: modulo.id, permiso_id: permiso.id },
      });
    }
  }
  console.log(`  ✅ Administrador → todos los permisos en ${todosModulos.length} módulos`);

  // Lector: solo "ver" en todos los módulos
  if (permisoVer) {
    for (const modulo of todosModulos) {
      await prisma.rolModuloPermiso.upsert({
        where: {
          rol_id_modulo_id_permiso_id: {
            rol_id: rolLector.id,
            modulo_id: modulo.id,
            permiso_id: permisoVer.id,
          },
        },
        update: {},
        create: { rol_id: rolLector.id, modulo_id: modulo.id, permiso_id: permisoVer.id },
      });
    }
    console.log(`  ✅ Lector → permiso "ver" en ${todosModulos.length} módulos`);
  }

  // ── 4. Copiar codigo → username para ministerios existentes ──
  console.log("\n👤 Generando usernames para ministerios existentes...");

  // Obreros con código
  const obreros = await prisma.ministerio.findMany({
    where: { codigo: { not: null }, username: null, activo: true },
    select: { id: true, codigo: true },
  });

  let countObreros = 0;
  for (const o of obreros) {
    if (o.codigo) {
      await prisma.ministerio.update({
        where: { id: o.id },
        data: { username: o.codigo },
      });
      countObreros++;
    }
  }
  console.log(`  ✅ ${countObreros} obreros → username = codigo`);

  // Candidatos sin código
  const candidatos = await prisma.ministerio.findMany({
    where: { tipo: "CANDIDATO", username: null, activo: true },
    select: { id: true, nombre: true, iglesia: { select: { zona: { select: { codigo: true } } } } },
  });

  let countCandidatos = 0;
  for (const c of candidatos) {
    const zonaCode = c.iglesia.zona.codigo.toUpperCase();
    const nombreNorm = c.nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();
    const codigoTemp = `${zonaCode}${nombreNorm}${c.id}`;
    await prisma.ministerio.update({
      where: { id: c.id },
      data: { codigo: codigoTemp, username: codigoTemp },
    });
    countCandidatos++;
  }
  console.log(`  ✅ ${countCandidatos} candidatos → username/codigo temporal`);

  // ── 5. Módulo Administración ──
  console.log("\n📦 Verificando módulo Administración...");
  const adminModulo = await prisma.modulo.findFirst({
    where: { href: "/modulos/administracion" },
  });

  if (!adminModulo) {
    const maxOrden = await prisma.modulo.aggregate({ _max: { orden: true } });
    await prisma.modulo.create({
      data: {
        nombre: "Administración",
        descripcion: "Gestión de usuarios, roles y permisos",
        icono: "admin",
        href: "/modulos/administracion",
        activo: true,
        orden: (maxOrden._max.orden ?? 0) + 1,
      },
    });
    console.log("  ✅ Módulo Administración creado");
  } else {
    console.log("  ✅ Módulo Administración ya existe");
  }

  console.log("\n✨ Seed de autenticación completado.\n");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error en seed:", e);
  process.exit(1);
});
