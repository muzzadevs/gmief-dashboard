import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { validarDNI, validarNIE } from "@/lib/dniUtils";
import { calcularFase } from "@/lib/candidatoUtils";

// Obtener un ministerio por id (con cargos y candidato_detalle)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const [ministerio, imagenCheck] = await Promise.all([
    prisma.ministerio.findUnique({
      where: { id: Number(id) },
      omit: { imagen: true },
      include: {
        cargos: { select: { cargo_id: true } },
        candidato_detalle: {
          select: { fecha_inicio: true, fecha_candidato_nacional: true, notas: true },
        },
      },
    }),
    // Consulta ligera: solo verifica existencia de imagen sin traer el blob completo
    prisma.ministerio.count({
      where: { id: Number(id), imagen: { not: null } },
    }).then((count) => count > 0),
  ]);

  if (!ministerio) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // Auto-detectar y persistir fecha_candidato_nacional (fire-and-forget, no bloquea la respuesta)
  if (
    ministerio.tipo === "CANDIDATO" &&
    ministerio.candidato_detalle?.fecha_inicio &&
    !ministerio.candidato_detalle.fecha_candidato_nacional
  ) {
    const fase = calcularFase(ministerio.candidato_detalle.fecha_inicio);
    if (fase.fase === "CANDIDATO_NACIONAL" || fase.fase === "APTO_OBRERO") {
      const fechaHoy = new Date();
      fechaHoy.setHours(0, 0, 0, 0);
      // Fire-and-forget: no bloqueamos la respuesta
      prisma.candidatoDetalle.update({
        where: { ministerio_id: ministerio.id },
        data: { fecha_candidato_nacional: fechaHoy },
      }).catch((err) => console.error("[GET /api/ministerios/[id]] Error auto-persist:", err));
      ministerio.candidato_detalle.fecha_candidato_nacional = fechaHoy;
    }
  }

  // Desencriptar DNI si existe
  let dni: string | null = null;
  if (ministerio.dni_encrypted) {
    try {
      dni = decrypt(ministerio.dni_encrypted);
    } catch {
      dni = null;
    }
  }

  // Desencriptar NIE si existe
  let nie: string | null = null;
  if (ministerio.nie_encrypted) {
    try {
      nie = decrypt(ministerio.nie_encrypted);
    } catch {
      nie = null;
    }
  }

  return NextResponse.json({
    ...ministerio,
    has_imagen: imagenCheck,
    dni,
    nie,
    dni_encrypted: undefined, // No enviar el dato encriptado al frontend
    nie_encrypted: undefined, // No enviar el dato encriptado al frontend
    cargos: ministerio.cargos.map((c: { cargo_id: number }) => c.cargo_id).join(",") || null,
    fecha_inicio: ministerio.candidato_detalle?.fecha_inicio
      ? new Date(ministerio.candidato_detalle.fecha_inicio).toISOString().split("T")[0]
      : null,
    fecha_candidato_nacional: ministerio.candidato_detalle?.fecha_candidato_nacional
      ? new Date(ministerio.candidato_detalle.fecha_candidato_nacional).toISOString().split("T")[0]
      : null,
    notas: ministerio.candidato_detalle?.notas || null,
  });
}

