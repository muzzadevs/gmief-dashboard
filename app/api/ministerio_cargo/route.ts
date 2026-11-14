import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ministerioDentroDeAlcance, resolverAlcanceZona } from "@/lib/auth";
import { requireGestionMinisteriosPermission } from "@/lib/gestionMinisteriosPermissions";
import { registrarAuditoria } from "@/lib/auditoria";

export async function POST(req: Request) {
  const denied = await requireGestionMinisteriosPermission(req, "editar", {
    allowZoneScopedEdit: true,
  });
  if (denied) return denied;

  const { ministerio_id, cargos } = await req.json();
  if (!ministerio_id || !Array.isArray(cargos) || cargos.length === 0) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  const scope = await resolverAlcanceZona(req);
  if (!(await ministerioDentroDeAlcance(scope, Number(ministerio_id)))) {
    return NextResponse.json({ error: "Ministerio fuera de tu zona o subzona" }, { status: 403 });
  }

  // Insertar todos los cargos para el ministerio
  await prisma.ministerioCargo.createMany({
    data: cargos.map((cargo_id: number) => ({
      ministerio_id,
      cargo_id,
    })),
  });

  const [ministerio, cargosAsignados] = await Promise.all([
    prisma.ministerio.findUnique({
      where: { id: Number(ministerio_id) },
      select: { nombre: true, apellidos: true, codigo: true },
    }),
    prisma.cargo.findMany({
      where: { id: { in: cargos } },
      select: { cargo: true },
    }),
  ]);
  const nombreMinisterio = ministerio
    ? [ministerio.nombre, ministerio.apellidos].filter(Boolean).join(" ")
    : "la persona seleccionada";

  await registrarAuditoria(req, {
    accion: "ASIGNAR",
    entidad: "Cargos de ministerio",
    entidadId: ministerio_id,
    identificacion: ministerio
      ? `${nombreMinisterio}${ministerio.codigo ? ` · Código ${ministerio.codigo}` : ""}`
      : undefined,
    resumen: `Asignó los cargos ${cargosAsignados.map((cargo) => cargo.cargo).join(", ")} a ${nombreMinisterio}`,
    campos: ["cargos"],
    detalles: { cantidad_cargos: cargos.length },
    cambios: {
      cargos: {
        anterior: null,
        nuevo: cargosAsignados.map((cargo) => cargo.cargo).sort().join(", ") || null,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
