"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import LoaderPersonalizado from "../../../components/LoaderPersonalizado";
import Toast, { useToast } from "../../../components/Toast";
import Combobox from "../../../components/ui/Combobox";
import ImageUpload from "../../../components/ImageUpload";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";

type Estado = { id: number; nombre: string };
type Cargo = { id: number; cargo: string };
type TabType = "MINISTERIO" | "CANDIDATO";
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

// Validación de DNI español en frontend
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

// Validación de NIE español en frontend
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

export default function AgregarMinisterio() {
  const router = useRouter();
  const iglesiaSelected = useZonasStore((s) => s.iglesiaSelected);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [todasIglesias, setTodasIglesias] = useState<IglesiaTodas[]>([]);
  const [codigoGenerado, setCodigoGenerado] = useState<string>("");
  const [codigoZona, setCodigoZona] = useState<string>("");
  const [codigoManual, setCodigoManual] = useState(false);
  const [codigoManualNumero, setCodigoManualNumero] = useState<string>("");
  const [loadingCodigo, setLoadingCodigo] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("MINISTERIO");
  const [docType, setDocType] = useState<DocType>("DNI");

  // Pastor state
  const [pastorIglesiaId, setPastorIglesiaId] = useState<string>("");
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

  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    alias: "",
    dni: "",
    nie: "",
    iglesia_id: "",
    estado_id: "",
    aprob: "",
    telefono: "",
    email: "",
    cargos: [4],
  });

  const [candidatoForm, setCandidatoForm] = useState({
    fecha_inicio: new Date().toISOString().split("T")[0],
    notas: "",
  });

  const [loading, setLoading] = useState(false);
  const [imagenFile, setImagenFile] = useState<File | null>(null);

  useEffect(() => {
    if (!iglesiaSelected) {
      router.push("/modulos/gestion-ministerios/zonas-subzonas");
      return;
    }

    // Set default iglesia_id from store
    setForm((f) => ({ ...f, iglesia_id: String(iglesiaSelected.id) }));

    const fetchData = async () => {
      const [estRes, carRes, codRes, igRes] = await Promise.all([
        fetch(`/api/estados`),
        fetch(`/api/cargos`),
        fetch(`/api/ministerios/next-codigo?iglesiaId=${iglesiaSelected.id}`),
        fetch(`/api/iglesias/todas`),
      ]);
      setEstados(await estRes.json());
      setCargos(await carRes.json());
      const codData = await codRes.json();
      if (codData.codigo) {
        setCodigoGenerado(codData.codigo);
      }
      if (codData.codigoZona) {
        setCodigoZona(codData.codigoZona);
      }
      setTodasIglesias(await igRes.json());
      setLoadingCodigo(false);
    };
    fetchData();
  }, [iglesiaSelected, router]);

  // When iglesia changes, re-fetch next codigo
  const handleIglesiaChange = async (val: string) => {
    setForm((f) => ({ ...f, iglesia_id: val }));
    if (val) {
      setLoadingCodigo(true);
      try {
        const codRes = await fetch(`/api/ministerios/next-codigo?iglesiaId=${val}`);
        const codData = await codRes.json();
        if (codData.codigo) setCodigoGenerado(codData.codigo);
        if (codData.codigoZona) setCodigoZona(codData.codigoZona);
      } catch {
        // ignore
      }
      setLoadingCodigo(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "telefono") {
      const numeric = value.replace(/[^0-9]/g, "");
      setForm((f) => ({ ...f, telefono: numeric }));
    } else if (name === "email") {
      setForm((f) => ({ ...f, email: value }));
    } else if (name === "dni") {
      const cleaned = value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 9);
      setForm((f) => ({ ...f, dni: cleaned.toUpperCase() }));
    } else if (name === "nie") {
      const cleaned = value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 9);
      setForm((f) => ({ ...f, nie: cleaned.toUpperCase() }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleCandidatoChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCandidatoForm((f) => ({ ...f, [name]: value }));
  };

  const handleCargoChange = (id: number) => {
    if (activeTab === "MINISTERIO" && id === 4) return;
    if (activeTab === "CANDIDATO" && id === 4) return;

    setForm((f) => {
      const cargos = f.cargos.includes(id)
        ? f.cargos.filter((c) => c !== id)
        : [...f.cargos, id];
      return { ...f, cargos };
    });

    // If pastor cargo is being removed, clear pastor iglesia
    if (id === PASTOR_CARGO_ID && form.cargos.includes(PASTOR_CARGO_ID)) {
      setPastorIglesiaId("");
      setPastorConfirmed(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "MINISTERIO") {
      setForm((f) => ({
        ...f,
        cargos: f.cargos.includes(4) ? f.cargos : [...f.cargos, 4],
      }));
    } else {
      setForm((f) => ({
        ...f,
        cargos: f.cargos.filter((c) => c !== 4),
      }));
    }
    // Clear pastor when switching tabs
    setPastorIglesiaId("");
    setPastorConfirmed(false);
  };

  const handleDocTypeChange = (newDocType: DocType) => {
    setDocType(newDocType);
    if (newDocType === "DNI") {
      setForm((f) => ({ ...f, nie: "" }));
    } else {
      setForm((f) => ({ ...f, dni: "" }));
    }
  };

  // Handle pastor iglesia selection
  const handlePastorIglesiaChange = async (val: string) => {
    if (!val) {
      setPastorIglesiaId("");
      setPastorConfirmed(false);
      return;
    }

    // Check if iglesia already has a pastor
    try {
      const res = await fetch(`/api/pastores/check?iglesiaId=${val}`);
      const data = await res.json();

      if (data.has_pastor) {
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
        // Don't set yet, wait for confirmation
      } else {
        setPastorIglesiaId(val);
        setPastorConfirmed(true);
      }
    } catch {
      setPastorIglesiaId(val);
      setPastorConfirmed(true);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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

    if (activeTab === "MINISTERIO") {
      if (codigoManual) {
        if (!codigoManualNumero || codigoManualNumero.length === 0) {
          errores.push("Debe introducir la parte numérica del «Código»");
        }
      } else {
        if (!codigoGenerado) errores.push("No se ha podido generar el «Código». Recargue la página e intente de nuevo");
      }
      if (form.cargos.length === 0) errores.push("Debe seleccionar al menos un «Cargo»");
    }

    if (activeTab === "CANDIDATO") {
      if (!candidatoForm.fecha_inicio) errores.push("La «Fecha de inicio» es obligatoria para candidatos");
    }

    if (!form.estado_id) errores.push("Debe seleccionar un «Estado»");

    // Validate pastor iglesia if pastor cargo is selected
    if (form.cargos.includes(PASTOR_CARGO_ID) && !pastorIglesiaId) {
      errores.push("Debe seleccionar la iglesia donde va a pastorear");
    }

    if (form.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        errores.push("El «Email» introducido no tiene un formato válido");
      }
    }

    if (errores.length > 0) {
      showError(errores.join("\n"));
      return;
    }

    setLoading(true);
    try {
      const iglesiaId = parseInt(form.iglesia_id, 10);

      const bodyData: Record<string, unknown> = {
        nombre: form.nombre,
        apellidos: form.apellidos || null,
        alias: form.alias || null,
        dni: docType === "DNI" ? (form.dni || null) : null,
        nie: docType === "NIE" ? (form.nie || null) : null,
        estado_id: parseInt(String(form.estado_id), 10),
        telefono: form.telefono || null,
        email: form.email || null,
        iglesia_id: iglesiaId,
        tipo: activeTab,
      };

      if (activeTab === "MINISTERIO") {
        bodyData.aprob = form.aprob ? parseInt(String(form.aprob), 10) : null;
        if (codigoManual) {
          bodyData.codigo_manual = codigoManualNumero;
        }
      } else {
        bodyData.fecha_inicio = candidatoForm.fecha_inicio;
        bodyData.notas = candidatoForm.notas || null;
      }

      const res = await fetch("/api/ministerios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `No se pudo crear el ${activeTab === "MINISTERIO" ? "ministerio" : "candidato"}`);
      }

      const { id: ministerio_id } = await res.json();

      if (imagenFile) {
        const formData = new FormData();
        formData.append("imagen", imagenFile);
        await fetch(`/api/ministerios/${ministerio_id}/imagen`, {
          method: "POST",
          body: formData,
        });
      }

      if (form.cargos.length > 0) {
        await fetch("/api/ministerio_cargo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ministerio_id, cargos: form.cargos }),
        });
      }

      // Assign pastor if pastor cargo selected
      if (form.cargos.includes(PASTOR_CARGO_ID) && pastorIglesiaId) {
        await fetch("/api/pastores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            iglesia_id: parseInt(pastorIglesiaId, 10),
            ministerio_id,
          }),
        });
      }

      showSuccess(
        activeTab === "MINISTERIO"
          ? "Ministerio creado exitosamente"
          : "Candidato creado exitosamente"
      );
      setLoading(false);
      setTimeout(() => {
        router.push("/modulos/gestion-ministerios/ministerios");
      }, 1500);
    } catch (err) {
      setLoading(false);
      showError(err instanceof Error ? err.message : `No se pudo crear el ${activeTab === "MINISTERIO" ? "ministerio" : "candidato"}`);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1959 },
    (_, i) => currentYear - i
  );

  if (!iglesiaSelected || estados.length === 0 || cargos.length === 0) {
    return <LoaderPersonalizado>Cargando...</LoaderPersonalizado>;
  }

  const estadoOptions = estados.map((e) => ({
    value: String(e.id),
    label: e.nombre,
  }));

  const yearOptions = years.map((y) => ({
    value: String(y),
    label: String(y),
  }));

  const iglesiaOptions = todasIglesias.map((ig) => ({
    value: String(ig.id),
    label: `[${ig.zona_codigo}] ${ig.nombre}`,
  }));

  const pastorIglesiaOptions = todasIglesias.map((ig) => ({
    value: String(ig.id),
    label: `[${ig.zona_codigo}] ${ig.nombre}`,
  }));

  const filteredCargos =
    activeTab === "CANDIDATO"
      ? cargos.filter((c) => c.id !== 4)
      : cargos;

  const hasPastorCargo = form.cargos.includes(PASTOR_CARGO_ID);

  // Valor activo del documento y su validación
  const docValue = docType === "DNI" ? form.dni : form.nie;
  const docValidation = docType === "DNI"
    ? (form.dni && form.dni.length === 9 ? validarDNIFrontend(form.dni) : null)
    : (form.nie && form.nie.length === 9 ? validarNIEFrontend(form.nie) : null);

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />
      <main className="min-h-screen flex flex-col items-center justify-center px-3 py-8">
        <div className="w-full max-w-3xl lg:max-w-5xl glass-card-solid p-5 sm:p-8 animate-fadein">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-center sm:text-left flex-1">
              {activeTab === "MINISTERIO" ? "Agregar Ministerio" : "Agregar Candidato"}
            </h2>
            <button
              type="button"
              className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20"
              onClick={() => router.push("/modulos/gestion-ministerios/ministerios")}
              aria-label="Volver"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Volver
            </button>
          </div>

          {/* TABS */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => handleTabChange("MINISTERIO")}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "MINISTERIO"
                  ? "bg-slate-800 text-white shadow-inner"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6M3.75 9v.75A2.25 2.25 0 006 12h12a2.25 2.25 0 002.25-2.25V9" />
              </svg>
              Ministerio
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("CANDIDATO")}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "CANDIDATO"
                  ? "bg-blue-600 text-white shadow-inner"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Candidato
            </button>
          </div>

          <form
            className="flex flex-col gap-5 text-base"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Foto */}
            <div className="flex justify-center">
              <ImageUpload
                nombre={form.nombre || "?"}
                onChange={(file) => setImagenFile(file)}
              />
            </div>

            {/* Nombre, Apellidos, Alias */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nombre" className="font-medium text-slate-700 text-sm">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} className="input-glass w-full" autoComplete="off" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="apellidos" className="font-medium text-slate-700 text-sm">Apellidos</label>
                <input id="apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} className="input-glass w-full" autoComplete="off" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="alias" className="font-medium text-slate-700 text-sm">Alias</label>
                <input id="alias" name="alias" value={form.alias} onChange={handleChange} className="input-glass w-full" autoComplete="off" />
              </div>
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

            {/* Sección condicional según tab */}
            {activeTab === "MINISTERIO" ? (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-x-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="codigo" className="font-medium text-slate-700 text-sm">Código <span className="text-red-500">*</span></label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="checkbox" checked={codigoManual} onChange={(e) => { setCodigoManual(e.target.checked); if (!e.target.checked) setCodigoManualNumero(""); }} className="accent-blue-600 w-3.5 h-3.5" />
                        <span className="text-xs text-slate-500">Introducir código manualmente</span>
                      </label>
                    </div>
                    {codigoManual ? (
                      <div className="flex items-center gap-0">
                        <span className="inline-flex items-center px-3 h-[42px] rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 font-mono text-base text-slate-700 font-semibold tracking-wider select-none">{codigoZona}</span>
                        <input id="codigo_manual_numero" name="codigo_manual_numero" value={codigoManualNumero} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ""); if (val.length <= 4) setCodigoManualNumero(val); }} inputMode="numeric" maxLength={4} placeholder="0000" className="input-glass w-full rounded-l-none font-mono text-base font-semibold tracking-wider" autoComplete="off" />
                      </div>
                    ) : (
                      <div className="input-glass w-full flex items-center bg-slate-50 cursor-not-allowed select-none">
                        {loadingCodigo ? (<span className="text-slate-400 text-sm">Generando código...</span>) : (<span className="font-mono text-base text-slate-700 font-semibold tracking-wider">{codigoGenerado}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="estado_id" className="font-medium text-slate-700 text-sm">Estado <span className="text-red-500">*</span></label>
                    <Combobox id="estado_id" name="estado_id" options={estadoOptions} value={form.estado_id} onChange={(val) => setForm((f) => ({ ...f, estado_id: val }))} placeholder="Selecciona estado" searchPlaceholder="Buscar estado..." emptyMessage="No se encontraron estados." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="aprob" className="font-medium text-slate-700 text-sm">Año de aprobación</label>
                    <Combobox id="aprob" name="aprob" options={yearOptions} value={form.aprob} onChange={(val) => setForm((f) => ({ ...f, aprob: val }))} placeholder="Año de aprobación" searchPlaceholder="Buscar año..." emptyMessage="No se encontró el año." />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fecha_inicio" className="font-medium text-slate-700 text-sm">Fecha de inicio <span className="text-red-500">*</span> <span className="text-xs text-slate-400 font-normal ml-2">(desde cuándo es candidato)</span></label>
                    <input id="fecha_inicio" name="fecha_inicio" type="date" value={candidatoForm.fecha_inicio} onChange={handleCandidatoChange} className="input-glass w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="estado_id" className="font-medium text-slate-700 text-sm">Estado <span className="text-red-500">*</span></label>
                    <Combobox id="estado_id" name="estado_id" options={estadoOptions} value={form.estado_id} onChange={(val) => setForm((f) => ({ ...f, estado_id: val }))} placeholder="Selecciona estado" searchPlaceholder="Buscar estado..." emptyMessage="No se encontraron estados." />
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mt-0.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                    <div>
                      <p className="font-semibold mb-1">Las fases se calculan automáticamente:</p>
                      <ul className="space-y-0.5 text-blue-700">
                        <li>🟡 <strong>Ensayista</strong> → primeros 6 meses</li>
                        <li>🔵 <strong>Candidato Local</strong> → 6 meses a 1,5 años</li>
                        <li>🟣 <strong>Candidato Nacional</strong> → 1,5 años a 6,5 años</li>
                        <li>🟢 <strong>Apto para Obrero</strong> → después de 6,5 años</li>
                      </ul>
                      <p className="mt-1 text-xs text-blue-600">Puede poner una fecha pasada si el candidato ya lleva tiempo en proceso.</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notas" className="font-medium text-slate-700 text-sm">Notas adicionales</label>
                  <textarea id="notas" name="notas" value={candidatoForm.notas} onChange={handleCandidatoChange} className="input-glass w-full min-h-[80px] resize-y" placeholder="Observaciones sobre el candidato..." />
                </div>
              </>
            )}

            {/* Teléfono, Email */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="telefono" className="font-medium text-slate-700 text-sm">Teléfono</label>
                <input id="telefono" name="telefono" value={form.telefono} onChange={handleChange} inputMode="numeric" pattern="[0-9]*" className="input-glass w-full" autoComplete="off" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="font-medium text-slate-700 text-sm">Email</label>
                <input id="email" name="email" value={form.email} onChange={handleChange} type="email" className="input-glass w-full" autoComplete="off" />
              </div>
            </div>

            {/* Cargos */}
            {activeTab === "MINISTERIO" && filteredCargos.length > 0 && (
              <div>
                <label className="block font-semibold mb-2 text-slate-700 text-sm">Cargos <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {filteredCargos.map((cargo) => (
                    <label key={cargo.id} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${cargo.id === 4 ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" : form.cargos.includes(cargo.id) ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                      <input type="checkbox" checked={form.cargos.includes(cargo.id)} disabled={cargo.id === 4} onChange={() => handleCargoChange(cargo.id)} className="accent-blue-600 w-4 h-4" />
                      {cargo.cargo}
                    </label>
                  ))}
                </div>
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
                    ¿De qué iglesia será pastor? <span className="text-red-500">*</span>
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

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-white font-bold text-base shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2 ${activeTab === "MINISTERIO" ? "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-600/25 hover:from-emerald-700 hover:to-emerald-600" : "bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-600/25 hover:from-blue-700 hover:to-blue-600"}`}
              disabled={loading || (activeTab === "MINISTERIO" && loadingCodigo)}
            >
              {loading ? "Creando..." : activeTab === "MINISTERIO" ? "Crear ministerio" : "Crear candidato"}
            </button>
          </form>
        </div>
      </main>

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
                ¿Quiere nombrar a <span className="font-bold text-purple-700">{form.alias || `${form.nombre} ${form.apellidos}`.trim() || "este ministerio"}</span> como nuevo pastor?
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
