"use client";

import React, { useEffect, useState } from "react";
import LoaderPersonalizado from "../components/LoaderPersonalizado";
import Combobox from "../components/ui/Combobox";
import Toast, { useToast } from "../components/Toast";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";

type Estado = { id: number; nombre: string };
type Cargo = { id: number; cargo: string };

type Ministerio = {
  id: number;
  nombre: string;
  apellidos: string;
  alias: string;
  codigo: string;
  estado_id: string | number;
  aprob: string;
  telefono: string;
  email: string;
  cargos: number[];
};

export default function MenuEditarMinisterio() {
  const router = useRouter();
  const iglesiaSelected = useZonasStore((s) => s.iglesiaSelected);
  const ministerioEditId = useZonasStore((s) => s.ministerioEditId);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [form, setForm] = useState<Ministerio | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!iglesiaSelected) {
      router.push("/MenuZonasSubZonas");
      return;
    }
    const id = ministerioEditId;
    if (!id) {
      router.push("/MenuMinisterios");
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
      setForm({
        ...minData,
        estado_id: minData.estado_id?.toString() || "",
        cargos: minData.cargos ? minData.cargos.split(",").map(Number) : [4],
      });
    };
    fetchData();
  }, [iglesiaSelected, router, ministerioEditId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!form) return;
    const { name, value } = e.target;
    if (name === "telefono") {
      const numeric = value.replace(/[^0-9]/g, "");
      setForm((f) => f && { ...f, telefono: numeric });
    } else if (name === "email") {
      setForm((f) => f && { ...f, email: value });
    } else {
      setForm((f) => f && { ...f, [name]: value });
    }
  };

  const handleCargoChange = (id: number) => {
    if (!form) return;
    if (id === 4) return;
    setForm((f) => {
      if (!f) return f;
      const cargos = f.cargos.includes(id)
        ? f.cargos.filter((c) => c !== id)
        : [...f.cargos, id];
      return { ...f, cargos };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form || !iglesiaSelected) return;

    // Validación amigable de campos obligatorios
    const errores: string[] = [];
    if (!form.nombre.trim()) errores.push("El campo «Nombre» es obligatorio");
    if (!form.codigo.trim()) errores.push("El «Código» es obligatorio");
    if (!form.estado_id) errores.push("Debe seleccionar un «Estado»");
    if (form.cargos.length === 0) errores.push("Debe seleccionar al menos un «Cargo»");

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
      const res = await fetch(`/api/ministerios/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellidos: form.apellidos || null,
          alias: form.alias || null,
          codigo: form.codigo,
          estado_id: parseInt(String(form.estado_id), 10),
          aprob: form.aprob ? parseInt(String(form.aprob), 10) : null,
          telefono: form.telefono || null,
          email: form.email || null,
          iglesia_id: iglesiaSelected.id,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "No se pudo actualizar el ministerio");
      }
      await fetch(`/api/ministerio_cargo/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cargos: form.cargos }),
      });
      showSuccess("Ministerio actualizado exitosamente");
      setLoading(false);
      setTimeout(() => {
        router.push("/MenuMinisterios");
      }, 1500);
    } catch (err) {
      setLoading(false);
      showError(err instanceof Error ? err.message : "No se pudo actualizar el ministerio");
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1959 },
    (_, i) => currentYear - i
  );

  if (
    !iglesiaSelected ||
    !form ||
    estados.length === 0 ||
    cargos.length === 0
  ) {
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
      <main className="min-h-screen flex flex-col items-center justify-center px-3 py-8">
        <div className="w-full max-w-3xl lg:max-w-5xl glass-card-solid p-5 sm:p-8 animate-fadein">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-center sm:text-left flex-1">
              Editar Ministerio
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
            noValidate
          >
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

            {/* Código (solo lectura), Estado, Año */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="codigo" className="font-medium text-slate-700 text-sm">
                  Código <span className="text-red-500">*</span> <span className="text-xs text-slate-400 font-normal">(no editable)</span>
                </label>
                <div className="input-glass w-full flex items-center bg-slate-50 cursor-not-allowed select-none">
                  <span className="font-mono text-base text-slate-700 font-semibold tracking-wider">
                    {form.codigo}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="estado_id" className="font-medium text-slate-700 text-sm">
                  Estado <span className="text-red-500">*</span>
                </label>
                <Combobox
                  id="estado_id"
                  name="estado_id"
                  options={estadoOptions}
                  value={String(form.estado_id)}
                  onChange={(val) => setForm((f) => f && { ...f, estado_id: val })}
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
                  value={form.aprob ? String(form.aprob) : ""}
                  onChange={(val) => setForm((f) => f && { ...f, aprob: val })}
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

            {/* Cargos */}
            <div>
              <label className="block font-semibold mb-2 text-slate-700 text-sm">
                Cargos <span className="text-red-500">*</span>
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
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
