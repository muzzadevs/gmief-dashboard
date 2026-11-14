"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock3, FileSearch, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import LoaderPersonalizado from "@/app/components/LoaderPersonalizado";

type RegistroAuditoria = {
  id: number;
  fecha: string;
  actor_username: string;
  actor_nombre: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  resumen: string;
  detalles: Record<string, unknown> | null;
  metodo: string;
  ruta: string;
};

type Filtros = {
  usuario: string;
  accion: string;
  entidad: string;
  desde: string;
  hasta: string;
  busqueda: string;
};

type RespuestaAuditoria = {
  registros: RegistroAuditoria[];
  total: number;
  pagina: number;
  paginas: number;
  usuarios: { actor_username: string; actor_nombre: string }[];
  entidades: string[];
};

const FILTROS_VACIOS: Filtros = {
  usuario: "",
  accion: "",
  entidad: "",
  desde: "",
  hasta: "",
  busqueda: "",
};

const ACCIONES = [
  "CREAR",
  "EDITAR",
  "ELIMINAR",
  "BAJA",
  "REACTIVAR",
  "ASIGNAR",
  "APROBAR",
  "EXPEDIR",
  "CAMBIO_PASSWORD",
  "PASSWORD_RESET",
];

const ETIQUETAS_CAMPOS: Record<string, string> = {
  activo: "Estado",
  nombre: "Nombre",
  apellidos: "Apellidos",
  alias: "Alias",
  codigo: "Código",
  estado_id: "Estado",
  iglesia_id: "Iglesia",
  zona_id: "Zona",
  subzona_id: "Subzona",
  telefono: "Teléfono",
  email: "Correo",
  direccion: "Dirección",
  municipio: "Municipio",
  provincia: "Provincia",
  cp: "Código postal",
  tipo: "Tipo",
  fecha: "Fecha",
  permisos: "Permisos",
  cargos: "Cargos",
  observacion: "Observación",
  descripcion: "Descripción",
  fecha_nacimiento: "Fecha de nacimiento",
  fecha_inicio: "Fecha de inicio",
  fecha_referencia: "Fecha de referencia",
  fase_referencia: "Etapa de referencia",
  aprob: "Aprobación",
  nuevo_tipo: "Nuevo tipo",
  fecha_expedicion: "Fecha de expedición",
  expedida: "Credencial expedida",
  estado_solicitud: "Estado de la solicitud",
  estado: "Estado",
  iglesia: "Iglesia",
  zona: "Zona",
  subzona: "Subzona",
  fecha_actualizacion: "Fecha de actualización",
  fecha_creacion: "Fecha de creación",
  cantidad_personas: "Personas incluidas",
  cantidad_cargos: "Cargos asignados",
  cargos_agregados: "Cargos añadidos",
  cargos_eliminados: "Cargos retirados",
  ministerios_desactivados: "Personas desactivadas",
  iglesias_desactivadas: "Iglesias desactivadas",
  iglesias: "Iglesias",
  asignacion: "Asignación",
  pastor: "Pastor",
  evento: "Evento histórico",
  permisos_asignados: "Permisos asignados",
  identificacion: "Registro afectado",
  fecha_nueva: "Nueva fecha",
  operacion: "Operación",
  tamano_bytes: "Tamaño del archivo",
};

function etiquetaAccion(accion: string): string {
  const etiquetas: Record<string, string> = {
    CREAR: "Creación",
    EDITAR: "Edición",
    ELIMINAR: "Eliminación",
    BAJA: "Baja",
    REACTIVAR: "Reactivación",
    ASIGNAR: "Asignación",
    APROBAR: "Aprobación",
    EXPEDIR: "Expedición",
    CAMBIO_PASSWORD: "Cambio de contraseña",
    PASSWORD_RESET: "Reinicio de contraseña",
  };
  return etiquetas[accion] ?? accion;
}

function fechaLegible(fecha: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));
}

function camposAfectados(detalles: Record<string, unknown> | null): string[] {
  const campos = detalles?.campos;
  if (!Array.isArray(campos)) return [];
  return campos.filter((campo): campo is string => typeof campo === "string");
}

function etiquetaCampo(campo: string): string {
  return ETIQUETAS_CAMPOS[campo] ?? campo.replace(/_/g, " ");
}

function mostrarValor(valor: unknown, campo?: string): string {
  if (valor === null || valor === undefined || valor === "") return "Sin valor";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (Array.isArray(valor)) return valor.map((item) => mostrarValor(item, campo)).join(", ");
  if (typeof valor === "object") return "Detalle registrado";
  if (typeof valor === "string") {
    if ((campo === "tipo" || campo === "nuevo_tipo") && valor === "MINISTERIO") return "Ministerio";
    if ((campo === "tipo" || campo === "nuevo_tipo") && valor === "CANDIDATO") return "Candidato";
    if ((campo === "estado" || campo === "estado_solicitud") && valor === "EN_PROCESO") return "En proceso";
    if ((campo === "estado" || campo === "estado_solicitud") && valor === "COMPLETADA") return "Completada";
    if ((campo === "estado" || campo === "estado_solicitud") && valor === "PENDIENTE") return "Pendiente";
    if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(valor)) {
      const fecha = new Date(valor);
      if (Number.isFinite(fecha.getTime())) {
        return new Intl.DateTimeFormat("es-ES", {
          dateStyle: "medium",
          timeZone: "UTC",
        }).format(fecha);
      }
    }
  }
  return String(valor);
}

