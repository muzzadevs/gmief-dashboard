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
import { generarCodigoCandidato, resolverAlcanceZona } from "@/lib/auth";

export async function GET(req: Request) {
  const scope = await resolverAlcanceZona(req);
  const { searchParams } = new URL(req.url);
  const iglesiaId = searchParams.get("iglesiaId");
  const tipo = searchParams.get("tipo"); // "MINISTERIO", "CANDIDATO", or null for all

  if (!iglesiaId) {
    return NextResponse.json({ error: "iglesiaId requerido" }, { status: 400 });
  }
  if (scope) {
    const iglesia = await prisma.iglesia.findFirst({
      where: {
        id: Number(iglesiaId),
        zona_id: scope.zonaId,
        ...(scope.subzonaId ? { subzona_id: scope.subzonaId } : {}),
      },
      select: { id: true },
    });
    if (!iglesia) return NextResponse.json([]);
  }

  const where: Record<string, unknown> = { iglesia_id: Number(iglesiaId) };
  if (tipo) {
    where.tipo = tipo;
  }

  const [ministerios, ministeriosConImagen] = await Promise.all([
    prisma.ministerio.findMany({
      where,
      omit: { imagen: true },
      include: {
        estado: { select: { nombre: true } },
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
    // Sub-consulta ligera: solo IDs de ministerios que tienen imagen
    prisma.ministerio.findMany({
      where: { ...where, imagen: { not: null } },
      select: { id: true },
    }),
  ]);

  const imagenIds = new Set(ministeriosConImagen.map((m) => m.id));

  const hoy = obtenerFechaHoy();
  await Promise.all(ministerios.map(async (m) => {
    if (m.tipo !== "CANDIDATO" || !m.candidato_detalle?.fecha_inicio) return;
    const fechas = calcularFechasCandidatoAlcanzadas(m.candidato_detalle.fecha_inicio, hoy);
    const data: {
      fecha_candidato_local?: Date;
      fecha_candidato_nacional?: Date;
    } = {};

    if (fechas.fecha_candidato_local && !m.candidato_detalle.fecha_candidato_local) {
      data.fecha_candidato_local = new Date(`${fechas.fecha_candidato_local}T00:00:00.000Z`);
    }
    if (fechas.fecha_candidato_nacional && !m.candidato_detalle.fecha_candidato_nacional) {
      data.fecha_candidato_nacional = new Date(`${fechas.fecha_candidato_nacional}T00:00:00.000Z`);
    }
    if (Object.keys(data).length) {
      await prisma.candidatoDetalle.updateMany({
        where: {
          ministerio_id: m.id,
          fecha_inicio: m.candidato_detalle.fecha_inicio,
        },
        data,
      });
    }
    if (m.candidato_detalle.fecha_candidato_local || data.fecha_candidato_local) {
      m.candidato_detalle.fecha_candidato_local =
        m.candidato_detalle.fecha_candidato_local ?? data.fecha_candidato_local!;
    }
    if (m.candidato_detalle.fecha_candidato_nacional || data.fecha_candidato_nacional) {
      m.candidato_detalle.fecha_candidato_nacional =
        m.candidato_detalle.fecha_candidato_nacional ?? data.fecha_candidato_nacional!;
    }
  }));

  // Transformar para mantener la misma estructura de respuesta
  const result = ministerios.map((m) => {
    // Desencriptar DNI si existe
    let dni: string | null = null;
    if (m.dni_encrypted) {
      try {
        dni = decrypt(m.dni_encrypted);
      } catch {
        dni = null; // Si falla la desencriptación, no romper
      }
    }

    // Desencriptar NIE si existe
    let nie: string | null = null;
    if (m.nie_encrypted) {
      try {
        nie = decrypt(m.nie_encrypted);
      } catch {
        nie = null;
      }
    }

    return {
      id: m.id,
      nombre: m.nombre,
      apellidos: m.apellidos,
      alias: m.alias,
      dni,
      nie,
      iglesia_id: m.iglesia_id,
      codigo: m.codigo,
      estado_id: m.estado_id,
      tipo: m.tipo,
      aprob: m.aprob,
      telefono: m.telefono,
      email: m.email,
      fecha_nacimiento: m.fecha_nacimiento
        ? new Date(m.fecha_nacimiento).toISOString().split("T")[0]
        : null,
      direccion_particular: m.direccion_particular,
      estado_nombre: m.estado.nombre,
      has_imagen: imagenIds.has(m.id),
      cargos: m.cargos.map((c) => c.cargo_id).join(",") || null,
      fecha_inicio: m.candidato_detalle?.fecha_inicio
        ? new Date(m.candidato_detalle.fecha_inicio).toISOString().split("T")[0]
        : null,
      fecha_candidato_local: m.candidato_detalle?.fecha_candidato_local
        ? new Date(m.candidato_detalle.fecha_candidato_local).toISOString().split("T")[0]
        : null,
      fecha_candidato_nacional: m.candidato_detalle?.fecha_candidato_nacional
        ? new Date(m.candidato_detalle.fecha_candidato_nacional).toISOString().split("T")[0]
        : null,
      activo: m.activo,
      notas: m.candidato_detalle?.notas || null,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  try {
    return await createMinisterio(req);
  } catch (error) {
    console.error("[POST /api/ministerios] Error:", error);
    return NextResponse.json(
      { error: "Error interno al guardar el ministerio. Inténtelo de nuevo." },
      { status: 500 }
    );
  }
}

async function createMinisterio(req: Request) {
  const scope = await resolverAlcanceZona(req);
  const data = await req.json();
  const {
    nombre,
    apellidos,
    alias,
    dni,
    nie,
    iglesia_id,
    estado_id,
    aprob,
    telefono,
    email,
    fecha_nacimiento,
    direccion_particular,
    codigo_manual,
    tipo = "MINISTERIO",
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
  if (scope) {
    const iglesia = await prisma.iglesia.findFirst({
      where: {
        id: Number(iglesia_id),
        zona_id: scope.zonaId,
        ...(scope.subzonaId ? { subzona_id: scope.subzonaId } : {}),
      },
      select: { id: true },
    });
    if (!iglesia) {
      return NextResponse.json(
        { error: "La iglesia está fuera de tu zona o subzona" },
        { status: 403 }
      );
    }
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
      const ministerioExistente = await buscarDniDuplicado(dniNormalizado);
      if (ministerioExistente !== null) {
        return NextResponse.json(
          { error: "Ya existe una persona registrada con ese DNI" },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error("[POST /api/ministerios] Error al comprobar DNI duplicado:", error);
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

  let codigo: string | null = null;

  // Solo generar código para ministerios, no para candidatos
  if (tipo === "MINISTERIO") {
    // Obtener la iglesia con su zona
    const iglesia = await prisma.iglesia.findUnique({
      where: { id: iglesia_id },
      include: {
        zona: {
          select: { codigo: true },
        },
      },
    });

    if (!iglesia) {
      return NextResponse.json(
        { error: "Iglesia no encontrada" },
        { status: 404 }
      );
    }

    const codigoZona = iglesia.zona.codigo.toUpperCase();

    if (codigo_manual) {
      // Código manual: validar formato y unicidad
      const numPart = codigo_manual.replace(/[^0-9]/g, "");
      if (!numPart || numPart.length === 0 || numPart.length > 4) {
        return NextResponse.json(
          { error: "La parte numérica del código debe tener entre 1 y 4 dígitos" },
          { status: 400 }
        );
      }
      if (Number(numPart) === 0) {
        return NextResponse.json(
          { error: "El número incremental del código debe empezar en 0001" },
          { status: 400 }
        );
      }

      codigo = `${codigoZona}${numPart.padStart(4, "0")}`;

      // Comprobar que el código no exista ya en la base de datos
      const existente = await prisma.ministerio.findUnique({
        where: { codigo },
      });

      if (existente) {
        return NextResponse.json(
          { error: `El código ${codigo} ya existe en la base de datos` },
          { status: 409 }
        );
      }
    } else {
      // Auto-generar el código basado en la zona de la iglesia
      const ministeriosConCodigo = await prisma.ministerio.findMany({
        where: {
          codigo: {
            startsWith: codigoZona,
          },
        },
        select: { codigo: true },
        orderBy: { codigo: "desc" },
      });

      codigo = generarCodigoSiguiente(
        codigoZona,
        ministeriosConCodigo.map((ministerio) => ministerio.codigo)
      );
      if (!codigo) {
        return NextResponse.json(
          { error: "Se ha alcanzado el límite máximo de códigos para esta zona (9999)" },
          { status: 409 }
        );
      }
    }
  }

  const fechasAlcanzadas = fechasCandidato
    ? calcularFechasCandidatoAlcanzadas(fechasCandidato.fecha_inicio)
    : null;
  const ministerio = await prisma.$transaction(async (tx) => {
    const nuevoMinisterio = await tx.ministerio.create({
      data: {
        nombre,
        apellidos: apellidos || null,
        alias: alias || null,
        dni_encrypted: dniEncrypted,
        nie_encrypted: nieEncrypted,
        iglesia_id,
        codigo,
        estado_id,
        tipo,
        aprob: aprob || null,
        telefono: telefono || null,
        email: email || null,
        fecha_nacimiento: fechaNacimiento,
        direccion_particular: direccion_particular || null,
      },
    });

    if (fechasCandidato && fechasAlcanzadas) {
      await tx.candidatoDetalle.create({
        data: {
          ministerio_id: nuevoMinisterio.id,
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

    // Para candidatos: generar código temporal CODIGOZONA+NOMBRE+ID
    if (tipo === "CANDIDATO") {
      const iglesia = await tx.iglesia.findUnique({
        where: { id: iglesia_id },
        include: { zona: { select: { codigo: true } } },
      });
      if (iglesia) {
        const codigoTemp = generarCodigoCandidato(
          iglesia.zona.codigo,
          nombre,
          nuevoMinisterio.id
        );
        await tx.ministerio.update({
          where: { id: nuevoMinisterio.id },
          data: { codigo: codigoTemp, username: codigoTemp },
        });
        return { ...nuevoMinisterio, codigo: codigoTemp };
      }
    }

    // Para ministerios (obreros): username = código
    if (nuevoMinisterio.codigo) {
      await tx.ministerio.update({
        where: { id: nuevoMinisterio.id },
        data: { username: nuevoMinisterio.codigo },
      });
    }

    return nuevoMinisterio;
  });

  return NextResponse.json({ id: ministerio.id, codigo: ministerio.codigo });
}
