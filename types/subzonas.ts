export type Subzona = {
  id: number;
  nombre: string;
  zona_id: number;
};

export type Iglesia = {
  id: number;
  nombre: string;
  direccion: string | null;
  municipio: string | null;
  provincia: string | null;
  subzona_id: number;
  cp: number | null;
};
