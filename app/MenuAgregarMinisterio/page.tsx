"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import LoaderPersonalizado from "../components/LoaderPersonalizado";
import Toast, { useToast } from "../components/Toast";
import Combobox from "../components/ui/Combobox";
import ImageUpload from "../components/ImageUpload";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";

type Estado = { id: number; nombre: string };
type Cargo = { id: number; cargo: string };
type TabType = "MINISTERIO" | "CANDIDATO";

// Validación de DNI español en frontend
const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
function validarDNIFrontend(dni: string): { valid: boolean; error?: string } {
  if (!dni) return { valid: true }; // DNI es opcional
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

export default function MenuAgregarMinisterio() {
  const router = useRouter();
  const iglesiaSelected = useZonasStore((s) => s.iglesiaSelected);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [codigoGenerado, setCodigoGenerado] = useState<string>("");
  const [codigoZona, setCodigoZona] = useState<string>("");
  const [codigoManual, setCodigoManual] = useState(false);
  const [codigoManualNumero, setCodigoManualNumero] = useState<string>("");
  const [loadingCodigo, setLoadingCodigo] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("MINISTERIO");

  // Form para ministerio
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    alias: "",
    dni: "",
    estado_id: "",
    aprob: "",
    telefono: "",
    email: "",
    cargos: [4],
  });

  // Form extra para candidato
  const [candidatoForm, setCandidatoForm] = useState({
    fecha_inicio: new Date().toISOString().split("T")[0],
    notas: "",
  });

  const [loading, setLoading] = useState(false);
  const [imagenFile, setImagenFile] = useState<File | null>(null);

  useEffect(() => {
    if (!iglesiaSelected) {
      router.push("/MenuZonasSubZonas");
      return;
    }
    const fetchData = async () => {
      const [estRes, carRes, codRes] = await Promise.all([
        fetch(`/api/estados`),
        fetch(`/api/cargos`),
        fetch(`/api/ministerios/next-codigo?iglesiaId=${iglesiaSelected.id}`),
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
      setLoadingCodigo(false);
    };
    fetchData();
  }, [iglesiaSelected, router]);

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
      // Permitir solo dígitos y letras, máximo 9 caracteres
      const cleaned = value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 9);
      setForm((f) => ({ ...f, dni: cleaned.toUpperCase() }));
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
    // Para ministerios, Obrero (4) siempre está marcado
    if (activeTab === "MINISTERIO" && id === 4) return;
    // Para candidatos, no se puede marcar Obrero
    if (activeTab === "CANDIDATO" && id === 4) return;

    setForm((f) => {
      const cargos = f.cargos.includes(id)
        ? f.cargos.filter((c) => c !== id)
        : [...f.cargos, id];
      return { ...f, cargos };
    });
  };

  // Al cambiar de tab, ajustar cargos
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "MINISTERIO") {
      // Asegurar que Obrero está incluido
      setForm((f) => ({
        ...f,
        cargos: f.cargos.includes(4) ? f.cargos : [...f.cargos, 4],
      }));
    } else {
      // Quitar Obrero de los cargos para candidato
      setForm((f) => ({
        ...f,
        cargos: f.cargos.filter((c) => c !== 4),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errores: string[] = [];
    if (!form.nombre.trim()) errores.push("El campo «Nombre» es obligatorio");

    // Validar DNI si se ha introducido
    if (form.dni) {
      const dniCheck = validarDNIFrontend(form.dni);
      if (!dniCheck.valid) errores.push(dniCheck.error!);
    }

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
      if (!iglesiaSelected) throw new Error("No hay iglesia seleccionada");

      const bodyData: Record<string, unknown> = {
        nombre: form.nombre,
        apellidos: form.apellidos || null,
        alias: form.alias || null,
        dni: form.dni || null,
        estado_id: parseInt(String(form.estado_id), 10),
        telefono: form.telefono || null,
        email: form.email || null,
        iglesia_id: iglesiaSelected.id,
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

      // Subir imagen si se seleccionó una
      if (imagenFile) {
        const formData = new FormData();
        formData.append("imagen", imagenFile);
        await fetch(`/api/ministerios/${ministerio_id}/imagen`, {
          method: "POST",
          body: formData,
        });
      }

      // Asignar cargos si hay alguno seleccionado
      if (form.cargos.length > 0) {
        await fetch("/api/ministerio_cargo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ministerio_id, cargos: form.cargos }),
        });
      }

      showSuccess(
        activeTab === "MINISTERIO"
          ? "Ministerio creado exitosamente"
          : "Candidato creado exitosamente"
      );
      setLoading(false);
      setTimeout(() => {
        router.push("/MenuMinisterios");
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

  // Filtrar cargos según el tab activo
  // Para candidatos: excluir Obrero (id=4)
  const filteredCargos =
    activeTab === "CANDIDATO"
      ? cargos.filter((c) => c.id !== 4)
      : cargos;

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
              onClick={() => router.push("/MenuMinisterios")}
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
                <input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="input-glass w-full"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="apellidos" className="font-medium text-slate-700 text-sm">
                  Apellidos
                </label>
                <input
                  id="apellidos"
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  className="input-glass w-full"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="alias" className="font-medium text-slate-700 text-sm">
                  Alias
                </label>
                <input
                  id="alias"
                  name="alias"
                  value={form.alias}
                  onChange={handleChange}
                  className="input-glass w-full"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* DNI */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="dni" className="font-medium text-slate-700 text-sm">
                  DNI
                  <span className="text-xs text-slate-400 font-normal ml-2">
                    (8 dígitos + letra)
                  </span>
                </label>
                <input
                  id="dni"
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  maxLength={9}
                  placeholder="12345678Z"
                  className="input-glass w-full font-mono tracking-wider uppercase"
                  autoComplete="off"
                />
                {form.dni && form.dni.length === 9 && (() => {
                  const check = validarDNIFrontend(form.dni);
                  return check.valid ? (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      DNI válido
                    </span>
                  ) : (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      {check.error}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Sección condicional según tab */}
            {activeTab === "MINISTERIO" ? (
              <>
                {/* Código (auto-generado o manual), Estado, Año */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="codigo" className="font-medium text-slate-700 text-sm">
                        Código <span className="text-red-500">*</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={codigoManual}
                          onChange={(e) => {
                            setCodigoManual(e.target.checked);
                            if (!e.target.checked) {
                              setCodigoManualNumero("");
                            }
                          }}
                          className="accent-blue-600 w-3.5 h-3.5"
                        />
                        <span className="text-xs text-slate-500">Introducir código manualmente</span>
                      </label>
                    </div>
                    {codigoManual ? (
                      <div className="flex items-center gap-0">
                        <span className="inline-flex items-center px-3 h-[42px] rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 font-mono text-base text-slate-700 font-semibold tracking-wider select-none">
                          {codigoZona}
                        </span>
                        <input
                          id="codigo_manual_numero"
                          name="codigo_manual_numero"
                          value={codigoManualNumero}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            if (val.length <= 4) {
                              setCodigoManualNumero(val);
                            }
                          }}
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="0000"
                          className="input-glass w-full rounded-l-none font-mono text-base font-semibold tracking-wider"
                          autoComplete="off"
                        />
                      </div>
                    ) : (
                      <div className="input-glass w-full flex items-center bg-slate-50 cursor-not-allowed select-none">
                        {loadingCodigo ? (
                          <span className="text-slate-400 text-sm">Generando código...</span>
                        ) : (
                          <span className="font-mono text-base text-slate-700 font-semibold tracking-wider">
                            {codigoGenerado}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="estado_id" className="font-medium text-slate-700 text-sm">
                      Estado <span className="text-red-500">*</span>
                    </label>
                    <Combobox
                      id="estado_id"
                      name="estado_id"
                      options={estadoOptions}
                      value={form.estado_id}
                      onChange={(val) => setForm((f) => ({ ...f, estado_id: val }))}
                      placeholder="Selecciona estado"
                      searchPlaceholder="Buscar estado..."
                      emptyMessage="No se encontraron estados."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="aprob" className="font-medium text-slate-700 text-sm">
                      Año de aprobación
                    </label>
                    <Combobox
                      id="aprob"
                      name="aprob"
                      options={yearOptions}
                      value={form.aprob}
                      onChange={(val) => setForm((f) => ({ ...f, aprob: val }))}
                      placeholder="Año de aprobación"
                      searchPlaceholder="Buscar año..."
                      emptyMessage="No se encontró el año."
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Candidato: Fecha inicio, Estado */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fecha_inicio" className="font-medium text-slate-700 text-sm">
                      Fecha de inicio <span className="text-red-500">*</span>
                      <span className="text-xs text-slate-400 font-normal ml-2">
                        (desde cuándo es candidato)
                      </span>
                    </label>
                    <input
                      id="fecha_inicio"
                      name="fecha_inicio"
                      type="date"
                      value={candidatoForm.fecha_inicio}
                      onChange={handleCandidatoChange}
                      className="input-glass w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="estado_id" className="font-medium text-slate-700 text-sm">
                      Estado <span className="text-red-500">*</span>
                    </label>
                    <Combobox
                      id="estado_id"
                      name="estado_id"
                      options={estadoOptions}
                      value={form.estado_id}
                      onChange={(val) => setForm((f) => ({ ...f, estado_id: val }))}
                      placeholder="Selecciona estado"
                      searchPlaceholder="Buscar estado..."
                      emptyMessage="No se encontraron estados."
                    />
                  </div>
                </div>

                {/* Info de fase automática */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mt-0.5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <div>
                      <p className="font-semibold mb-1">Las fases se calculan automáticamente:</p>
                      <ul className="space-y-0.5 text-blue-700">
                        <li>🟡 <strong>Ensayista</strong> → primeros 6 meses</li>
                        <li>🔵 <strong>Candidato Local</strong> → 6 meses a 1,5 años</li>
                        <li>🟣 <strong>Candidato Nacional</strong> → 1,5 años a 6,5 años</li>
                        <li>🟢 <strong>Apto para Obrero</strong> → después de 6,5 años</li>
                      </ul>
                      <p className="mt-1 text-xs text-blue-600">
                        Puede poner una fecha pasada si el candidato ya lleva tiempo en proceso.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notas" className="font-medium text-slate-700 text-sm">
                    Notas adicionales
                  </label>
                  <textarea
                    id="notas"
                    name="notas"
                    value={candidatoForm.notas}
                    onChange={handleCandidatoChange}
                    className="input-glass w-full min-h-[80px] resize-y"
                    placeholder="Observaciones sobre el candidato..."
                  />
                </div>
              </>
            )}

            {/* Teléfono, Email */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="telefono" className="font-medium text-slate-700 text-sm">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input-glass w-full"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="font-medium text-slate-700 text-sm">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  className="input-glass w-full"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Cargos - Solo para ministerios */}
            {activeTab === "MINISTERIO" && filteredCargos.length > 0 && (
              <div>
                <label className="block font-semibold mb-2 text-slate-700 text-sm">
                  Cargos <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {filteredCargos.map((cargo) => (
                    <label
                      key={cargo.id}
                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                        cargo.id === 4
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                          : form.cargos.includes(cargo.id)
                          ? "bg-blue-50 border-blue-200 text-blue-800"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.cargos.includes(cargo.id)}
                        disabled={cargo.id === 4}
                        onChange={() => handleCargoChange(cargo.id)}
                        className="accent-blue-600 w-4 h-4"
                      />
                      {cargo.cargo}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-white font-bold text-base shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2 ${
                activeTab === "MINISTERIO"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-600/25 hover:from-emerald-700 hover:to-emerald-600"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-600/25 hover:from-blue-700 hover:to-blue-600"
              }`}
              disabled={loading || (activeTab === "MINISTERIO" && loadingCodigo)}
            >
              {loading
                ? "Creando..."
                : activeTab === "MINISTERIO"
                ? "Crear ministerio"
                : "Crear candidato"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