// Actualizar ministerio
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();
  const {
    nombre,
    apellidos,
    alias,
    dni,
    nie,
    iglesia_id,
    codigo,
    estado_id,
    aprob,
    telefono,
    email,
    tipo,
    // Campos de candidato
    fecha_inicio,
    notas,
  } = data;

  if (!nombre || !iglesia_id || !estado_id) {
    const faltantes: string[] = [];
    if (!nombre) faltantes.push("Nombre");
    if (!iglesia_id) faltantes.push("Iglesia");
    if (!estado_id) faltantes.push("Estado");
    return NextResponse.json(
      { error: `Faltan campos obligatorios: ${faltantes.join(", ")}` },
      { status: 400 }
    );
  }

  // Validar y encriptar DNI si se proporciona
  let dniEncrypted: string | null = null;
  if (dni) {
    const dniResult = validarDNI(dni);
    if (!dniResult.valid) {
      return NextResponse.json({ error: dniResult.error }, { status: 400 });
    }
    dniEncrypted = encrypt(dniResult.normalized);
  }

  // Validar y encriptar NIE si se proporciona
  let nieEncrypted: string | null = null;
  if (nie) {
    const nieResult = validarNIE(nie);
    if (!nieResult.valid) {
      return NextResponse.json({ error: nieResult.error }, { status: 400 });
    }
    nieEncrypted = encrypt(nieResult.normalized);
  }

  // Para ministerios, código es obligatorio
  if (tipo === "MINISTERIO" && !codigo) {
    return NextResponse.json(
      { error: "El código es obligatorio para ministerios" },
      { status: 400 }
    );
  }

  // Validar unicidad del código si ha cambiado
  if (tipo === "MINISTERIO" && codigo) {
    const existente = await prisma.ministerio.findUnique({
      where: { codigo },
      select: { id: true },
    });

    if (existente && existente.id !== Number(id)) {
      return NextResponse.json(
        { error: `El código ${codigo} ya existe en la base de datos` },
        { status: 409 }
      );
    }
  }

  const codigoNuevo = tipo === "MINISTERIO" ? codigo : null;
  await prisma.$transaction(async (tx) => {
    const ministerioActual = await tx.ministerio.findUnique({
      where: { id: Number(id) },
      select: {
        codigo: true,
        iglesia_id: true,
        iglesia: {
          select: {
            nombre: true,
            zona: { select: { codigo: true } },
          },
        },
      },
    });
    if (!ministerioActual) {
      throw new Error(`No se encontró el ministerio con id ${id}`);
    }

    const iglesiaNueva = ministerioActual.iglesia_id !== Number(iglesia_id)
      ? await tx.iglesia.findUnique({
          where: { id: Number(iglesia_id) },
          select: {
            nombre: true,
            zona: { select: { codigo: true } },
          },
        })
      : null;

    await tx.ministerio.update({
      where: { id: Number(id) },
      data: {
        nombre,
        apellidos: apellidos || null,
        alias: alias || null,
        dni_encrypted: dniEncrypted,
        nie_encrypted: nieEncrypted,
        iglesia_id,
        codigo: codigoNuevo,
        estado_id,
        tipo: tipo || "MINISTERIO",
        aprob: aprob || null,
        telefono: telefono || null,
        email: email || null,
      },
    });

    if (ministerioActual.codigo !== codigoNuevo) {
      await tx.ministerioHistorico.create({
        data: {
          ministerio_id: Number(id),
          campo: "Código",
          valor_anterior: ministerioActual.codigo,
          valor_nuevo: codigoNuevo,
        },
      });
    }

    if (iglesiaNueva) {
      await tx.ministerioHistorico.create({
        data: {
          ministerio_id: Number(id),
          campo: "Cambio de iglesia",
          valor_anterior: `[${ministerioActual.iglesia.zona.codigo.toUpperCase()}] ${ministerioActual.iglesia.nombre}`,
          valor_nuevo: `[${iglesiaNueva.zona.codigo.toUpperCase()}] ${iglesiaNueva.nombre}`,
        },
      });
    }
  });

  // Si es candidato, actualizar o crear candidato_detalle
  if (tipo === "CANDIDATO" && fecha_inicio) {
    const existing = await prisma.candidatoDetalle.findUnique({
      where: { ministerio_id: Number(id) },
    });

    if (existing) {
      await prisma.candidatoDetalle.update({
        where: { ministerio_id: Number(id) },
        data: {
          fecha_inicio: new Date(fecha_inicio),
          notas: notas || null,
        },
      });
    } else {
      await prisma.candidatoDetalle.create({
        data: {
          ministerio_id: Number(id),
          fecha_inicio: new Date(fecha_inicio),
          notas: notas || null,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}

// Soft delete ministerio por id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const numId = Number(id);

  // Soft delete: poner activo en false
  await prisma.ministerio.update({
    where: { id: numId },
    data: { activo: false },
  });

  return NextResponse.json({ success: true });
}
