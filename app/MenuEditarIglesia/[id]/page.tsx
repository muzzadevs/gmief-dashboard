"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
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
  const { id } = React.use(params);

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

  const cleanValue = (value: unknown): string =>
    value === null || value === undefined || value === "null"
      ? ""
      : String(value);

  useEffect(() => {
    if (!id) return;

    let aborted = false;

    const fetchData = async () => {
      try {
        const [iglesiasRes, zonasRes] = await Promise.all([
          fetch(`/api/iglesias/${id}`),
          fetch(`/api/zonas`),
        ]);

        if (!iglesiasRes.ok) throw new Error("Iglesia no encontrada");

        const iglesiadata: Iglesia = await iglesiasRes.json();
        if (aborted) return;
        setIglesia(iglesiadata);

        if (zonasRes.ok) {
          const zonasResponse = await zonasRes.json();
          if (!aborted && zonasResponse?.ok && zonasResponse?.data) {
            setZonas(zonasResponse.data);

            const subzonasRes = await fetch(`/api/subzonas?zonaId=ALL`);
            if (subzonasRes.ok) {
              const allSubzonas: Subzona[] = await subzonasRes.json();
              const currentSubzona = allSubzonas.find(
                (s) => s.id === iglesiadata.subzona_id
              );

              if (currentSubzona) {
                const zonaSubzonasRes = await fetch(
                  `/api/subzonas?zonaId=${currentSubzona.zona_id}`
                );
                if (zonaSubzonasRes.ok) {
                  const zonaSubzonas: Subzona[] = await zonaSubzonasRes.json();
                  if (!aborted) setSubzonas(zonaSubzonas);
                }

                setForm((prev) => ({
                  ...prev,
                  nombre: cleanValue(iglesiadata.nombre),
                  direccion: cleanValue(iglesiadata.direccion),
                  municipio: cleanValue(iglesiadata.municipio),
                  provincia: cleanValue(iglesiadata.provincia),
                  cp: cleanValue(iglesiadata.cp),
                  zona_id: String(currentSubzona.zona_id),
                  subzona_id: String(iglesiadata.subzona_id),
                }));
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        showError("Error al cargar los datos de la iglesia");
        setTimeout(() => router.push("/MenuZonasSubZonas"), 2000);
      } finally {
        if (!aborted) setLoadingData(false);
      }
    };

    fetchData();

    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleZonaChange = async (zonaId: string) => {
    setForm((f) => ({ ...f, zona_id: zonaId, subzona_id: "" }));
    setSubzonas([]);

    if (!zonaId) return;

    setLoadingSubzonas(true);
    try {
      const res = await fetch(`/api/subzonas?zonaId=${zonaId}`);
      if (res.ok) {
        const subzonasData: Subzona[] = await res.json();
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
      return;
    }

    if (name === "cp") {
      const numeric = value.replace(/[^0-9]/g, "");
      setForm((f) => ({ ...f, cp: numeric }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
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
      const res = await fetch(`/api/iglesias/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim() || null,
          municipio: form.municipio.trim() || null,
          provincia: form.provincia.trim() || null,
          cp: form.cp ? parseInt(form.cp, 10) : null,
          subzona_id: parseInt(form.subzona_id, 10),
        }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar la iglesia");

      showSuccess("Iglesia actualizada exitosamente");
      setTimeout(() => router.push("/MenuZonasSubZonas"), 1500);
    } catch (error) {
      console.error("Error updating iglesia:", error);
      showError("No se pudo actualizar la iglesia");
    } finally {
      setLoading(false);
    }
  };

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
      <main className="min-h-screen flex flex-col items-center justify-center px-3 py-8">
        <div className="w-full max-w-3xl lg:max-w-5xl glass-card-solid p-5 sm:p-8 animate-fadein">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-center sm:text-left flex-1">
              Editar Iglesia: {iglesia.nombre}
            </h2>
            <button
              type="button"
              className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20"
              onClick={() => router.push("/MenuZonasSubZonas")}
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
                  Zona
                </label>
                <select
                  id="zona_id"
                  name="zona_id"
                  value={form.zona_id}
                  onChange={handleChange}
                  required
                  className="select-glass w-full"
                >
                  <option value="">Selecciona una zona</option>
                  {zonas.map((zona) => (
                    <option key={zona.id} value={zona.id}>
                      {zona.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="subzona_id" className="font-medium text-slate-700 text-sm">
                  Subzona
                </label>
                <select
                  id="subzona_id"
                  name="subzona_id"
                  value={form.subzona_id}
                  onChange={handleChange}
                  required
                  disabled={!form.zona_id || loadingSubzonas}
                  className="select-glass w-full"
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
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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
