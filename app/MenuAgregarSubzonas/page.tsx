"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import LoaderPersonalizado from "../components/LoaderPersonalizado";
import Toast, { useToast } from "../components/Toast";
import { useRouter } from "next/navigation";

type Zona = { id: number; nombre: string };

export default function MenuAgregarSubzonas() {
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
      // Esperar un poco para que se vea el toast antes de navegar
      setTimeout(() => {
        router.push("/MenuZonasSubZonas");
      }, 1500);
    } catch (error) {
      console.error("Error creating subzona:", error);
      showError("No se pudo crear la subzona");
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
              Agregar Subzona
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
                  Nombre de la Subzona
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                  placeholder="Nombre de la subzona"
                />
              </div>
            </div>

            {/* Segunda fila: Zona */}
            <div className="grid grid-cols-1 gap-4">
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
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-base shadow-lg hover:from-green-700 hover:to-green-600 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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
