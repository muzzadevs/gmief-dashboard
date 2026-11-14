import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminPermissions";
import { resolverIdentificacionAuditoria } from "@/lib/auditoria";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 25;

export async function GET(request: Request) {
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const paginaSolicitada = Number(searchParams.get("pagina"));
  const pagina = Number.isSafeInteger(paginaSolicitada) && paginaSolicitada > 0
    ? Math.min(paginaSolicitada, 1_000_000)
    : 1;
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const accion = searchParams.get("accion")?.trim();
  const entidad = searchParams.get("entidad")?.trim();
  const usuario = searchParams.get("usuario")?.trim();
  const busqueda = searchParams.get("busqueda")?.trim();

  const fechaValida = (valor: string | null): boolean =>
    !valor || (
      /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
      Number.isFinite(new Date(`${valor}T00:00:00.000Z`).getTime()) &&
      new Date(`${valor}T00:00:00.000Z`).toISOString().slice(0, 10) === valor
    );
  if (!fechaValida(desde) || !fechaValida(hasta) || (desde && hasta && desde > hasta)) {
    return NextResponse.json(
      { ok: false, error: "El intervalo de fechas no es válido" },
      { status: 400 }
    );
  }

  const where = {
    ...(accion ? { accion } : {}),
    ...(entidad ? { entidad } : {}),
    ...(usuario ? { actor_username: usuario } : {}),
    ...(desde || hasta
      ? {
          fecha: {
            ...(desde ? { gte: new Date(`${desde}T00:00:00.000Z`) } : {}),
            ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(busqueda
      ? {
          OR: [
            { resumen: { contains: busqueda } },
            { actor_nombre: { contains: busqueda } },
            { actor_username: { contains: busqueda } },
          ],
        }
      : {}),
  };

  try {
    const [registros, total, usuarios, entidades] = await Promise.all([
      prisma.auditoria.findMany({
        where,
        orderBy: [{ fecha: "desc" }, { id: "desc" }],
        skip: (pagina - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.auditoria.count({ where }),
      prisma.auditoria.findMany({
        distinct: ["actor_username"],
        select: { actor_username: true, actor_nombre: true },
        orderBy: { actor_username: "asc" },
      }),
      prisma.auditoria.findMany({
        distinct: ["entidad"],
        select: { entidad: true },
        orderBy: { entidad: "asc" },
      }),
    ]);
    const registrosLegibles = await Promise.all(
      registros.map(async (registro) => {
        const detalles =
          registro.detalles &&
          typeof registro.detalles === "object" &&
          !Array.isArray(registro.detalles)
            ? Object.fromEntries(Object.entries(registro.detalles))
            : {};
        if (
          typeof detalles.identificacion === "string" ||
          !/\bID\s+\d+\b/i.test(registro.resumen)
        ) {
          return registro;
        }
        const ministerioRelacionado = detalles.ministerio_id;
        const identificacion =
          registro.entidad === "Observación de ministerio" &&
          (typeof ministerioRelacionado === "number" ||
            typeof ministerioRelacionado === "string")
            ? await resolverIdentificacionAuditoria("Ministerio", ministerioRelacionado)
            : await resolverIdentificacionAuditoria(registro.entidad, registro.entidad_id);
        return identificacion
          ? { ...registro, detalles: { ...detalles, identificacion } }
          : registro;
      })
    );

    return NextResponse.json({
      ok: true,
      data: {
        registros: registrosLegibles,
        total,
        pagina,
        paginas: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        usuarios,
        entidades: entidades.map((item) => item.entidad),
      },
    });
  } catch (error) {
    console.error("[GET /api/auditoria] Error:", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo consultar el registro de auditoría" },
      { status: 500 }
    );
  }
}
