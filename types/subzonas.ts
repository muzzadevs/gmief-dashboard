export type Subzona = {
  id: number;
  nombre: string;
  zona_id: number;
  activo: boolean;
};

export type Iglesia = {
  id: number;
  nombre: string;
  direccion: string | null;
  municipio: string | null;
  provincia: string | null;
  zona_id: number;
  subzona_id: number | null;
  cp: number | null;
  facebook_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  activo: boolean;
};
