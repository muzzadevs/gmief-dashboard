"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent, use } from "react";
import LoaderPersonalizado from "../../components/LoaderPersonalizado";
import Toast, { useToast } from "../../components/Toast";
import { useRouter } from "next/navigation";

type Zona = { id: number; nombre: string };
type Subzona = { id: number; nombre: string; zona_id: number };
type Iglesia = {
  id: number;
  nombre: string;
  direccion: string;
  municipio: string;
  provincia: string;
  cp: string;
  subzona_id: number;
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function MenuEditarIglesia({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [subzonas, setSubzonas] = useState<Subzona[]>([]);
  const [iglesia, setIglesia] = useState<Iglesia | null>(null);
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
  const [loadingData, setLoadingData] = useState(true);

  // Función helper para limpiar valores null/undefined
  const cleanValue = (value: any): string => {
    if (value === null || value === undefined || value === "null") {
      return "";
    }
    return String(value);
  };

  // Cargar datos de la iglesia y zonas
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [iglesiasRes, zonasRes] = await Promise.all([
          fetch(`/api/iglesias/${resolvedParams.id}`),
          fetch(`/api/zonas`),
        ]);

        if (!iglesiasRes.ok) {
          throw new Error("Iglesia no encontrada");
        }

        const iglesiadata = await iglesiasRes.json();
        setIglesia(iglesiadata);

        if (zonasRes.ok) {
          const zonasResponse = await zonasRes.json();
          if (zonasResponse.ok && zonasResponse.data) {
            setZonas(zonasResponse.data);

            // Buscar la zona de la subzona actual
            const subzonasRes = await fetch(`/api/subzonas?zonaId=ALL`);
            if (subzonasRes.ok) {
              const allSubzonas = await subzonasRes.json();
              const currentSubzona = allSubzonas.find(
                (s: Subzona) => s.id === iglesiadata.subzona_id
              );

              if (currentSubzona) {
                // Cargar subzonas de la zona actual
                const zonaSubzonasRes = await fetch(
                  `/api/subzonas?zonaId=${currentSubzona.zona_id}`
                );
                if (zonaSubzonasRes.ok) {
                  const zonaSubzonas = await zonaSubzonasRes.json();
                  setSubzonas(zonaSubzonas);
                }

                // Configurar form con datos de la iglesia
                console.log("Setting form with iglesia data:", iglesiadata); // Debug log
                console.log("Current subzona:", currentSubzona); // Debug log

                setForm((prevForm) => {
                  const newForm = {
                    ...prevForm,
                    nombre: cleanValue(iglesiadata.nombre),
                    direccion: cleanValue(iglesiadata.direccion),
                    municipio: cleanValue(iglesiadata.municipio),
                    provincia: cleanValue(iglesiadata.provincia),
                    cp: cleanValue(iglesiadata.cp),
                    zona_id: currentSubzona.zona_id.toString(),
                    subzona_id: iglesiadata.subzona_id.toString(),
                  };

                  console.log("New form state:", newForm); // Debug log
                  return newForm;
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        showError("Error al cargar los datos de la iglesia");
        setTimeout(() => {
          router.push("/MenuZonasSubZonas");
        }, 2000);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [resolvedParams.id, router]); // Removido showError de las dependencias

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

    console.log("handleChange called:", name, "=", value); // Debug log

    if (name === "zona_id") {
      handleZonaChange(value);
    } else if (name === "cp") {
      // Only allow numbers for postal code
      const numeric = value.replace(/[^0-9]/g, "");
      console.log("Setting CP to:", numeric); // Debug log
      setForm((f) => {
        const newForm = { ...f, cp: numeric };
        console.log("New form state after CP change:", newForm);
        return newForm;
      });
    } else {
      console.log(`Setting ${name} to:`, value); // Debug log
      setForm((f) => {
        const newForm = { ...f, [name]: value };
        console.log("New form state after change:", newForm);
        return newForm;
      });
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
      const res = await fetch(`/api/iglesias/${resolvedParams.id}`, {
        method: "PUT",
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
        throw new Error("No se pudo actualizar la iglesia");
      }

      showSuccess("Iglesia actualizada exitosamente");
      // Esperar un poco para que se vea el toast antes de navegar
      setTimeout(() => {
        router.push("/MenuZonasSubZonas");
      }, 1500);
    } catch (error) {
      console.error("Error updating iglesia:", error);
      showError("No se pudo actualizar la iglesia");
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loader mientras se cargan los datos
  if (loadingData || !iglesia) {
    return (
      <LoaderPersonalizado>Cargando datos de la iglesia...</LoaderPersonalizado>
    );
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
              Editar Iglesia: {iglesia.nombre}
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
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                  placeholder="Nombre de la iglesia"
                />
              </div>
            </div>

            {/* Segunda fila: Dirección */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="direccion" className="font-medium text-black">
                  Dirección (opcional)
                </label>
                <input
                  id="direccion"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                  placeholder="Dirección completa"
                />
              </div>
            </div>

            {/* Tercera fila: Municipio, Provincia, CP */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="municipio" className="font-medium text-black">
                  Municipio (opcional)
                </label>
                <input
                  id="municipio"
                  name="municipio"
                  value={form.municipio}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                  placeholder="Municipio"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="provincia" className="font-medium text-black">
                  Provincia (opcional)
                </label>
                <input
                  id="provincia"
                  name="provincia"
                  value={form.provincia}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                  placeholder="Provincia"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="cp" className="font-medium text-black">
                  Código Postal (opcional)
                </label>
                <input
                  id="cp"
                  name="cp"
                  value={form.cp}
                  onChange={handleChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
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
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm text-base"
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
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none shadow-sm text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base shadow-lg hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              disabled={loading || loadingSubzonas}
            >
              {loading ? "Actualizando..." : "Actualizar Iglesia"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
