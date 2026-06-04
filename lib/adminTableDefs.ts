// Metadata for all Prisma models - maps to actual database tables
// Separated from API route to avoid Next.js route export constraints

export const TABLE_DEFINITIONS = {
  zonas: {
    label: "Zonas",
    model: "zona",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "nombre", type: "String", required: true, editable: true, maxLength: 100 },
      { name: "codigo", type: "String", required: true, editable: true, maxLength: 10 },
      { name: "activo", type: "Boolean", required: true, editable: true },
    ],
  },
  subzonas: {
    label: "Subzonas",
    model: "subzona",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "nombre", type: "String", required: true, editable: true, maxLength: 100 },
      { name: "zona_id", type: "Int", required: true, editable: true },
      { name: "activo", type: "Boolean", required: true, editable: true },
    ],
  },
  iglesias: {
    label: "Iglesias",
    model: "iglesia",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "nombre", type: "String", required: true, editable: true, maxLength: 100 },
      { name: "direccion", type: "String", required: false, editable: true, maxLength: 255 },
      { name: "municipio", type: "String", required: false, editable: true, maxLength: 100 },
      { name: "provincia", type: "String", required: false, editable: true, maxLength: 100 },
      { name: "zona_id", type: "Int", required: true, editable: true },
      { name: "subzona_id", type: "Int", required: false, editable: true },
      { name: "cp", type: "Int", required: false, editable: true },
      { name: "latitud", type: "Float", required: false, editable: true },
      { name: "longitud", type: "Float", required: false, editable: true },
      { name: "activo", type: "Boolean", required: true, editable: true },
    ],
  },
  ministerios: {
    label: "Ministerios",
    model: "ministerio",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "nombre", type: "String", required: true, editable: true, maxLength: 20 },
      { name: "apellidos", type: "String", required: false, editable: true, maxLength: 60 },
      { name: "alias", type: "String", required: false, editable: true, maxLength: 50 },
      { name: "dni_encrypted", type: "String", required: false, editable: true, maxLength: 255, encrypted: true },
      { name: "nie_encrypted", type: "String", required: false, editable: true, maxLength: 255, encrypted: true },
      { name: "iglesia_id", type: "Int", required: true, editable: true },
      { name: "codigo", type: "String", required: false, editable: true, maxLength: 7 },
      { name: "estado_id", type: "Int", required: true, editable: true },
      { name: "tipo", type: "String", required: true, editable: true, maxLength: 15 },
      { name: "aprob", type: "Int", required: false, editable: true },
      { name: "telefono", type: "String", required: false, editable: true, maxLength: 15 },
      { name: "email", type: "String", required: false, editable: true, maxLength: 255 },
      { name: "imagen", type: "Bytes", required: false, editable: false },
      { name: "activo", type: "Boolean", required: true, editable: true },
    ],
  },
  cargos: {
    label: "Cargos",
    model: "cargo",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "cargo", type: "String", required: true, editable: true, maxLength: 100 },
    ],
  },
  estados: {
    label: "Estados",
    model: "estado",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "nombre", type: "String", required: true, editable: true, maxLength: 50 },
    ],
  },
  ministerio_cargo: {
    label: "Ministerio-Cargo",
    model: "ministerioCargo",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "ministerio_id", type: "Int", required: true, editable: true },
      { name: "cargo_id", type: "Int", required: true, editable: true },
    ],
  },
  observaciones: {
    label: "Observaciones",
    model: "observacion",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "ministerio_id", type: "Int", required: true, editable: true },
      { name: "observacion", type: "String", required: true, editable: true, maxLength: 255 },
    ],
  },
  candidato_detalle: {
    label: "Candidato Detalle",
    model: "candidatoDetalle",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "ministerio_id", type: "Int", required: true, editable: true },
      { name: "fecha_inicio", type: "DateTime", required: true, editable: true },
      { name: "fecha_candidato_nacional", type: "DateTime", required: false, editable: true },
      { name: "notas", type: "String", required: false, editable: true, maxLength: 255 },
    ],
  },
  pastores_iglesia: {
    label: "Pastores-Iglesia",
    model: "pastorIglesia",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "iglesia_id", type: "Int", required: true, editable: true },
      { name: "ministerio_id", type: "Int", required: true, editable: true },
    ],
  },
  modulos: {
    label: "Módulos",
    model: "modulo",
    columns: [
      { name: "id", type: "Int", required: true, editable: false, primary: true },
      { name: "nombre", type: "String", required: true, editable: true, maxLength: 100 },
      { name: "descripcion", type: "String", required: false, editable: true, maxLength: 255 },
      { name: "icono", type: "String", required: false, editable: true, maxLength: 50 },
      { name: "href", type: "String", required: true, editable: true, maxLength: 255 },
      { name: "activo", type: "Boolean", required: true, editable: true },
      { name: "orden", type: "Int", required: true, editable: true },
    ],
  },
};

export type TableKey = keyof typeof TABLE_DEFINITIONS;
