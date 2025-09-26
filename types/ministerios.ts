export type Ministerio = {
  id: number;
  nombre: string;
  apellidos: string;
  alias: string | null;
  iglesia_id: number;
  codigo: string;
  estado_id: number;
  aprob: number;
  telefono: string | null;
  email: string | null;
  estado_nombre: string;
  cargos: string | null; // ids separados por coma
};

export type Cargo = {
  id: number;
  cargo: string;
};

export type Estado = {
  id: number;
  nombre: string;
};
