"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import LoaderPersonalizado from "../components/LoaderPersonalizado";
import Toast, { useToast } from "../components/Toast";
import { useRouter } from "next/navigation";

type Zona = { id: number; nombre: string };
type Subzona = { id: number; nombre: string; zona_id: number };

export default function MenuAgregarIglesia() {
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
      // Only allow numbers for postal code
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

    if (!form.subzona_id) {
      showError("Debe seleccionar una subzona");
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
          cp: form.cp || null,
          subzona_id: parseInt(form.subzona_id),
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo crear la iglesia");
      }

      showSuccess("Iglesia creada exitosamente");
      // Esperar un poco para que se vea el toast antes de navegar
      setTimeout(() => {
        router.push("/MenuZonasSubZonas");
      }, 1500);
    } catch (error) {
      console.error("Error creating iglesia:", error);
      showError("No se pudo crear la iglesia");
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loader mientras se cargan las zonas
  if (zonas.length === 0) {
    return <LoaderPersonalizado>Cargando...</LoaderPersonalizado>;
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />
      <main className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-blue-900 via-white to-blue-400 items-center justify-center">
        <div className="w-[95vw] max-w-3xl lg:max-w-6xl bg-white/95 rounded-3xl border border-gray-300 shadow-2xl p-4 sm:p-8 mt-8 mb-8 mx-auto animate-fadein">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold text-black tracking-tight font-sans text-center sm:text-left flex-1">
              Agregar Iglesia
            </h2>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white font-semibold text-base shadow hover:bg-gray-900 transition border border-black cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => router.push("/MenuZonasSubZonas")}
              aria-label="Volver"
              disabled={loading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              Volver
            </button>
          </div>
          <form
            className="flex flex-col gap-4 font-sans text-base text-black"
            onSubmit={handleSubmit}
          >
            {/* Primera fila: Nombre */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="nombre" className="font-medium text-black">
                  Nombre de la Iglesia
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                  placeholder="Nombre de la iglesia"
                />
              </div>
            </div>

            {/* Segunda fila: Dirección */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="direccion" className="font-medium text-black">
                  Dirección
                </label>
                <input
                  id="direccion"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                  placeholder="Dirección completa"
                />
              </div>
            </div>

            {/* Tercera fila: Municipio, Provincia, CP */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="municipio" className="font-medium text-black">
                  Municipio
                </label>
                <input
                  id="municipio"
                  name="municipio"
                  value={form.municipio}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                  placeholder="Municipio"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="provincia" className="font-medium text-black">
                  Provincia
                </label>
                <input
                  id="provincia"
                  name="provincia"
                  value={form.provincia}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                  placeholder="Provincia"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="cp" className="font-medium text-black">
                  Código Postal
                </label>
                <input
                  id="cp"
                  name="cp"
                  value={form.cp}
                  onChange={handleChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                  placeholder="Código postal"
                />
              </div>
            </div>

            {/* Cuarta fila: Zona y Subzona */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="zona_id" className="font-medium text-black">
                  Zona
                </label>
                <select
                  id="zona_id"
                  name="zona_id"
                  value={form.zona_id}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm text-base"
                >
                  <option value="">Selecciona una zona</option>
                  {zonas.map((zona) => (
                    <option key={zona.id} value={zona.id}>
                      {zona.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="subzona_id" className="font-medium text-black">
                  Subzona
                </label>
                <select
                  id="subzona_id"
                  name="subzona_id"
                  value={form.subzona_id}
                  onChange={handleChange}
                  required
                  disabled={!form.zona_id || loadingSubzonas}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingSubzonas
                      ? "Cargando subzonas..."
                      : !form.zona_id
                      ? "Selecciona primero una zona"
                      : "Selecciona una subzona"}
                  </option>
                  {subzonas.map((subzona) => (
                    <option key={subzona.id} value={subzona.id}>
                      {subzona.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-base shadow-lg hover:from-green-700 hover:to-green-600 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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
