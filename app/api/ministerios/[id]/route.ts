import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { validarDNI, validarNIE } from "@/lib/dniUtils";
import {
  calcularFechasCandidatoAlcanzadas,
  calcularFechasCandidato,
  FASES_CANDIDATO,
  obtenerFechaHoy,
  type FaseFechaCandidato,
} from "@/lib/candidatoUtils";
import { generarCodigoSiguiente } from "@/lib/codigoMinisterio";
import { buscarDniDuplicado } from "@/lib/ministerioDni";
import { requireGestionMinisteriosPermission } from "@/lib/gestionMinisteriosPermissions";

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
          select: {
            fecha_inicio: true,
            fecha_candidato_local: true,
            fecha_candidato_nacional: true,
            notas: true,
          },
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

  if (ministerio.tipo === "CANDIDATO" && ministerio.candidato_detalle?.fecha_inicio) {
    const fechas = calcularFechasCandidatoAlcanzadas(ministerio.candidato_detalle.fecha_inicio);
    const data: {
      fecha_candidato_local?: Date;
      fecha_candidato_nacional?: Date;
    } = {};
    if (fechas.fecha_candidato_local && !ministerio.candidato_detalle.fecha_candidato_local) {
      data.fecha_candidato_local = new Date(`${fechas.fecha_candidato_local}T00:00:00.000Z`);
    }
    if (fechas.fecha_candidato_nacional && !ministerio.candidato_detalle.fecha_candidato_nacional) {
      data.fecha_candidato_nacional = new Date(`${fechas.fecha_candidato_nacional}T00:00:00.000Z`);
    }
    if (Object.keys(data).length) {
      await prisma.candidatoDetalle.updateMany({
        where: {
          ministerio_id: ministerio.id,
          fecha_inicio: ministerio.candidato_detalle.fecha_inicio,
        },
        data,
      });
      ministerio.candidato_detalle.fecha_candidato_local =
        ministerio.candidato_detalle.fecha_candidato_local ?? data.fecha_candidato_local ?? null;
      ministerio.candidato_detalle.fecha_candidato_nacional =
        ministerio.candidato_detalle.fecha_candidato_nacional ?? data.fecha_candidato_nacional ?? null;
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
    fecha_nacimiento: ministerio.fecha_nacimiento
      ? new Date(ministerio.fecha_nacimiento).toISOString().split("T")[0]
      : null,
    dni,
    nie,
    dni_encrypted: undefined, // No enviar el dato encriptado al frontend
    nie_encrypted: undefined, // No enviar el dato encriptado al frontend
    cargos: ministerio.cargos.map((c: { cargo_id: number }) => c.cargo_id).join(",") || null,
    fecha_inicio: ministerio.candidato_detalle?.fecha_inicio
      ? new Date(ministerio.candidato_detalle.fecha_inicio).toISOString().split("T")[0]
      : null,
    fecha_candidato_local: ministerio.candidato_detalle?.fecha_candidato_local
      ? new Date(ministerio.candidato_detalle.fecha_candidato_local).toISOString().split("T")[0]
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
  const denied = await requireGestionMinisteriosPermission(req, "editar");
  if (denied) return denied;

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
    fecha_nacimiento,
    direccion_particular,
    tipo,
    // Campos de candidato
    fecha_inicio,
    fase_referencia,
    fecha_referencia,
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
  let dniNormalizado: string | null = null;
  if (dni) {
    const dniResult = validarDNI(dni);
    if (!dniResult.valid) {
      return NextResponse.json({ error: dniResult.error }, { status: 400 });
    }
    dniNormalizado = dniResult.normalized;
    dniEncrypted = encrypt(dniNormalizado);
  }

  if (dniNormalizado) {
    try {
      const ministerioExistente = await buscarDniDuplicado(
        dniNormalizado,
        Number(id)
      );
      if (ministerioExistente !== null) {
        return NextResponse.json(
          { error: "Ya existe otra persona registrada con ese DNI" },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error(
        `[PUT /api/ministerios/${id}] Error al comprobar DNI duplicado:`,
        error
      );
      return NextResponse.json(
        { error: "No se pudo comprobar si el DNI ya está registrado" },
        { status: 500 }
      );
    }
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

  let fechasCandidato: ReturnType<typeof calcularFechasCandidato> | null = null;
  if (tipo === "CANDIDATO") {
    const fase = fase_referencia ?? "ENSAYISTA";
    const fecha = fecha_referencia ?? fecha_inicio;
    if (
      typeof fecha !== "string" ||
      typeof fase !== "string" ||
      !(FASES_CANDIDATO as readonly string[]).includes(fase)
    ) {
      return NextResponse.json(
        { error: "Debe indicar una fecha válida y la etapa a la que corresponde" },
        { status: 400 }
      );
    }
    try {
      fechasCandidato = calcularFechasCandidato(fecha, fase as FaseFechaCandidato);
    } catch {
      return NextResponse.json({ error: "La fecha de inicio no es válida" }, { status: 400 });
    }
    if (fechasCandidato.fecha_inicio > obtenerFechaHoy()) {
      return NextResponse.json(
        { error: "La fecha calculada de inicio como Ensayista no puede estar en el futuro" },
        { status: 400 }
      );
    }
  }

  const fechaNacimiento = fecha_nacimiento ? new Date(fecha_nacimiento) : null;
  if (fechaNacimiento && Number.isNaN(fechaNacimiento.getTime())) {
    return NextResponse.json(
      { error: "La fecha de nacimiento no es válida" },
      { status: 400 }
    );
  }
  if (direccion_particular && direccion_particular.length > 255) {
    return NextResponse.json(
      { error: "La dirección particular no puede superar los 255 caracteres" },
      { status: 400 }
    );
  }

  const codigoSolicitado = tipo === "MINISTERIO" ? codigo : null;
  const resultado = await prisma.$transaction(async (tx) => {
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

    const iglesiaDestino = await tx.iglesia.findUnique({
      where: { id: Number(iglesia_id) },
      select: {
        nombre: true,
        zona: { select: { codigo: true } },
      },
    });
    if (!iglesiaDestino) {
      throw new Error(`No se encontró la iglesia con id ${iglesia_id}`);
    }

    const iglesiaNueva = ministerioActual.iglesia_id !== Number(iglesia_id)
      ? iglesiaDestino
      : null;

    let codigoFinal = codigoSolicitado;
    let codigoReasignado = false;
    if (codigoSolicitado) {
      if (
        codigoSolicitado !== ministerioActual.codigo &&
        codigoSolicitado.endsWith("0000")
      ) {
        return {
          error: "El número incremental del código debe empezar en 0001",
          codigo: null,
          codigoReasignado: false,
        };
      }

      const codigoExistente = await tx.ministerio.findFirst({
        where: {
          codigo: codigoSolicitado,
          NOT: { id: Number(id) },
        },
        select: { id: true },
      });

      if (codigoExistente) {
        const codigoZona = iglesiaDestino.zona.codigo.toUpperCase();
        const codigosZona = await tx.ministerio.findMany({
          where: { codigo: { startsWith: codigoZona } },
          select: { codigo: true },
        });
        codigoFinal = generarCodigoSiguiente(
          codigoZona,
          codigosZona.map((ministerio) => ministerio.codigo)
        );

        if (!codigoFinal) {
          return {
            error: `Se ha alcanzado el límite máximo de códigos para la zona ${codigoZona} (9999)`,
            codigo: null,
            codigoReasignado: false,
          };
        }
        codigoReasignado = true;
      }
    }

    await tx.ministerio.update({
      where: { id: Number(id) },
      data: {
        nombre,
        apellidos: apellidos || null,
        alias: alias || null,
        dni_encrypted: dniEncrypted,
        nie_encrypted: nieEncrypted,
        iglesia_id,
        codigo: codigoFinal,
        estado_id,
        tipo: tipo || "MINISTERIO",
        aprob: aprob || null,
        telefono: telefono || null,
        email: email || null,
        fecha_nacimiento: fechaNacimiento,
        direccion_particular: direccion_particular || null,
      },
    });

    if (ministerioActual.codigo !== codigoFinal) {
      await tx.ministerioHistorico.create({
        data: {
          ministerio_id: Number(id),
          campo: "Código",
          valor_anterior: ministerioActual.codigo,
          valor_nuevo: codigoFinal,
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

    if (tipo === "CANDIDATO" && fechasCandidato) {
      const fechasAlcanzadas = calcularFechasCandidatoAlcanzadas(
        fechasCandidato.fecha_inicio
      );
      await tx.candidatoDetalle.upsert({
        where: { ministerio_id: Number(id) },
        create: {
          ministerio_id: Number(id),
          fecha_inicio: new Date(`${fechasCandidato.fecha_inicio}T00:00:00.000Z`),
          fecha_candidato_local: fechasAlcanzadas.fecha_candidato_local
            ? new Date(`${fechasAlcanzadas.fecha_candidato_local}T00:00:00.000Z`)
            : null,
          fecha_candidato_nacional: fechasAlcanzadas.fecha_candidato_nacional
            ? new Date(`${fechasAlcanzadas.fecha_candidato_nacional}T00:00:00.000Z`)
            : null,
          notas: notas || null,
        },
        update: {
          fecha_inicio: new Date(`${fechasCandidato.fecha_inicio}T00:00:00.000Z`),
          fecha_candidato_local: fechasAlcanzadas.fecha_candidato_local
            ? new Date(`${fechasAlcanzadas.fecha_candidato_local}T00:00:00.000Z`)
            : null,
          fecha_candidato_nacional: fechasAlcanzadas.fecha_candidato_nacional
            ? new Date(`${fechasAlcanzadas.fecha_candidato_nacional}T00:00:00.000Z`)
            : null,
          notas: notas || null,
        },
      });
    }

    return { error: null, codigo: codigoFinal, codigoReasignado };
  });

  if (resultado.error) {
    return NextResponse.json({ error: resultado.error }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    codigo: resultado.codigo,
    codigo_reasignado: resultado.codigoReasignado,
  });
}

// Soft delete ministerio por id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireGestionMinisteriosPermission(req, "borrar");
  if (denied) return denied;

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
