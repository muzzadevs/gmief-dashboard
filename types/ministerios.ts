export type Ministerio = {
  id: number;
  nombre: string;
  apellidos: string;
  alias: string | null;
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
  // Campos de candidato (solo si tipo = CANDIDATO)
  fecha_inicio: string | null;
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
