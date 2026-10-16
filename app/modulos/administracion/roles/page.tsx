"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import LoaderPersonalizado from "@/app/components/LoaderPersonalizado";
import Toast, { useToast } from "@/app/components/Toast";
type Rol = { id: number; nombre: string; descripcion: string | null; es_sistema: boolean; cargos: { cargo: { id: number; cargo: string } }[]; _count: { permisos: number } };
export default function RolesAdmin() {
  const router = useRouter();
  const { user, restoreSession } = useAuthStore();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRol, setNewRol] = useState({ nombre: "", descripcion: "" });
  const [creating, setCreating] = useState(false);
  useEffect(() => { restoreSession(); }, [restoreSession]);
  useEffect(() => { if (user && !user.isSuperAdmin) router.replace("/dashboard"); }, [user, router]);
  const fetchRoles = useCallback(async () => {
    try { setLoading(true); const r = await fetch("/api/roles"); const d = await r.json(); if (d.ok) setRoles(d.data); }
    catch { showError("Error al cargar roles"); } finally { setLoading(false); }
  }, [showError]);
  useEffect(() => { fetchRoles(); }, [fetchRoles]);
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRol.nombre.trim()) return;
    setCreating(true);
    try {
      const r = await fetch("/api/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newRol) });
      const d = await r.json();
      if (d.ok) { showSuccess("Rol creado"); setNewRol({ nombre: "", descripcion: "" }); fetchRoles(); }
      else showError(d.error || "Error");
    } catch { showError("Error de conexión"); } finally { setCreating(false); }
  };
  const handleDelete = async (id: number) => {
    try {
      const r = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      const d = await r.json();
      if (d.ok) { showSuccess("Rol eliminado"); fetchRoles(); } else showError(d.error || "Error");
    } catch { showError("Error de conexión"); }
  };
  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={hideToast} />
      <div className="w-full flex justify-center px-3 pt-4 sm:pt-6 pb-2"><div className="w-full max-w-4xl"><div className="glass-card-solid px-5 sm:px-8 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
          <div><h1 className="text-2xl font-bold text-slate-800">Roles</h1><p className="text-sm text-slate-500 mt-1">Gestión de roles y permisos</p></div>
          <button type="button" className="btn-primary bg-slate-800 text-white hover:bg-slate-900 text-sm" onClick={() => router.push("/modulos/administracion")}>Volver</button>
        </div>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
          <input type="text" value={newRol.nombre} onChange={(e) => setNewRol(p => ({...p, nombre: e.target.value}))} placeholder="Nombre del rol" className="input-glass flex-1" disabled={creating} />
          <input type="text" value={newRol.descripcion} onChange={(e) => setNewRol(p => ({...p, descripcion: e.target.value}))} placeholder="Descripción (opcional)" className="input-glass flex-1" disabled={creating} />
          <button type="submit" disabled={creating || !newRol.nombre.trim()} className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 text-sm disabled:opacity-40">Crear</button>
        </form>
      </div></div></div>
      <div className="w-full flex justify-center px-3 pb-6"><div className="w-full max-w-4xl">
        {loading ? <LoaderPersonalizado>Cargando...</LoaderPersonalizado> : (
          <div className="space-y-3">{roles.map((rol) => (
            <div key={rol.id} className="glass-card-solid p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{rol.nombre}</h3>
                  {rol.es_sistema && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Sistema</span>}
                </div>
                {rol.descripcion && <p className="text-sm text-slate-500 mt-1">{rol.descripcion}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-slate-400">{rol._count.permisos} permisos</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{rol.cargos.length} cargos: {rol.cargos.map(c => c.cargo.cargo).join(", ") || "ninguno"}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => router.push(`/modulos/administracion/roles/${rol.id}`)} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium">Editar</button>
                {!rol.es_sistema && <button type="button" onClick={() => handleDelete(rol.id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">Eliminar</button>}
              </div>
            </div>
          ))}</div>
        )}
      </div></div>
    </main>
  );
}
