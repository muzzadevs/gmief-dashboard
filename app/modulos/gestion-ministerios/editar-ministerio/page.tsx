"use client";

import React, { useEffect, useState } from "react";
import LoaderPersonalizado from "../../../components/LoaderPersonalizado";
import Combobox from "../../../components/ui/Combobox";
import Toast, { useToast } from "../../../components/Toast";
import ImageUpload from "../../../components/ImageUpload";
import ModalConfirmarEliminar from "../../../components/ModalConfirmarEliminar";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";
import { calcularFase, formatDiasRestantes } from "@/lib/candidatoUtils";

type Estado = { id: number; nombre: string };
type Cargo = { id: number; cargo: string };

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
function validarDNIFrontend(dni: string): { valid: boolean; error?: string } {
  if (!dni) return { valid: true };
  const trimmed = dni.trim();
  if (trimmed.length !== 9) return { valid: false, error: "El DNI debe tener 9 caracteres (8 dígitos + 1 letra)" };
  const numberPart = trimmed.slice(0, 8);
  const letterPart = trimmed.slice(8, 9).toUpperCase();
  if (!/^\d{8}$/.test(numberPart)) return { valid: false, error: "Los 8 primeros caracteres del DNI deben ser numéricos" };
  if (!/^[A-Z]$/.test(letterPart)) return { valid: false, error: "El último carácter del DNI debe ser una letra" };
  const expected = DNI_LETTERS[parseInt(numberPart, 10) % 23];
  if (letterPart !== expected) return { valid: false, error: `Letra del DNI incorrecta. Para ${numberPart} la letra debe ser «${expected}»` };
  return { valid: true };
}

type MinisterioForm = {
  id: number;
  nombre: string;
  apellidos: string;
  alias: string;
  dni: string;
  codigo: string | null;
  estado_id: string | number;
  tipo: "MINISTERIO" | "CANDIDATO";
  aprob: string;
  telefono: string;
  email: string;
  cargos: number[];
  fecha_inicio: string;
  fecha_candidato_nacional: string;
  notas: string;
};

