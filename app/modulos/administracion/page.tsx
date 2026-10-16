"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function Administracion() {
  const router = useRouter();
  const { user, restoreSession } = useAuthStore();

  useEffect(() => { restoreSession(); }, [restoreSession]);

  // Solo superadmin puede acceder
  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const secciones = [
    {
      titulo: "Usuarios",
      descripcion: "Gestión de usuarios, resetear contraseñas",
      href: "/modulos/administracion/usuarios",
      icono: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-100",
      iconText: "text-blue-700",
    },
    {
      titulo: "Roles",
      descripcion: "Crear y editar roles, asignar cargos y permisos",
      href: "/modulos/administracion/roles",
      icono: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      color: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-700",
    },
    {
      titulo: "Permisos",
      descripcion: "Gestionar tipos de permisos disponibles",
      href: "/modulos/administracion/permisos",
      icono: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      ),
      color: "from-purple-500 to-violet-600",
      iconBg: "bg-purple-100",
      iconText: "text-purple-700",
    },
  ];

  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      <div className="w-full flex justify-center px-3 pt-4 sm:pt-6 pb-2">
        <div className="w-full max-w-4xl">
          <div className="glass-card-solid px-5 sm:px-8 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Administración</h1>
                <p className="text-sm text-slate-500 mt-1">Gestión de usuarios, roles y permisos</p>
              </div>
              <button type="button" className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20 text-sm" onClick={() => router.push("/dashboard")}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center px-3 pb-6">
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {secciones.map((sec, i) => (
            <button key={sec.href} type="button" onClick={() => router.push(sec.href)} className="glass-card-solid p-0 overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] cursor-pointer animate-fadein group" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`h-1.5 bg-gradient-to-r ${sec.color}`} />
              <div className="p-5 flex items-start gap-4">
                <div className={`${sec.iconBg} rounded-xl p-3 flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <div className={sec.iconText}>{sec.icono}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-800 truncate">{sec.titulo}</h3>
                  <p className="text-sm text-slate-500 mt-1">{sec.descripcion}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
