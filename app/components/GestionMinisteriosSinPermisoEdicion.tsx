"use client";

import { useRouter } from "next/navigation";

export default function GestionMinisteriosSinPermisoEdicion() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card-solid max-w-lg p-8 text-center">
        <h1 className="text-xl font-bold text-slate-800">Acceso de solo lectura</h1>
        <p className="mt-3 text-slate-600">
          Tu rol puede consultar la Gestión de Ministerios, pero no crear, editar ni eliminar información.
        </p>
        <button
          type="button"
          className="btn-primary mt-6 bg-slate-800 text-white hover:bg-slate-900"
          onClick={() => router.back()}
        >
          Volver
        </button>
      </div>
    </main>
  );
}
