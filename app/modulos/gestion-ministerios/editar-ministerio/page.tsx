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
type DocType = "DNI" | "NIE";
type IglesiaTodas = {
  id: number;
  nombre: string;
  zona_id: number;
  zona_nombre: string;
  zona_codigo: string;
};

const DOC_TYPE_OPTIONS = [
  { value: "DNI", label: "DNI" },
  { value: "NIE", label: "NIE" },
] as const;

const PASTOR_CARGO_ID = 1;

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

function validarNIEFrontend(nie: string): { valid: boolean; error?: string } {
  if (!nie) return { valid: true };
  const trimmed = nie.trim().toUpperCase();
  if (trimmed.length !== 9) return { valid: false, error: "El NIE debe tener 9 caracteres (1 letra + 7 dígitos + 1 letra)" };
  const firstLetter = trimmed.charAt(0);
  const numberPart = trimmed.slice(1, 8);
  const controlLetter = trimmed.charAt(8);
  if (!/^[XYZ]$/.test(firstLetter)) return { valid: false, error: "El NIE debe comenzar con X, Y o Z" };
  if (!/^\d{7}$/.test(numberPart)) return { valid: false, error: "El NIE debe tener 7 dígitos después de la letra inicial" };
  if (!/^[A-Z]$/.test(controlLetter)) return { valid: false, error: "El último carácter del NIE debe ser una letra" };
  const prefixMap: Record<string, string> = { X: "0", Y: "1", Z: "2" };
  const fullNumber = prefixMap[firstLetter] + numberPart;
  const num = parseInt(fullNumber, 10);
  const expected = DNI_LETTERS[num % 23];
  if (controlLetter !== expected) return { valid: false, error: `Letra de control del NIE incorrecta. Para ${trimmed.slice(0, 8)} la letra debe ser «${expected}»` };
  return { valid: true };
}

