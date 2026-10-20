"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import LoaderPersonalizado from "@/app/components/LoaderPersonalizado";
import Toast, { useToast } from "@/app/components/Toast";
type Permiso = { id: number; clave: string; nombre: string; descripcion: string | null; es_sistema: boolean; orden: number };
export default function PermisosAdmin() {
  const router = useRouter();
  const { user, restoreSession } = useAuthStore();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newPerm, setNewPerm] = useState({ clave: "", nombre: "", descripcion: "" });
  const [creating, setCreating] = useState(false);
  useEffect(() => { restoreSession(); }, [restoreSession]);
  useEffect(() => { if (user && !user.isSuperAdmin) router.replace("/dashboard"); }, [user, router]);
  const fetchPermisos = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/permisos");
      const d: { ok: boolean; data?: Permiso[]; error?: string } = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || `Error al cargar permisos (${r.status})`);
      if (!Array.isArray(d.data)) throw new Error("La respuesta de permisos no es válida");
      setPermisos(d.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar permisos";
      setLoadError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [showError]);
  useEffect(() => { fetchPermisos(); }, [fetchPermisos]);
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerm.clave.trim() || !newPerm.nombre.trim()) return;
    setCreating(true);
    try {
      const r = await fetch("/api/permisos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPerm) });
      const d = await r.json();
      if (d.ok) { showSuccess("Permiso creado"); setNewPerm({ clave: "", nombre: "", descripcion: "" }); fetchPermisos(); }
      else showError(d.error || "Error");
    } catch { showError("Error"); } finally { setCreating(false); }
  };
  const handleDelete = async (id: number) => {
    try { const r = await fetch(`/api/permisos/${id}`, { method: "DELETE" }); const d = await r.json(); if (d.ok) { showSuccess("Eliminado"); fetchPermisos(); } else showError(d.error || "Error"); }
    catch { showError("Error"); }
  };
  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={hideToast} />
      <div className="w-full flex justify-center px-3 pt-4 sm:pt-6 pb-2"><div className="w-full max-w-4xl"><div className="glass-card-solid px-5 sm:px-8 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
          <div><h1 className="text-2xl font-bold text-slate-800">Permisos</h1><p className="text-sm text-slate-500 mt-1">Tipos de permisos disponibles</p></div>
          <button type="button" className="btn-primary bg-slate-800 text-white hover:bg-slate-900 text-sm" onClick={() => router.push("/modulos/administracion")}>Volver</button>
        </div>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
          <input type="text" value={newPerm.clave} onChange={e => setNewPerm(p => ({...p, clave: e.target.value}))} placeholder="Clave (ej: exportar)" className="input-glass flex-1" disabled={creating} />
          <input type="text" value={newPerm.nombre} onChange={e => setNewPerm(p => ({...p, nombre: e.target.value}))} placeholder="Nombre (ej: Exportar)" className="input-glass flex-1" disabled={creating} />
          <button type="submit" disabled={creating || !newPerm.clave.trim() || !newPerm.nombre.trim()} className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 text-sm disabled:opacity-40">Crear</button>
        </form>
      </div></div></div>
      <div className="w-full flex justify-center px-3 pb-6"><div className="w-full max-w-4xl">
        {loading ? <LoaderPersonalizado>Cargando...</LoaderPersonalizado> : loadError ? (
          <div className="glass-card-solid p-5 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button type="button" onClick={fetchPermisos} className="mt-3 text-sm font-medium text-blue-700 hover:text-blue-800">Reintentar</button>
          </div>
        ) : permisos.length === 0 ? (
          <div className="glass-card-solid p-5 text-center text-sm text-slate-500">No hay permisos registrados.</div>
        ) : (
          <div className="space-y-2">{permisos.map(p => (
            <div key={p.id} className="glass-card-solid p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2"><code className="text-sm text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded">{p.clave}</code><span className="font-semibold text-slate-800">{p.nombre}</span>{p.es_sistema && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Sistema</span>}</div>
                {p.descripcion && <p className="text-xs text-slate-500 mt-1">{p.descripcion}</p>}
              </div>
              {!p.es_sistema && <button type="button" onClick={() => handleDelete(p.id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">Eliminar</button>}
            </div>
          ))}</div>
        )}
      </div></div>
    </main>
  );
}