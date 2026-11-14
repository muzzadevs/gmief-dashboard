import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { requireGestionMinisteriosPermission } from "@/lib/gestionMinisteriosPermissions";
import {
  obtenerFragmentosBusqueda,
  obtenerTerminosBusqueda,
  obtenerVariantesBusqueda,
  puntuarCoincidencia,
} from "@/lib/buscadorMinisterios";
import { resolverAlcanceZona } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function terminosAmpliados(termino: string): string[] {
  const variantes = obtenerVariantesBusqueda(termino);
  return [...new Set([...variantes, ...obtenerFragmentosBusqueda(termino)])];
}

function ministerioTerminoWhere(termino: string): Prisma.MinisterioWhereInput[] {
  return terminosAmpliados(termino).flatMap((valor) => [
    { nombre: { contains: valor } },
    { apellidos: { contains: valor } },
    { alias: { contains: valor } },
    { codigo: { contains: valor } },
    { iglesia: { nombre: { contains: valor } } },
    { iglesia: { zona: { nombre: { contains: valor } } } },
    { iglesia: { zona: { codigo: { contains: valor } } } },
    { iglesia: { municipio: { contains: valor } } },
    { iglesia: { provincia: { contains: valor } } },
    { cargos: { some: { cargo: { cargo: { contains: valor } } } } },
  ]);
}

function iglesiaTerminoWhere(termino: string): Prisma.IglesiaWhereInput[] {
  return terminosAmpliados(termino).flatMap((valor) => [
    { nombre: { contains: valor } },
    { direccion: { contains: valor } },
    { municipio: { contains: valor } },
    { provincia: { contains: valor } },
    { zona: { nombre: { contains: valor } } },
    { zona: { codigo: { contains: valor } } },
    { subzona: { nombre: { contains: valor } } },
  ]);
}

function cargoTerminoWhere(termino: string): Prisma.CargoWhereInput[] {
  return terminosAmpliados(termino).map((valor) => ({
    cargo: { contains: valor },
  }));
}