export default function EditarMinisterio() {
  const router = useRouter();
  const iglesiaSelected = useZonasStore((s) => s.iglesiaSelected);
  const ministerioEditId = useZonasStore((s) => s.ministerioEditId);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [form, setForm] = useState<MinisterioForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenRemoved, setImagenRemoved] = useState(false);
  const [hasImagen, setHasImagen] = useState(false);
  const [codigoZona, setCodigoZona] = useState<string>("");
  const [codigoNumero, setCodigoNumero] = useState<string>("");
  const [codigoOriginal, setCodigoOriginal] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!iglesiaSelected) {
      router.push("/modulos/gestion-ministerios/zonas-subzonas");
      return;
    }
    const id = ministerioEditId;
    if (!id) {
      router.push("/modulos/gestion-ministerios/ministerios");
      return;
    }
    const fetchData = async () => {
      const [estRes, carRes, minRes] = await Promise.all([
        fetch(`/api/estados`),
        fetch(`/api/cargos`),
        fetch(`/api/ministerios/${id}`),
      ]);
      setEstados(await estRes.json());
      setCargos(await carRes.json());
      const minData = await minRes.json();

      // Obtener el código de zona de la iglesia para separar prefijo y parte numérica
      const zonaRes = await fetch(`/api/ministerios/next-codigo?iglesiaId=${iglesiaSelected.id}`);
      const zonaData = await zonaRes.json();
      const zonaCodigo = zonaData.codigoZona || "";
      setCodigoZona(zonaCodigo);

      // Separar la parte numérica del código
      if (minData.codigo && zonaCodigo) {
        const numPart = minData.codigo.slice(zonaCodigo.length);
        setCodigoNumero(numPart);
        setCodigoOriginal(minData.codigo);
      }

      setForm({
        ...minData,
        estado_id: minData.estado_id?.toString() || "",
        tipo: minData.tipo || "MINISTERIO",
        cargos: minData.cargos ? minData.cargos.split(",").map(Number) : minData.tipo === "MINISTERIO" ? [4] : [],
        fecha_inicio: minData.fecha_inicio || "",
        fecha_candidato_nacional: minData.fecha_candidato_nacional || "",
        notas: minData.notas || "",
        telefono: minData.telefono || "",
        email: minData.email || "",
        apellidos: minData.apellidos || "",
        alias: minData.alias || "",
        dni: minData.dni || "",
        aprob: minData.aprob ? String(minData.aprob) : "",
      });
      setHasImagen(!!minData.has_imagen);
    };
    fetchData();
  }, [iglesiaSelected, router, ministerioEditId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!form) return;
    const { name, value } = e.target;
    if (name === "telefono") {
      const numeric = value.replace(/[^0-9]/g, "");
      setForm((f) => f && { ...f, telefono: numeric });
    } else if (name === "email") {
      setForm((f) => f && { ...f, email: value });
    } else if (name === "dni") {
      const cleaned = value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 9);
      setForm((f) => f && { ...f, dni: cleaned.toUpperCase() });
    } else {
      setForm((f) => f && { ...f, [name]: value });
    }
  };

  const handleCargoChange = (id: number) => {
    if (!form) return;
    if (form.tipo === "MINISTERIO" && id === 4) return;
    if (form.tipo === "CANDIDATO" && id === 4) return;
    setForm((f) => {
      if (!f) return f;
      const cargos = f.cargos.includes(id) ? f.cargos.filter((c) => c !== id) : [...f.cargos, id];
      return { ...f, cargos };
    });
  };

  const handleDelete = async () => {
    if (!form) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/ministerios/${form.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      showSuccess(form.tipo === "MINISTERIO" ? "Ministerio eliminado exitosamente" : "Candidato eliminado exitosamente");
      setTimeout(() => router.push("/modulos/gestion-ministerios/ministerios"), 1500);
    } catch (err) {
      showError(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form || !iglesiaSelected) return;
    const errores: string[] = [];
    if (!form.nombre.trim()) errores.push("El campo «Nombre» es obligatorio");
    if (form.dni) { const dniCheck = validarDNIFrontend(form.dni); if (!dniCheck.valid) errores.push(dniCheck.error!); }
    if (form.tipo === "MINISTERIO") {
      if (!codigoNumero || codigoNumero.length === 0) errores.push("Debe introducir la parte numérica del «Código»");
      if (form.cargos.length === 0) errores.push("Debe seleccionar al menos un «Cargo»");
    }
    if (form.tipo === "CANDIDATO") { if (!form.fecha_inicio) errores.push("La «Fecha de inicio» es obligatoria para candidatos"); }
    if (!form.estado_id) errores.push("Debe seleccionar un «Estado»");
    if (form.email) { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(form.email)) errores.push("El «Email» introducido no tiene un formato válido"); }
    if (errores.length > 0) { showError(errores.join("\n")); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/ministerios/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre, apellidos: form.apellidos || null, alias: form.alias || null, dni: form.dni || null,
          codigo: form.tipo === "MINISTERIO" ? `${codigoZona}${codigoNumero.padStart(4, "0")}` : null, estado_id: parseInt(String(form.estado_id), 10),
          aprob: form.aprob ? parseInt(String(form.aprob), 10) : null, telefono: form.telefono || null, email: form.email || null,
          iglesia_id: iglesiaSelected.id, tipo: form.tipo,
          fecha_inicio: form.tipo === "CANDIDATO" ? form.fecha_inicio : null,
          notas: form.tipo === "CANDIDATO" ? (form.notas || null) : null,
        }),
      });
      if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.error || "No se pudo actualizar"); }
      await fetch(`/api/ministerio_cargo/${form.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cargos: form.cargos }) });
      if (imagenFile) { const formData = new FormData(); formData.append("imagen", imagenFile); await fetch(`/api/ministerios/${form.id}/imagen`, { method: "POST", body: formData }); }
      else if (imagenRemoved && hasImagen) { await fetch(`/api/ministerios/${form.id}/imagen`, { method: "DELETE" }); }
      showSuccess(form.tipo === "MINISTERIO" ? "Ministerio actualizado exitosamente" : "Candidato actualizado exitosamente");
      setLoading(false);
      setTimeout(() => { router.push("/modulos/gestion-ministerios/ministerios"); }, 1500);
    } catch (err) { setLoading(false); showError(err instanceof Error ? err.message : "No se pudo actualizar"); }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1959 }, (_, i) => currentYear - i);

  if (!iglesiaSelected || !form || estados.length === 0 || cargos.length === 0) {
    return <LoaderPersonalizado>Cargando...</LoaderPersonalizado>;
  }

  const estadoOptions = estados.map((e) => ({ value: String(e.id), label: e.nombre }));
  const yearOptions = years.map((y) => ({ value: String(y), label: String(y) }));
  const isCandidato = form.tipo === "CANDIDATO";
  const faseInfo = isCandidato && form.fecha_inicio ? calcularFase(form.fecha_inicio) : null;
  const filteredCargos = isCandidato ? cargos.filter((c) => c.id !== 4) : cargos;

  return (
    <>
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={hideToast} />
      <main className="min-h-screen flex flex-col items-center justify-center px-3 py-8">
        <div className="w-full max-w-3xl lg:max-w-5xl glass-card-solid p-5 sm:p-8 animate-fadein">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 flex-1">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-center sm:text-left">Editar {isCandidato ? "Candidato" : "Ministerio"}</h2>
              {isCandidato && (<span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">Candidato</span>)}
            </div>
            <button type="button" className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20" onClick={() => router.push("/modulos/gestion-ministerios/ministerios")} aria-label="Volver" disabled={loading}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              Volver
            </button>
          </div>

          {isCandidato && faseInfo && (
            <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${faseInfo.textColor} flex items-center gap-2`}>
                  {faseInfo.fase === "ENSAYISTA" && "🟡"}{faseInfo.fase === "CANDIDATO_LOCAL" && "🔵"}{faseInfo.fase === "CANDIDATO_NACIONAL" && "🟣"}{faseInfo.fase === "APTO_OBRERO" && "🟢"}{faseInfo.label}
                </span>
                <span className="text-xs text-slate-500">{faseInfo.fase === "APTO_OBRERO" ? "✅ Completado - Apto para ser aprobado como obrero" : `${formatDiasRestantes(faseInfo.diasRestantes)} restantes para la siguiente fase`}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div className={`h-2.5 rounded-full transition-all duration-500 ${faseInfo.fase === "ENSAYISTA" ? "bg-amber-500" : faseInfo.fase === "CANDIDATO_LOCAL" ? "bg-blue-500" : faseInfo.fase === "CANDIDATO_NACIONAL" ? "bg-purple-500" : "bg-emerald-500"}`} style={{ width: `${Math.round(faseInfo.progreso)}%` }} />
              </div>
              {form.fecha_candidato_nacional && (<p className="text-[10px] text-purple-600 mt-1.5 font-medium">📅 Candidato Nacional desde: {new Date(form.fecha_candidato_nacional).toLocaleDateString("es-ES")}</p>)}
            </div>
          )}

          <form className="flex flex-col gap-5 text-base" onSubmit={handleSubmit} noValidate>
            <div className="flex justify-center">
              <ImageUpload ministerioId={form.id} hasImagen={hasImagen} nombre={form.nombre || "?"} onChange={(file) => { if (file === null) { setImagenFile(null); setImagenRemoved(true); } else { setImagenFile(file); setImagenRemoved(false); } }} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5"><label htmlFor="nombre" className="font-medium text-slate-700 text-sm">Nombre <span className="text-red-500">*</span></label><input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} className="input-glass w-full" autoComplete="off" /></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="apellidos" className="font-medium text-slate-700 text-sm">Apellidos</label><input id="apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} className="input-glass w-full" autoComplete="off" /></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="alias" className="font-medium text-slate-700 text-sm">Alias</label><input id="alias" name="alias" value={form.alias} onChange={handleChange} className="input-glass w-full" autoComplete="off" /></div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="dni" className="font-medium text-slate-700 text-sm">DNI</label>
                <input id="dni" name="dni" value={form.dni} onChange={handleChange} maxLength={9} placeholder="12345678Z" className="input-glass w-full font-mono tracking-wider uppercase" autoComplete="off" />
                {form.dni && form.dni.length === 9 && (() => { const check = validarDNIFrontend(form.dni); return check.valid ? (<span className="text-xs text-emerald-600 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>DNI válido</span>) : (<span className="text-xs text-red-500 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>{check.error}</span>); })()}
              </div>
            </div>

            {!isCandidato ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="codigo_numero" className="font-medium text-slate-700 text-sm">Código <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-0">
                    <span className="inline-flex items-center px-3 h-[42px] rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 font-mono text-base text-slate-700 font-semibold tracking-wider select-none">{codigoZona}</span>
                    <input
                      id="codigo_numero"
                      name="codigo_numero"
                      value={codigoNumero}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        if (val.length <= 4) setCodigoNumero(val);
                      }}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="0000"
                      className="input-glass w-full rounded-l-none font-mono text-base font-semibold tracking-wider"
                      autoComplete="off"
                    />
                  </div>
                  {codigoNumero && codigoOriginal && `${codigoZona}${codigoNumero.padStart(4, "0")}` !== codigoOriginal && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      Código cambiado: {codigoOriginal} → {codigoZona}{codigoNumero.padStart(4, "0")}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5"><label htmlFor="estado_id" className="font-medium text-slate-700 text-sm">Estado <span className="text-red-500">*</span></label><Combobox id="estado_id" name="estado_id" options={estadoOptions} value={String(form.estado_id)} onChange={(val) => setForm((f) => f && { ...f, estado_id: val })} placeholder="Selecciona estado" searchPlaceholder="Buscar estado..." emptyMessage="No se encontraron estados." /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="aprob" className="font-medium text-slate-700 text-sm">Año de aprobación</label><Combobox id="aprob" name="aprob" options={yearOptions} value={form.aprob ? String(form.aprob) : ""} onChange={(val) => setForm((f) => f && { ...f, aprob: val })} placeholder="Año de aprobación" searchPlaceholder="Buscar año..." emptyMessage="No se encontró el año." /></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="flex flex-col gap-1.5"><label htmlFor="fecha_inicio" className="font-medium text-slate-700 text-sm">Fecha de inicio <span className="text-red-500">*</span> <span className="text-xs text-slate-400 font-normal ml-2">(desde cuándo es candidato)</span></label><input id="fecha_inicio" name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} className="input-glass w-full" /></div>
                  <div className="flex flex-col gap-1.5"><label htmlFor="estado_id" className="font-medium text-slate-700 text-sm">Estado <span className="text-red-500">*</span></label><Combobox id="estado_id" name="estado_id" options={estadoOptions} value={String(form.estado_id)} onChange={(val) => setForm((f) => f && { ...f, estado_id: val })} placeholder="Selecciona estado" searchPlaceholder="Buscar estado..." emptyMessage="No se encontraron estados." /></div>
                </div>
                <div className="flex flex-col gap-1.5"><label htmlFor="notas" className="font-medium text-slate-700 text-sm">Notas adicionales</label><textarea id="notas" name="notas" value={form.notas} onChange={handleChange} className="input-glass w-full min-h-[80px] resize-y" placeholder="Observaciones sobre el candidato..." /></div>
              </>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5"><label htmlFor="telefono" className="font-medium text-slate-700 text-sm">Teléfono</label><input id="telefono" name="telefono" value={form.telefono} onChange={handleChange} inputMode="numeric" pattern="[0-9]*" className="input-glass w-full" autoComplete="off" /></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="email" className="font-medium text-slate-700 text-sm">Email</label><input id="email" name="email" value={form.email} onChange={handleChange} type="email" className="input-glass w-full" autoComplete="off" /></div>
            </div>

            {!isCandidato && filteredCargos.length > 0 && (
              <div><label className="block font-semibold mb-2 text-slate-700 text-sm">Cargos <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">{filteredCargos.map((cargo) => (<label key={cargo.id} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${cargo.id === 4 ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" : form.cargos.includes(cargo.id) ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}><input type="checkbox" checked={form.cargos.includes(cargo.id)} disabled={cargo.id === 4} onChange={() => handleCargoChange(cargo.id)} className="accent-blue-600 w-4 h-4" />{cargo.cargo}</label>))}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button type="submit" className={`flex-1 py-2.5 rounded-xl text-white font-bold text-base shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed ${isCandidato ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-600/25 hover:from-blue-700 hover:to-blue-600" : "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-600/25 hover:from-emerald-700 hover:to-emerald-600"}`} disabled={loading}>
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                className="sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-base shadow-lg shadow-red-600/25 hover:from-red-700 hover:to-red-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
                onClick={() => setDeleteModalOpen(true)}
              >
                Eliminar
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Modal confirmar eliminar ministerio/candidato */}
      <ModalConfirmarEliminar
        isOpen={deleteModalOpen}
        titulo={`¿Eliminar ${isCandidato ? "al candidato" : "al ministerio"} "${form?.nombre} ${form?.apellidos || ""}"?`}
        mensaje={`Se eliminará este ${isCandidato ? "candidato" : "ministerio"} del sistema. Esta acción no se puede deshacer fácilmente.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </>
  );
}
