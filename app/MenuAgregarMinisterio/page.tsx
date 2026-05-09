"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import ModalCodigoDuplicado from "../components/ModalCodigoDuplicado";
import LoaderPersonalizado from "../components/LoaderPersonalizado";
import Toast, { useToast } from "../components/Toast";
import Combobox from "../components/ui/Combobox";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";

type Estado = { id: number; nombre: string };
type Cargo = { id: number; cargo: string };

export default function MenuAgregarMinisterio() {
  const router = useRouter();
  const iglesiaSelected = useZonasStore((s) => s.iglesiaSelected);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    alias: "",
    codigo: "",
    estado_id: "",
    aprob: "",
    telefono: "",
    email: "",
    cargos: [4],
  });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNombre, setModalNombre] = useState("");
  const [modalApellidos, setModalApellidos] = useState("");

  useEffect(() => {
    if (!iglesiaSelected) {
      router.push("/MenuZonasSubZonas");
      return;
    }
    const fetchData = async () => {
      const [estRes, carRes] = await Promise.all([
        fetch(`/api/estados`),
        fetch(`/api/cargos`),
      ]);
      setEstados(await estRes.json());
      setCargos(await carRes.json());
    };
    fetchData();
  }, [iglesiaSelected, router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "codigo") {
      const cleaned = value
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 6);
      setForm((f) => ({ ...f, codigo: cleaned }));
    } else if (name === "telefono") {
      const numeric = value.replace(/[^0-9]/g, "");
      setForm((f) => ({ ...f, telefono: numeric }));
    } else if (name === "email") {
      setForm((f) => ({ ...f, email: value }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleCargoChange = (id: number) => {
    if (id === 4) return;
    setForm((f) => {
      const cargos = f.cargos.includes(id)
        ? f.cargos.filter((c) => c !== id)
        : [...f.cargos, id];
      return { ...f, cargos };
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        showError("El email no es válido");
        return;
      }
    }
    setLoading(true);
    try {
      const codigoRegex = /^[A-Z]{3}\d{3}$/;
      if (!codigoRegex.test(form.codigo)) {
        setLoading(false);
        showError(
          "El código debe tener el formato AAA111 (3 letras mayúsculas seguidas de 3 números)"
        );
        return;
      }
      if (!iglesiaSelected) throw new Error("No hay iglesia seleccionada");
      const codigo = form.codigo.toUpperCase();
      const resCodigo = await fetch(
        `/api/ministerios/codigo?codigo=${encodeURIComponent(codigo)}`
      );
      const ministerioExistente = await resCodigo.json();
      if (ministerioExistente) {
        setModalNombre(ministerioExistente.nombre || "");
        setModalApellidos(ministerioExistente.apellidos || "");
        setModalOpen(true);
        setLoading(false);
        return;
      }
      const res = await fetch("/api/ministerios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellidos: form.apellidos,
          alias: form.alias || null,
          codigo,
          estado_id: parseInt(String(form.estado_id), 10),
          aprob: form.aprob ? parseInt(String(form.aprob), 10) : null,
          telefono: form.telefono || null,
          email: form.email || null,
          iglesia_id: iglesiaSelected.id,
        }),
      });
      if (!res.ok) throw new Error("No se pudo crear el ministerio");
      const { id: ministerio_id } = await res.json();
      await fetch("/api/ministerio_cargo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ministerio_id, cargos: form.cargos }),
      });

      showSuccess("Ministerio creado exitosamente");
      setLoading(false);
      setTimeout(() => {
        router.push("/MenuMinisterios");
      }, 1500);
    } catch {
      setLoading(false);
      showError("No se pudo crear el ministerio");
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

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />
      <ModalCodigoDuplicado
        open={modalOpen}
        nombreMinisterio={modalNombre}
        apellidosMinisterio={modalApellidos}
        onClose={() => setModalOpen(false)}
      />
      <main className="min-h-screen flex flex-col items-center justify-center px-3 py-8">
        <div className="w-full max-w-3xl lg:max-w-5xl glass-card-solid p-5 sm:p-8 animate-fadein">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-center sm:text-left flex-1">
              Agregar Ministerio
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
          <form
            className="flex flex-col gap-5 text-base"
            onSubmit={handleSubmit}
          >
            {/* Nombre, Apellidos, Alias */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nombre" className="font-medium text-slate-700 text-sm">
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
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
                  required
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

            {/* Código, Estado, Año */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="codigo" className="font-medium text-slate-700 text-sm">
                  Código
                </label>
                <input
                  id="codigo"
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChange}
                  required
                  placeholder="Ej: ABC123"
                  pattern="[A-Z]{3}[0-9]{3}"
                  maxLength={6}
                  inputMode="text"
                  autoComplete="off"
                  className="input-glass w-full"
                  onInvalid={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.setCustomValidity(
                      "El código de ministerio debe estar formado por 3 letras y 3 números"
                    );
                  }}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.setCustomValidity("");
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="estado_id" className="font-medium text-slate-700 text-sm">
                  Estado
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
                  Año de aprobación (opcional)
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

            {/* Teléfono, Email */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="telefono" className="font-medium text-slate-700 text-sm">
                  Teléfono (opcional)
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
                  Email (opcional)
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

            {/* Cargos */}
            <div>
              <label className="block font-semibold mb-2 text-slate-700 text-sm">
                Cargos
              </label>
              <div className="flex flex-wrap gap-2">
                {cargos.map((cargo) => (
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

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-600/25 hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear ministerio"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
