import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { validarDNI, validarNIE } from "@/lib/dniUtils";
import { calcularFase } from "@/lib/candidatoUtils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const iglesiaId = searchParams.get("iglesiaId");
  const tipo = searchParams.get("tipo"); // "MINISTERIO", "CANDIDATO", or null for all

  if (!iglesiaId) {
    return NextResponse.json({ error: "iglesiaId requerido" }, { status: 400 });
  }

  const where: Record<string, unknown> = { iglesia_id: Number(iglesiaId), activo: true };
  if (tipo) {
    where.tipo = tipo;
  }

  const ministerios = await prisma.ministerio.findMany({
    where,
    include: {
      estado: { select: { nombre: true } },
      cargos: { select: { cargo_id: true } },
      candidato_detalle: {
        select: { fecha_inicio: true, fecha_candidato_nacional: true, notas: true },
      },
    },
  });

  // Auto-detectar y persistir fecha_candidato_nacional
  for (const m of ministerios) {
    if (
      m.tipo === "CANDIDATO" &&
      m.candidato_detalle?.fecha_inicio &&
      !m.candidato_detalle.fecha_candidato_nacional
    ) {
      const fase = calcularFase(m.candidato_detalle.fecha_inicio);
      if (fase.fase === "CANDIDATO_NACIONAL" || fase.fase === "APTO_OBRERO") {
        const fechaHoy = new Date();
        fechaHoy.setHours(0, 0, 0, 0);
        await prisma.candidatoDetalle.update({
          where: { ministerio_id: m.id },
          data: { fecha_candidato_nacional: fechaHoy },
        });
        m.candidato_detalle.fecha_candidato_nacional = fechaHoy;
      }
    }
  }

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
      estado_nombre: m.estado.nombre,
      has_imagen: m.imagen !== null && m.imagen !== undefined,
      cargos: m.cargos.map((c) => c.cargo_id).join(",") || null,
      fecha_inicio: m.candidato_detalle?.fecha_inicio
        ? new Date(m.candidato_detalle.fecha_inicio).toISOString().split("T")[0]
        : null,
      fecha_candidato_nacional: m.candidato_detalle?.fecha_candidato_nacional
        ? new Date(m.candidato_detalle.fecha_candidato_nacional).toISOString().split("T")[0]
        : null,
      notas: m.candidato_detalle?.notas || null,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
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
    codigo_manual,
    tipo = "MINISTERIO",
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

  // Para candidatos, fecha_inicio es obligatoria
  if (tipo === "CANDIDATO" && !fecha_inicio) {
    return NextResponse.json(
      { error: "La fecha de inicio es obligatoria para candidatos" },
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

      let nextNumber = 0;
      if (ministeriosConCodigo.length > 0) {
        const numbers = ministeriosConCodigo
          .map((m) => {
            const numPart = m.codigo!.slice(codigoZona.length);
            const parsed = parseInt(numPart, 10);
            return isNaN(parsed) ? -1 : parsed;
          })
          .filter((n) => n >= 0);
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1;
        }
      }

      if (nextNumber > 9999) {
        return NextResponse.json(
          { error: "Se ha alcanzado el límite máximo de códigos para esta zona (9999)" },
          { status: 409 }
        );
      }

      codigo = `${codigoZona}${String(nextNumber).padStart(4, "0")}`;
    }
  }

  const ministerio = await prisma.ministerio.create({
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
    },
  });

  // Si es candidato, crear el detalle
  if (tipo === "CANDIDATO") {
    await prisma.candidatoDetalle.create({
      data: {
        ministerio_id: ministerio.id,
        fecha_inicio: new Date(fecha_inicio),
        notas: notas || null,
      },
    });
  }

  return NextResponse.json({ id: ministerio.id, codigo });
}