export async function GET(request: Request) {
  const denied = await requireGestionMinisteriosPermission(request, "ver", {
    allowZoneScopedView: true,
  });
  if (denied) return denied;

  const params = new URL(request.url).searchParams;
  const consulta = (params.get("q") || "").trim().slice(0, 100);
  const tipo = params.get("tipo") || "todos";
  if (!["todos", "persona", "iglesia", "cargo"].includes(tipo)) {
    return NextResponse.json({ ok: false, error: "Tipo de búsqueda no válido" }, { status: 400 });
  }
  const terminos = obtenerTerminosBusqueda(consulta);
  if (consulta.length < 2 || terminos.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Escribe al menos dos caracteres para buscar" },
      { status: 400 }
    );
  }

  try {
    const alcance = await resolverAlcanceZona(request);
    const personasWhere: Prisma.MinisterioWhereInput = {
      activo: true,
      iglesia: {
        activo: true,
        zona: { activo: true },
        ...(alcance ? { zona_id: alcance.zonaId } : {}),
      },
      AND: terminos.map((termino) => ({
        OR: ministerioTerminoWhere(termino),
      })),
    };
    const iglesiasWhere: Prisma.IglesiaWhereInput = {
      activo: true,
      zona: { activo: true },
      ...(alcance ? { zona_id: alcance.zonaId } : {}),
      AND: terminos.map((termino) => ({
        OR: iglesiaTerminoWhere(termino),
      })),
    };
    const cargosWhere: Prisma.CargoWhereInput = {
      AND: terminos.map((termino) => ({
        OR: cargoTerminoWhere(termino),
      })),
      ministerios: {
        some: {
          ministerio: {
            activo: true,
            iglesia: {
              activo: true,
              zona: { activo: true },
              ...(alcance ? { zona_id: alcance.zonaId } : {}),
            },
          },
        },
      },
    };

    const [personas, iglesias, cargos] = await Promise.all([
      tipo === "iglesia" || tipo === "cargo"
        ? Promise.resolve([])
        : prisma.ministerio.findMany({
            where: personasWhere,
            take: 500,
            orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              alias: true,
              codigo: true,
              tipo: true,
              iglesia: {
                select: {
                  id: true,
                  nombre: true,
                  municipio: true,
                  provincia: true,
                  zona_id: true,
                  subzona_id: true,
                  cp: true,
                  direccion: true,
                  activo: true,
                  zona: { select: { id: true, nombre: true, codigo: true, activo: true } },
                },
              },
              cargos: { select: { cargo: { select: { cargo: true } } } },
            },
          }),
      tipo === "persona" || tipo === "cargo"
        ? Promise.resolve([])
        : prisma.iglesia.findMany({
            where: iglesiasWhere,
            take: 500,
            orderBy: { nombre: "asc" },
            select: {
              id: true,
              nombre: true,
              direccion: true,
              municipio: true,
              provincia: true,
              zona_id: true,
              subzona_id: true,
              cp: true,
              activo: true,
              zona: { select: { id: true, nombre: true, codigo: true, activo: true } },
              subzona: { select: { nombre: true } },
            },
          }),
      tipo === "persona" || tipo === "iglesia"
        ? Promise.resolve([])
        : prisma.cargo.findMany({
            where: cargosWhere,
            take: 200,
            orderBy: { cargo: "asc" },
            select: {
              id: true,
              cargo: true,
            },
          }),
    ]);

    const resultados = [
      ...personas.map((persona) => {
        const cargosPersona = persona.cargos.map((asignacion) => asignacion.cargo.cargo);
        const texto = [
          persona.nombre,
          persona.apellidos,
          persona.alias,
          persona.codigo,
          persona.iglesia.nombre,
          persona.iglesia.zona.nombre,
          persona.iglesia.zona.codigo,
          persona.iglesia.municipio,
          persona.iglesia.provincia,
          ...cargosPersona,
        ].filter(Boolean).join(" ");
        return {
          tipo: "persona" as const,
          id: persona.id,
          subtipo: persona.tipo === "CANDIDATO" ? "Candidato" : "Obrero",
          nombre: [persona.nombre, persona.apellidos].filter(Boolean).join(" "),
          alias: persona.alias,
          codigo: persona.codigo,
          iglesia: persona.iglesia.nombre,
          zona: persona.iglesia.zona.nombre,
          zonaId: persona.iglesia.zona.id,
          zonaCodigo: persona.iglesia.zona.codigo,
          iglesiaId: persona.iglesia.id,
          municipio: persona.iglesia.municipio,
          provincia: persona.iglesia.provincia,
          cargos: cargosPersona,
          iglesiaSeleccion: persona.iglesia,
          puntuacion: puntuarCoincidencia(consulta, texto),
        };
      }),
      ...iglesias.map((iglesia) => {
        const texto = [
          iglesia.nombre,
          iglesia.direccion,
          iglesia.municipio,
          iglesia.provincia,
          iglesia.zona.nombre,
          iglesia.zona.codigo,
          iglesia.subzona?.nombre,
        ].filter(Boolean).join(" ");
        return {
          tipo: "iglesia" as const,
          id: iglesia.id,
          nombre: iglesia.nombre,
          municipio: iglesia.municipio,
          provincia: iglesia.provincia,
          zona: iglesia.zona.nombre,
          zonaId: iglesia.zona.id,
          zonaCodigo: iglesia.zona.codigo,
          puntuacion: puntuarCoincidencia(consulta, texto),
        };
      }),
      ...cargos.map((cargo) => ({
        tipo: "cargo" as const,
        id: cargo.id,
        nombre: cargo.cargo,
        puntuacion: puntuarCoincidencia(consulta, cargo.cargo),
      })),
    ]
      .filter((resultado) => resultado.puntuacion > 0)
      .sort((a, b) => b.puntuacion - a.puntuacion || a.nombre.localeCompare(b.nombre, "es"))
      .slice(0, 100);

    return NextResponse.json({ ok: true, data: resultados });
  } catch (error) {
    console.error("[GET /api/gestion-ministerios/buscar] Error:", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo completar la búsqueda" },
      { status: 500 }
    );
  }
}