function cambiosRegistrados(
  detalles: Record<string, unknown> | null
): [string, { anterior: unknown; nuevo: unknown }][] {
  const cambios = detalles?.cambios;
  if (typeof cambios !== "object" || cambios === null || Array.isArray(cambios)) return [];
  const resultado: [string, { anterior: unknown; nuevo: unknown }][] = [];
  for (const [campo, valor] of Object.entries(cambios)) {
    if (typeof valor !== "object" || valor === null || Array.isArray(valor)) continue;
    const cambio = valor as Record<string, unknown>;
    if (!("anterior" in cambio) || !("nuevo" in cambio)) continue;
    resultado.push([campo, { anterior: cambio.anterior, nuevo: cambio.nuevo }]);
  }
  return resultado;
}

function detallesLegibles(detalles: Record<string, unknown> | null): [string, unknown][] {
  if (!detalles) return [];
  return Object.entries(detalles).filter(([campo]) =>
    campo !== "campos" &&
    campo !== "cambios" &&
    campo !== "identificacion" &&
    !campo.endsWith("_id") &&
    campo !== "id"
  );
}

function resumenLegible(resumen: string): string {
  return resumen
    .replace(/\s+(?:con\s+)?ID\s+\d+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function AuditoriaPage() {
  const router = useRouter();
  const { user, restoreSession } = useAuthStore();
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [usuarios, setUsuarios] = useState<RespuestaAuditoria["usuarios"]>([]);
  const [entidades, setEntidades] = useState<string[]>([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (user && !user.isSuperAdmin) router.replace("/dashboard");
  }, [user, router]);

  const cargarRegistros = useCallback(async (paginaSolicitada = pagina) => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams({ pagina: String(paginaSolicitada) });
      for (const [clave, valor] of Object.entries(filtrosAplicados)) {
        if (valor) params.set(clave, valor);
      }
      const response = await fetch(`/api/auditoria?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudo cargar la auditoría");
      }
      const data = json.data as RespuestaAuditoria;
      setRegistros(data.registros);
      setUsuarios(data.usuarios);
      setEntidades(data.entidades);
      setTotal(data.total);
      setPagina(data.pagina);
      setPaginas(data.paginas);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al cargar la auditoría");
    } finally {
      setCargando(false);
    }
  }, [filtrosAplicados, pagina]);

  useEffect(() => {
    void cargarRegistros(pagina);
  }, [cargarRegistros, pagina]);

  const actualizarFiltro = (clave: keyof Filtros, valor: string) => {
    setFiltros((actuales) => ({ ...actuales, [clave]: valor }));
  };

  const aplicarFiltros = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPagina(1);
    setFiltrosAplicados(filtros);
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    setFiltrosAplicados(FILTROS_VACIOS);
    setPagina(1);
  };

  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      <div className="w-full flex justify-center px-3 pt-4 sm:pt-6 pb-3">
        <div className="w-full max-w-6xl glass-card-solid px-5 sm:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 mb-1">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Trazabilidad</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Registro de auditoría</h1>
              <p className="text-sm text-slate-500 mt-1">
                {total.toLocaleString("es-ES")} movimientos registrados
              </p>
            </div>
            <button
              type="button"
              className="btn-primary bg-slate-800 text-white hover:bg-slate-900 text-sm"
              onClick={() => router.push("/modulos/administracion")}
            >
              Volver a administración
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center px-3 pb-3">
        <form onSubmit={aplicarFiltros} className="w-full max-w-6xl glass-card-solid p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="text-xs font-semibold text-slate-600">
              Usuario
              <select value={filtros.usuario} onChange={(e) => actualizarFiltro("usuario", e.target.value)} className="input-glass mt-1 w-full">
                <option value="">Todos los usuarios</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.actor_username} value={usuario.actor_username}>
                    {usuario.actor_nombre} ({usuario.actor_username})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Tipo de acción
              <select value={filtros.accion} onChange={(e) => actualizarFiltro("accion", e.target.value)} className="input-glass mt-1 w-full">
                <option value="">Todas las acciones</option>
                {ACCIONES.map((accion) => <option key={accion} value={accion}>{etiquetaAccion(accion)}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Tipo de registro
              <select value={filtros.entidad} onChange={(e) => actualizarFiltro("entidad", e.target.value)} className="input-glass mt-1 w-full">
                <option value="">Todos los registros</option>
                {entidades.map((entidad) => <option key={entidad} value={entidad}>{entidad}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Desde
              <input type="date" value={filtros.desde} onChange={(e) => actualizarFiltro("desde", e.target.value)} className="input-glass mt-1 w-full" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Hasta
              <input type="date" value={filtros.hasta} onChange={(e) => actualizarFiltro("hasta", e.target.value)} className="input-glass mt-1 w-full" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Búsqueda
              <input type="search" value={filtros.busqueda} onChange={(e) => actualizarFiltro("busqueda", e.target.value)} placeholder="Descripción, persona o registro" className="input-glass mt-1 w-full" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <button type="button" onClick={limpiarFiltros} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Limpiar
            </button>
            <button type="submit" className="btn-primary bg-indigo-600 text-white hover:bg-indigo-700 text-sm">
              <FileSearch className="w-4 h-4" /> Aplicar filtros
            </button>
          </div>
        </form>
      </div>

      <div className="w-full flex justify-center px-3 pb-8">
        <section className="w-full max-w-6xl">
          {cargando ? (
            <LoaderPersonalizado>Cargando movimientos...</LoaderPersonalizado>
          ) : error ? (
            <div role="alert" className="glass-card-solid p-6 text-center text-red-700">
              {error}
              <button type="button" onClick={() => void cargarRegistros(pagina)} className="ml-3 underline">Reintentar</button>
            </div>
          ) : registros.length === 0 ? (
            <div className="glass-card-solid p-10 text-center text-slate-500">
              <FileSearch className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              No hay movimientos que coincidan con los filtros.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {registros.map((registro) => {
                  const campos = camposAfectados(registro.detalles);
                  const cambios = cambiosRegistrados(registro.detalles);
                  const otrosDetalles = detallesLegibles(registro.detalles);
                  const identificacion =
                    typeof registro.detalles?.identificacion === "string"
                      ? registro.detalles.identificacion
                      : null;
                  const detalleAbierto = abierto === registro.id;
                  return (
                    <article key={registro.id} className="glass-card-solid overflow-hidden">
                      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                            registro.accion === "ELIMINAR" || registro.accion === "BAJA" ? "bg-red-100 text-red-700" :
                            registro.accion === "CREAR" || registro.accion === "REACTIVAR" ? "bg-emerald-100 text-emerald-700" :
                            registro.accion === "APROBAR" || registro.accion === "EXPEDIR" ? "bg-violet-100 text-violet-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {etiquetaAccion(registro.accion)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{resumenLegible(registro.resumen)}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {registro.entidad}{identificacion ? ` · ${identificacion}` : ""}
                              {campos.length > 0 ? ` · ${campos.map((campo) => ETIQUETAS_CAMPOS[campo] ?? campo).join(", ")}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 md:justify-end">
                          <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="font-semibold text-slate-700">{registro.actor_nombre}</span>
                            <span>({registro.actor_username})</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="w-4 h-4" /> {fechaLegible(registro.fecha)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAbierto(detalleAbierto ? null : registro.id)}
                            className="font-semibold text-indigo-700 hover:text-indigo-900"
                            aria-expanded={detalleAbierto}
                          >
                            {detalleAbierto ? "Ocultar detalle" : "Ver detalle"}
                          </button>
                        </div>
                      </div>
                      {detalleAbierto && (
                        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                          {cambios.length > 0 && (
                            <div>
                              <h3 className="mb-2 text-sm font-semibold text-slate-700">Cambios realizados</h3>
                              <ul className="space-y-2">
                                {cambios.map(([campo, cambio]) => (
                                  <li key={campo} className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                                    <span className="font-semibold">{etiquetaCampo(campo)}:</span>{" "}
                                    <span>{mostrarValor(cambio.anterior, campo)}</span>
                                    <span className="mx-2 text-slate-400">→</span>
                                    <span>{mostrarValor(cambio.nuevo, campo)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {cambios.length === 0 && campos.length > 0 && (
                            <p className="mb-2 text-sm text-slate-700">
                              Campos afectados: {campos.map(etiquetaCampo).join(", ")}
                            </p>
                          )}
                          {otrosDetalles.length > 0 && (
                            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                              {otrosDetalles.map(([campo, valor]) => (
                                <div key={campo} className="rounded-lg bg-white px-3 py-2 text-sm">
                                  <dt className="font-semibold text-slate-700">{etiquetaCampo(campo)}</dt>
                                  <dd className="text-slate-600">{mostrarValor(valor, campo)}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                          {cambios.length === 0 && campos.length === 0 && otrosDetalles.length === 0 && (
                            <p className="text-sm text-slate-500">
                              Este movimiento no contiene más detalles.
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between glass-card-solid px-4 py-3 text-sm text-slate-600">
                <span>Página {pagina} de {paginas}</span>
                <div className="flex gap-2">
                  <button type="button" disabled={pagina <= 1} onClick={() => setPagina((actual) => actual - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40" aria-label="Página anterior">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" disabled={pagina >= paginas} onClick={() => setPagina((actual) => actual + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40" aria-label="Página siguiente">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
