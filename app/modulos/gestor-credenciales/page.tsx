"use client";

import { useRouter } from "next/navigation";

export default function GestorCredenciales() {
  const router = useRouter();

  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      {/* Header */}
      <div className="w-full flex justify-center z-[1000] px-2 sm:px-0">
        <div className="mt-3 sm:mt-4 w-full sm:w-[95%] max-w-4xl glass-card-solid px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20 sm:w-auto"
              onClick={() => router.push("/dashboard")}
              aria-label="Volver al menú principal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Menú principal
            </button>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Gestor de Credenciales
            </h2>
          </div>
        </div>
      </div>

      {/* Sub-menu cards */}
      <div className="flex-1 w-full flex justify-center px-3 py-8">
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Solicitar */}
          <button
            type="button"
            onClick={() => router.push("/modulos/gestor-credenciales/solicitar")}
            className="glass-card-solid p-0 overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] cursor-pointer animate-fadein group"
          >
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
              <div className="bg-blue-100 rounded-2xl p-4 transition-transform group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-800 group-hover:text-slate-900 transition-colors">
                  Solicitar
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  Crear una nueva solicitud de credenciales seleccionando ministerios
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </button>

          {/* Generar */}
          <button
            type="button"
            onClick={() => router.push("/modulos/gestor-credenciales/generar")}
            className="glass-card-solid p-0 overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] cursor-pointer animate-fadein group"
            style={{ animationDelay: "80ms" }}
          >
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-600" />
            <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
              <div className="bg-amber-100 rounded-2xl p-4 transition-transform group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-amber-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-800 group-hover:text-slate-900 transition-colors">
                  Generar
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  Ver solicitudes pendientes y expedir las credenciales
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
