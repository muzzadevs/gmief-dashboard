export type Ministerio = {
  id: number;
  nombre: string;
  apellidos: string;
  alias: string | null;
  dni: string | null; // DNI desencriptado (solo en respuesta API, nunca en BD)
  nie: string | null; // NIE desencriptado (solo en respuesta API, nunca en BD)
  iglesia_id: number;
  codigo: string | null;
  estado_id: number;
  tipo: "MINISTERIO" | "CANDIDATO";
  aprob: number | null;
  telefono: string | null;
  email: string | null;
  estado_nombre: string;
  has_imagen: boolean;
  cargos: string | null; // ids separados por coma
  activo: boolean;
  // Campos de candidato (solo si tipo = CANDIDATO)
  fecha_inicio: string | null;
  fecha_candidato_nacional: string | null;
  notas: string | null;
};

export type Cargo = {
  id: number;
  cargo: string;
};

export type Estado = {
  id: number;
  nombre: string;
};
