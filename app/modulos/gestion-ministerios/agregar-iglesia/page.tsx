"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import LoaderPersonalizado from "../../../components/LoaderPersonalizado";
import Toast, { useToast } from "../../../components/Toast";
import Combobox from "../../../components/ui/Combobox";
import { useRouter } from "next/navigation";

type Zona = { id: number; nombre: string };
type Subzona = { id: number; nombre: string; zona_id: number };

export default function AgregarIglesia() {
  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [subzonas, setSubzonas] = useState<Subzona[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    municipio: "",
    provincia: "",
    cp: "",
    zona_id: "",
    subzona_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingSubzonas, setLoadingSubzonas] = useState(false);

  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const res = await fetch(`/api/zonas`);
        if (res.ok) {
          const response = await res.json();
          if (response.ok && response.data) {
            setZonas(response.data);
          } else {
            console.error("Error in zonas response:", response);
          }
        }
      } catch (error) {
        console.error("Error fetching zonas:", error);
      }
    };
    fetchZonas();
  }, []);

  const handleZonaChange = async (zonaId: string) => {
    setForm((f) => ({ ...f, zona_id: zonaId, subzona_id: "" }));
    setSubzonas([]);

    if (!zonaId) return;

    setLoadingSubzonas(true);
    try {
      const res = await fetch(`/api/subzonas?zonaId=${zonaId}`);
      if (res.ok) {
        const subzonasData = await res.json();
        setSubzonas(subzonasData);
      }
    } catch (error) {
      console.error("Error fetching subzonas:", error);
    } finally {
      setLoadingSubzonas(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "zona_id") {
      handleZonaChange(value);
    } else if (name === "cp") {
      const numeric = value.replace(/[^0-9]/g, "");
      setForm((f) => ({ ...f, cp: numeric }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      showError("El nombre es requerido");
      return;
    }

    if (!form.zona_id) {
      showError("Debe seleccionar una zona");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/iglesias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim() || null,
          municipio: form.municipio.trim() || null,
          provincia: form.provincia.trim() || null,
          cp: form.cp ? parseInt(form.cp, 10) : null,
          zona_id: parseInt(form.zona_id),
          subzona_id: form.subzona_id ? parseInt(form.subzona_id) : null,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo crear la iglesia");
      }

      showSuccess("Iglesia creada exitosamente");
      setTimeout(() => {
        router.push("/modulos/gestion-ministerios/zonas-subzonas");
      }, 1500);
    } catch (error) {
      console.error("Error creating iglesia:", error);
      showError("No se pudo crear la iglesia");
    } finally {
      setLoading(false);
    }
  };

  if (zonas.length === 0) {
    return <LoaderPersonalizado>Cargando...</LoaderPersonalizado>;
  }

  const zonaOptions = zonas.map((zona) => ({
    value: String(zona.id),
    label: zona.nombre,
  }));

  const subzonaOptions = subzonas.map((subzona) => ({
    value: String(subzona.id),
    label: subzona.nombre,
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
              Agregar Iglesia
            </h2>
            <button
              type="button"
              className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20"
              onClick={() => router.push("/modulos/gestion-ministerios/zonas-subzonas")}
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
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nombre" className="font-medium text-slate-700 text-sm">
                Nombre de la Iglesia
              </label>
              <input
                id="nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                className="input-glass w-full"
                autoComplete="off"
                placeholder="Nombre de la iglesia"
              />
            </div>

            {/* Dirección */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="direccion" className="font-medium text-slate-700 text-sm">
                Dirección
              </label>
              <input
                id="direccion"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                className="input-glass w-full"
                autoComplete="off"
                placeholder="Dirección completa"
              />
            </div>

            {/* Municipio, Provincia, CP */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="municipio" className="font-medium text-slate-700 text-sm">
                  Municipio
                </label>
                <input
                  id="municipio"
                  name="municipio"
                  value={form.municipio}
                  onChange={handleChange}
                  className="input-glass w-full"
                  autoComplete="off"
                  placeholder="Municipio"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="provincia" className="font-medium text-slate-700 text-sm">
                  Provincia
                </label>
                <input
                  id="provincia"
                  name="provincia"
                  value={form.provincia}
                  onChange={handleChange}
                  className="input-glass w-full"
                  autoComplete="off"
                  placeholder="Provincia"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cp" className="font-medium text-slate-700 text-sm">
                  Código Postal
                </label>
                <input
                  id="cp"
                  name="cp"
                  value={form.cp}
                  onChange={handleChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input-glass w-full"
                  autoComplete="off"
                  placeholder="Código postal"
                />
              </div>
            </div>

            {/* Zona y Subzona */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="zona_id" className="font-medium text-slate-700 text-sm">
                  Zona <span className="text-red-500">*</span>
                </label>
                <Combobox
                  id="zona_id"
                  name="zona_id"
                  options={zonaOptions}
                  value={form.zona_id}
                  onChange={(val) => handleZonaChange(val)}
                  placeholder="Selecciona una zona"
                  searchPlaceholder="Buscar zona..."
                  emptyMessage="No se encontraron zonas."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="subzona_id" className="font-medium text-slate-700 text-sm">
                  Subzona <span className="text-slate-400 text-xs font-normal">(opcional)</span>
                </label>
                <Combobox
                  id="subzona_id"
                  name="subzona_id"
                  options={subzonaOptions}
                  value={form.subzona_id}
                  onChange={(val) => setForm((f) => ({ ...f, subzona_id: val }))}
                  placeholder={
                    loadingSubzonas
                      ? "Cargando subzonas..."
                      : !form.zona_id
                      ? "Selecciona primero una zona"
                      : subzonas.length === 0
                      ? "No hay subzonas en esta zona"
                      : "Selecciona una subzona (opcional)"
                  }
                  searchPlaceholder="Buscar subzona..."
                  emptyMessage="No se encontraron subzonas."
                  disabled={!form.zona_id || loadingSubzonas}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-600/25 hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              disabled={loading || loadingSubzonas}
            >
              {loading ? "Creando..." : "Crear Iglesia"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
