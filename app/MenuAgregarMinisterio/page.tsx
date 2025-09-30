"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import ModalCodigoDuplicado from "../components/ModalCodigoDuplicado";
import LoaderPersonalizado from "../components/LoaderPersonalizado";
import { useRouter } from "next/navigation";
import { useZonasStore } from "@/store/zonasStore";

type Estado = { id: number; nombre: string };
type Cargo = { id: number; cargo: string };

export default function MenuAgregarMinisterio() {
  const router = useRouter();
  const iglesiaSelected = useZonasStore((s) => s.iglesiaSelected);
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
    cargos: [4], // Obrero preseleccionado
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
    const { name, value, type } = e.target;
    if (name === "codigo") {
      setForm((f) => ({ ...f, codigo: value.toUpperCase() }));
    } else if (name === "telefono") {
      // Only allow numbers
      const numeric = value.replace(/[^0-9]/g, "");
      setForm((f) => ({ ...f, telefono: numeric }));
    } else if (name === "email") {
      setForm((f) => ({ ...f, email: value }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleCargoChange = (id: number) => {
    if (id === 4) return; // Obrero siempre seleccionado
    setForm((f) => {
      const cargos = f.cargos.includes(id)
        ? f.cargos.filter((c) => c !== id)
        : [...f.cargos, id];
      return { ...f, cargos };
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Email validation if not empty
    if (form.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        alert("El email no es válido");
        return;
      }
    }
    setLoading(true);
    try {
      if (!iglesiaSelected) throw new Error("No hay iglesia seleccionada");
      // Validar código único
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
      // Crear ministerio
      const res = await fetch("/api/ministerios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          codigo,
          iglesia_id: iglesiaSelected.id,
        }),
      });
      if (!res.ok) throw new Error("No se pudo crear el ministerio");
      const { id: ministerio_id } = await res.json();
      // Insertar cargos
      await fetch("/api/ministerio_cargo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ministerio_id, cargos: form.cargos }),
      });
      setLoading(false); // Habilitar antes de redirigir
      router.push("/MenuMinisterios");
    } catch {
      setLoading(false); // Habilitar antes de redirigir
      alert("No se pudo crear el ministerio");
      router.push("/MenuMinisterios");
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1959 }, (_, i) => 1960 + i);

  // Mostrar loader mientras se cargan estados o cargos
  if (!iglesiaSelected || estados.length === 0 || cargos.length === 0) {
    return <LoaderPersonalizado>Cargando...</LoaderPersonalizado>;
  }

  return (
    <>
      <ModalCodigoDuplicado
        open={modalOpen}
        nombreMinisterio={modalNombre}
        apellidosMinisterio={modalApellidos}
        onClose={() => setModalOpen(false)}
      />
      <main className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-blue-900 via-white to-blue-400 items-center justify-center">
        <div className="w-[95vw] max-w-3xl lg:max-w-6xl bg-white/95 rounded-3xl border border-gray-300 shadow-2xl p-4 sm:p-8 mt-8 mb-8 mx-auto animate-fadein">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold text-black tracking-tight font-sans text-center sm:text-left flex-1">
              Agregar Ministerio
            </h2>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white font-semibold text-base shadow hover:bg-gray-900 transition border border-black cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => router.push("/MenuMinisterios")}
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
            {/* Primera fila: Nombre, Apellidos, Alias */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="nombre" className="font-medium text-black">
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="apellidos" className="font-medium text-black">
                  Apellidos
                </label>
                <input
                  id="apellidos"
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="alias" className="font-medium text-black">
                  Alias
                </label>
                <input
                  id="alias"
                  name="alias"
                  value={form.alias}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                />
              </div>
            </div>
            {/* Segunda fila: Código, Estado, Año de aprobación */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="codigo" className="font-medium text-black">
                  Código
                </label>
                <input
                  id="codigo"
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChange}
                  required
                  placeholder="Ej: ABC123"
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="estado_id" className="font-medium text-black">
                  Estado
                </label>
                <select
                  id="estado_id"
                  name="estado_id"
                  value={form.estado_id}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm text-base"
                >
                  <option value="">Selecciona estado</option>
                  {estados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="aprob" className="font-medium text-black">
                  Año de aprobación (opcional)
                </label>
                <select
                  id="aprob"
                  name="aprob"
                  value={form.aprob}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm text-base"
                >
                  <option value="">Año de aprobación</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Tercera fila: Teléfono, Email */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="telefono" className="font-medium text-black">
                  Teléfono (opcional)
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="font-medium text-black">
                  Email (opcional)
                </label>
                <input
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none shadow-sm placeholder:text-gray-700 text-base"
                  autoComplete="off"
                />
              </div>
            </div>
            {/* Cargos y botón */}
            <div>
              <label className="block font-semibold mb-2 text-black text-base">
                Cargos
              </label>
              <div className="flex flex-wrap gap-2">
                {cargos.map((cargo) => (
                  <label
                    key={cargo.id}
                    className={`flex items-center gap-2 text-base px-3 py-2 rounded-xl border border-gray-200 shadow-sm bg-gradient-to-br ${
                      cargo.id === 4
                        ? "from-green-200 to-green-100 text-green-900 font-bold"
                        : "from-gray-100 to-white text-gray-700"
                    } cursor-pointer select-none`}
                  >
                    <input
                      type="checkbox"
                      checked={form.cargos.includes(cargo.id)}
                      disabled={cargo.id === 4}
                      onChange={() => handleCargoChange(cargo.id)}
                      className="accent-green-600 w-5 h-5"
                    />
                    {cargo.cargo}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-base shadow-lg hover:from-green-700 hover:to-green-600 transition  disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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
