"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ModulosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="glass-card-solid max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          Error en el módulo
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {error.message || "Se ha producido un error. Puedes reintentar o volver al dashboard."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            className="btn-primary bg-slate-800 text-white hover:bg-slate-900"
            onClick={() => router.push("/dashboard")}
          >
            Ir al dashboard
          </button>
          <button
            type="button"
            className="btn-primary bg-blue-600 text-white hover:bg-blue-700"
            onClick={reset}
          >
            Reintentar
          </button>
        </div>
      </div>
    </main>
  );
}
