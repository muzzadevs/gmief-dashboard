"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import LoaderPersonalizado from "../../../components/LoaderPersonalizado";
import Toast, { useToast } from "../../../components/Toast";
import Combobox from "../../../components/ui/Combobox";
import { useRouter } from "next/navigation";

type Zona = { id: number; nombre: string };

export default function AgregarSubzonas() {
  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    zona_id: "",
  });
  const [loading, setLoading] = useState(false);

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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
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
      const res = await fetch("/api/subzonas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          zona_id: parseInt(form.zona_id),
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo crear la subzona");
      }

      showSuccess("Subzona creada exitosamente");
      setTimeout(() => {
        router.push("/modulos/gestion-ministerios/zonas-subzonas");
      }, 1500);
    } catch (error) {
      console.error("Error creating subzona:", error);
      showError("No se pudo crear la subzona");
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
              Agregar Subzona
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
                Nombre de la Subzona
              </label>
              <input
                id="nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                className="input-glass w-full"
                autoComplete="off"
                placeholder="Nombre de la subzona"
              />
            </div>

            {/* Zona */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="zona_id" className="font-medium text-slate-700 text-sm">
                Zona
              </label>
              <Combobox
                id="zona_id"
                name="zona_id"
                options={zonaOptions}
                value={form.zona_id}
                onChange={(val) => setForm((f) => ({ ...f, zona_id: val }))}
                placeholder="Selecciona una zona"
                searchPlaceholder="Buscar zona..."
                emptyMessage="No se encontraron zonas."
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-600/25 hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear Subzona"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