type MinisterioForm = {
  id: number;
  nombre: string;
  apellidos: string;
  alias: string;
  dni: string;
  nie: string;
  iglesia_id: string;
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
  const [todasIglesias, setTodasIglesias] = useState<IglesiaTodas[]>([]);
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
  const [docType, setDocType] = useState<DocType>("DNI");

  // Pastor state
  const [pastorIglesiaId, setPastorIglesiaId] = useState<string>("");
  const [originalPastorIglesiaId, setOriginalPastorIglesiaId] = useState<string>("");
  const [hadPastorCargo, setHadPastorCargo] = useState(false);
  const [pastorConfirmModal, setPastorConfirmModal] = useState<{
    open: boolean;
    iglesiaId: number;
    iglesiaNombre: string;
    pastorActual: {
      display_name: string;
      iglesia_nombre: string;
      zona_nombre: string;
    } | null;
  }>({ open: false, iglesiaId: 0, iglesiaNombre: "", pastorActual: null });
  const [pastorConfirmed, setPastorConfirmed] = useState(false);

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
      const [estRes, carRes, minRes, igRes] = await Promise.all([
        fetch(`/api/estados`),
        fetch(`/api/cargos`),
        fetch(`/api/ministerios/${id}`),
        fetch(`/api/iglesias/todas`),
      ]);
      setEstados(await estRes.json());
      setCargos(await carRes.json());
      const minData = await minRes.json();
      const iglesiasData = await igRes.json();
      setTodasIglesias(iglesiasData);

      // Obtener el código de zona de la iglesia del ministerio
      const zonaRes = await fetch(`/api/ministerios/next-codigo?iglesiaId=${minData.iglesia_id}`);
      const zonaData = await zonaRes.json();
      const zonaCodigo = zonaData.codigoZona || "";
      setCodigoZona(zonaCodigo);

      if (minData.codigo && zonaCodigo) {
        const numPart = minData.codigo.slice(zonaCodigo.length);
        setCodigoNumero(numPart);
        setCodigoOriginal(minData.codigo);
      }

      if (minData.nie) {
        setDocType("NIE");
      } else {
        setDocType("DNI");
      }

      const cargoIds = minData.cargos ? minData.cargos.split(",").map(Number) : minData.tipo === "MINISTERIO" ? [4] : [];

      setForm({
        ...minData,
        iglesia_id: String(minData.iglesia_id),
        estado_id: minData.estado_id?.toString() || "",
        tipo: minData.tipo || "MINISTERIO",
        cargos: cargoIds,
        fecha_inicio: minData.fecha_inicio || "",
        fecha_candidato_nacional: minData.fecha_candidato_nacional || "",
        notas: minData.notas || "",
        telefono: minData.telefono || "",
        email: minData.email || "",
        apellidos: minData.apellidos || "",
        alias: minData.alias || "",
        dni: minData.dni || "",
        nie: minData.nie || "",
        aprob: minData.aprob ? String(minData.aprob) : "",
      });
      setHasImagen(!!minData.has_imagen);

      // Check if this ministerio has pastor cargo and is pastor of an iglesia
      const hasPastor = cargoIds.includes(PASTOR_CARGO_ID);
      setHadPastorCargo(hasPastor);
      if (hasPastor) {
        try {
          const pastorRes = await fetch(`/api/pastores?ministerioId=${id}`);
          const pastorData = await pastorRes.json();
          if (pastorData && pastorData.iglesia_id) {
            setPastorIglesiaId(String(pastorData.iglesia_id));
            setOriginalPastorIglesiaId(String(pastorData.iglesia_id));
            setPastorConfirmed(true);
          }
        } catch {
          // ignore
        }
      }
    };
    fetchData();
  }, [iglesiaSelected, router, ministerioEditId]);

  // When iglesia changes in form, re-fetch codigo
  const handleIglesiaChange = async (val: string) => {
    if (!form) return;
    setForm((f) => f && { ...f, iglesia_id: val });
    if (val) {
      try {
        const codRes = await fetch(`/api/ministerios/next-codigo?iglesiaId=${val}`);
        const codData = await codRes.json();
        if (codData.codigoZona) setCodigoZona(codData.codigoZona);
      } catch {
        // ignore
      }
    }
  };

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
    } else if (name === "nie") {
      const cleaned = value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 9);
      setForm((f) => f && { ...f, nie: cleaned.toUpperCase() });
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

    // If pastor cargo is being removed, clear pastor iglesia
    if (id === PASTOR_CARGO_ID && form.cargos.includes(PASTOR_CARGO_ID)) {
      setPastorIglesiaId("");
      setPastorConfirmed(false);
    }
  };

  const handleDocTypeChange = (newDocType: DocType) => {
    setDocType(newDocType);
    if (newDocType === "DNI") {
      setForm((f) => f && { ...f, nie: "" });
    } else {
      setForm((f) => f && { ...f, dni: "" });
    }
  };

  // Handle pastor iglesia selection
  const handlePastorIglesiaChange = async (val: string) => {
    if (!val) {
      setPastorIglesiaId("");
      setPastorConfirmed(false);
      return;
    }

    // If it's the same as original, just set it
    if (val === originalPastorIglesiaId) {
      setPastorIglesiaId(val);
      setPastorConfirmed(true);
      return;
    }

    // Check if iglesia already has a pastor
    try {
      const res = await fetch(`/api/pastores/check?iglesiaId=${val}`);
      const data = await res.json();

      if (data.has_pastor && data.pastor.ministerio_id !== form?.id) {
        const iglesiaInfo = todasIglesias.find((ig) => ig.id === Number(val));
        setPastorConfirmModal({
          open: true,
          iglesiaId: Number(val),
          iglesiaNombre: iglesiaInfo ? `[${iglesiaInfo.zona_codigo}] ${iglesiaInfo.nombre}` : "",
          pastorActual: {
            display_name: data.pastor.display_name,
            iglesia_nombre: data.pastor.iglesia_nombre,
            zona_nombre: data.pastor.zona_nombre,
          },
        });
      } else {
        setPastorIglesiaId(val);
        setPastorConfirmed(true);
      }
    } catch {
      setPastorIglesiaId(val);
      setPastorConfirmed(true);
    }
  };

  const handleDelete = async () => {
    if (!form) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/ministerios/${form.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");

      // Also remove pastor assignment if had one
      if (hadPastorCargo) {
        await fetch("/api/pastores", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ministerio_id: form.id }),
        });
      }

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
    if (!form) return;
    const errores: string[] = [];
    if (!form.nombre.trim()) errores.push("El campo «Nombre» es obligatorio");

    if (docType === "DNI" && form.dni) {
      const dniCheck = validarDNIFrontend(form.dni);
      if (!dniCheck.valid) errores.push(dniCheck.error!);
    }
    if (docType === "NIE" && form.nie) {
      const nieCheck = validarNIEFrontend(form.nie);
      if (!nieCheck.valid) errores.push(nieCheck.error!);
    }

    if (!form.iglesia_id) errores.push("Debe seleccionar una «Iglesia»");

    if (form.tipo === "MINISTERIO") {
      if (!codigoNumero || codigoNumero.length === 0) errores.push("Debe introducir la parte numérica del «Código»");
      if (form.cargos.length === 0) errores.push("Debe seleccionar al menos un «Cargo»");
    }
    if (form.tipo === "CANDIDATO") { if (!form.fecha_inicio) errores.push("La «Fecha de inicio» es obligatoria para candidatos"); }
    if (!form.estado_id) errores.push("Debe seleccionar un «Estado»");

    // Validate pastor iglesia if pastor cargo is selected
    if (form.cargos.includes(PASTOR_CARGO_ID) && !pastorIglesiaId) {
      errores.push("Debe seleccionar la iglesia donde va a pastorear");
    }

    if (form.email) { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(form.email)) errores.push("El «Email» introducido no tiene un formato válido"); }
    if (errores.length > 0) { showError(errores.join("\n")); return; }

    setLoading(true);
    try {
      const iglesiaId = parseInt(form.iglesia_id, 10);

      const res = await fetch(`/api/ministerios/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellidos: form.apellidos || null,
          alias: form.alias || null,
          dni: docType === "DNI" ? (form.dni || null) : null,
          nie: docType === "NIE" ? (form.nie || null) : null,
          codigo: form.tipo === "MINISTERIO" ? `${codigoZona}${codigoNumero.padStart(4, "0")}` : null,
          estado_id: parseInt(String(form.estado_id), 10),
          aprob: form.aprob ? parseInt(String(form.aprob), 10) : null,
          telefono: form.telefono || null,
          email: form.email || null,
          iglesia_id: iglesiaId,
          tipo: form.tipo,
          fecha_inicio: form.tipo === "CANDIDATO" ? form.fecha_inicio : null,
          notas: form.tipo === "CANDIDATO" ? (form.notas || null) : null,
        }),
      });
      if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.error || "No se pudo actualizar"); }
      await fetch(`/api/ministerio_cargo/${form.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cargos: form.cargos }) });
      if (imagenFile) { const formData = new FormData(); formData.append("imagen", imagenFile); await fetch(`/api/ministerios/${form.id}/imagen`, { method: "POST", body: formData }); }
      else if (imagenRemoved && hasImagen) { await fetch(`/api/ministerios/${form.id}/imagen`, { method: "DELETE" }); }

      // Handle pastor assignment
      const hasPastorCargoNow = form.cargos.includes(PASTOR_CARGO_ID);
      if (hasPastorCargoNow && pastorIglesiaId) {
        // Assign or update pastor
        await fetch("/api/pastores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            iglesia_id: parseInt(pastorIglesiaId, 10),
            ministerio_id: form.id,
          }),
        });
      } else if (!hasPastorCargoNow && hadPastorCargo) {
        // Remove pastor assignment
        await fetch("/api/pastores", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ministerio_id: form.id }),
        });
      }

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
  const iglesiaOptions = todasIglesias.map((ig) => ({
    value: String(ig.id),
    label: `[${ig.zona_codigo}] ${ig.nombre}`,
  }));
  const pastorIglesiaOptions = todasIglesias.map((ig) => ({
    value: String(ig.id),
    label: `[${ig.zona_codigo}] ${ig.nombre}`,
  }));

  const isCandidato = form.tipo === "CANDIDATO";
  const faseInfo = isCandidato && form.fecha_inicio ? calcularFase(form.fecha_inicio) : null;
  const filteredCargos = isCandidato ? cargos.filter((c) => c.id !== 4) : cargos;
  const hasPastorCargo = form.cargos.includes(PASTOR_CARGO_ID);

  const docValue = docType === "DNI" ? form.dni : form.nie;
  const docValidation = docType === "DNI"
    ? (form.dni && form.dni.length === 9 ? validarDNIFrontend(form.dni) : null)
    : (form.nie && form.nie.length === 9 ? validarNIEFrontend(form.nie) : null);

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

            {/* Iglesia */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="iglesia_id" className="font-medium text-slate-700 text-sm">
                  Iglesia <span className="text-red-500">*</span>
                </label>
                <Combobox
                  id="iglesia_id"
                  name="iglesia_id"
                  options={iglesiaOptions}
                  value={form.iglesia_id}
                  onChange={handleIglesiaChange}
                  placeholder="Selecciona iglesia"
                  searchPlaceholder="Buscar iglesia..."
                  emptyMessage="No se encontraron iglesias."
                />
              </div>
            </div>

            {/* DNI / NIE con selector */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-6">
              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-slate-700 text-sm">
                  Documento de identidad
                  <span className="text-xs text-slate-400 font-normal ml-2">
                    {docType === "DNI" ? "(8 dígitos + letra)" : "(X/Y/Z + 7 dígitos + letra)"}
                  </span>
                </label>
                <div className="flex items-center gap-2.5">
                  <Combobox
                    options={[...DOC_TYPE_OPTIONS]}
                    value={docType}
                    onChange={(value) => handleDocTypeChange(value as DocType)}
                    placeholder="DNI"
                    searchable={false}
                    emptyMessage="No hay documentos disponibles."
                    aria-label="Tipo de documento"
                    className="w-[88px] shrink-0 px-3 font-semibold text-slate-700"
                  />
                  <input
                    id={docType === "DNI" ? "dni" : "nie"}
                    name={docType === "DNI" ? "dni" : "nie"}
                    value={docValue}
                    onChange={handleChange}
                    maxLength={9}
                    placeholder={docType === "DNI" ? "12345678Z" : "X1234567L"}
                    className="input-glass w-full font-mono tracking-wider uppercase"
                    autoComplete="off"
                  />
                </div>
                {docValidation && (() => {
                  return docValidation.valid ? (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {docType} válido
                    </span>
                  ) : (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      {docValidation.error}
                    </span>
                  );
                })()}
              </div>
            </div>

            {!isCandidato ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-x-6">
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

            {/* Pastor iglesia selector */}
            {hasPastorCargo && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-purple-800 text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6M3.75 9v.75A2.25 2.25 0 006 12h12a2.25 2.25 0 002.25-2.25V9" />
                    </svg>
                    ¿De qué iglesia es pastor? <span className="text-red-500">*</span>
                  </label>
                  <Combobox
                    options={pastorIglesiaOptions}
                    value={pastorIglesiaId}
                    onChange={handlePastorIglesiaChange}
                    placeholder="Selecciona la iglesia"
                    searchPlaceholder="Buscar iglesia..."
                    emptyMessage="No se encontraron iglesias."
                  />
                  {pastorIglesiaId && pastorConfirmed && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Iglesia seleccionada
                    </span>
                  )}
                </div>
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

      {/* Modal confirmar cambio de pastor */}
      {pastorConfirmModal.open && pastorConfirmModal.pastorActual && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => {
            setPastorConfirmModal({ open: false, iglesiaId: 0, iglesiaNombre: "", pastorActual: null });
          }}
        >
          <div
            className="glass-card-solid p-8 max-w-md w-full flex flex-col gap-6 animate-fadein"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-amber-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="text-lg font-semibold text-slate-800 mb-2">
                Iglesia con pastor asignado
              </div>
              <p className="text-sm text-slate-600">
                El pastor actual de <span className="font-bold text-slate-800">{pastorConfirmModal.iglesiaNombre}</span> es:
              </p>
              <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800">{pastorConfirmModal.pastorActual.display_name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Zona {pastorConfirmModal.pastorActual.zona_nombre} · De la iglesia {pastorConfirmModal.pastorActual.iglesia_nombre}
                </p>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                ¿Quiere nombrar a <span className="font-bold text-purple-700">{form?.alias || `${form?.nombre} ${form?.apellidos}`.trim() || "este ministerio"}</span> como nuevo pastor?
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-md"
                onClick={() => {
                  setPastorConfirmModal({ open: false, iglesiaId: 0, iglesiaNombre: "", pastorActual: null });
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                onClick={() => {
                  setPastorIglesiaId(String(pastorConfirmModal.iglesiaId));
                  setPastorConfirmed(true);
                  setPastorConfirmModal({ open: false, iglesiaId: 0, iglesiaNombre: "", pastorActual: null });
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
