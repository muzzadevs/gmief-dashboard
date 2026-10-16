"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import LoaderPersonalizado from "@/app/components/LoaderPersonalizado";
import Toast, { useToast } from "@/app/components/Toast";
type PermisoCol = { permiso_id: number; permiso_clave: string; permiso_nombre: string; activo: boolean };
type ModuloRow = { modulo_id: number; modulo_nombre: string; permisos: PermisoCol[] };
type CargoItem = { id: number; cargo: string; asignado: boolean };
export default function EditarRol() {
  const router = useRouter();
  const params = useParams();
  const rolId = Number(params.id);
  const { user, restoreSession } = useAuthStore();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rolNombre, setRolNombre] = useState("");
  const [rolDesc, setRolDesc] = useState("");
  const [matriz, setMatriz] = useState<ModuloRow[]>([]);
  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { restoreSession(); }, [restoreSession]);
  useEffect(() => { if (user && !user.isSuperAdmin) router.replace("/dashboard"); }, [user, router]);
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolRes, permRes, cargosRes] = await Promise.all([
        fetch(`/api/roles/${rolId}`),
        fetch(`/api/roles/${rolId}/permisos`),
        fetch(`/api/roles/${rolId}/cargos`),
      ]);
      const rolData = await rolRes.json();
      const permData = await permRes.json();
      const cargosData = await cargosRes.json();
      if (rolData.ok) { setRolNombre(rolData.data.nombre); setRolDesc(rolData.data.descripcion || ""); }
      if (permData.ok) setMatriz(permData.data.matriz);
      if (cargosData.ok) setCargos(cargosData.data.cargos);
    } catch { showError("Error al cargar datos"); } finally { setLoading(false); }
  }, [rolId, showError]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const togglePermiso = (moduloIdx: number, permisoIdx: number) => {
    setMatriz(prev => prev.map((m, mi) => mi !== moduloIdx ? m : { ...m, permisos: m.permisos.map((p, pi) => pi !== permisoIdx ? p : { ...p, activo: !p.activo }) }));
  };
  const toggleCargo = (idx: number) => {
    setCargos(prev => prev.map((c, i) => i !== idx ? c : { ...c, asignado: !c.asignado }));
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const permisos: { modulo_id: number; permiso_id: number }[] = [];
      for (const m of matriz) { for (const p of m.permisos) { if (p.activo) permisos.push({ modulo_id: m.modulo_id, permiso_id: p.permiso_id }); } }
      const cargoIds = cargos.filter(c => c.asignado).map(c => c.id);
      await Promise.all([
        fetch(`/api/roles/${rolId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: rolNombre, descripcion: rolDesc }) }),
        fetch(`/api/roles/${rolId}/permisos`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permisos }) }),
        fetch(`/api/roles/${rolId}/cargos`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cargoIds }) }),
      ]);
      showSuccess("Rol actualizado");
    } catch { showError("Error al guardar"); } finally { setSaving(false); }
  };
  if (loading) return <main className="min-h-dvh flex items-center justify-center"><LoaderPersonalizado>Cargando...</LoaderPersonalizado></main>;
  const permHeaders = matriz[0]?.permisos || [];
  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={hideToast} />
      <div className="w-full flex justify-center px-3 pt-4 sm:pt-6 pb-2"><div className="w-full max-w-5xl"><div className="glass-card-solid px-5 sm:px-8 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
          <div><h1 className="text-2xl font-bold text-slate-800">Editar Rol</h1></div>
          <div className="flex gap-2">
            <button type="button" className="btn-primary bg-slate-800 text-white hover:bg-slate-900 text-sm" onClick={() => router.push("/modulos/administracion/roles")}>Volver</button>
            <button type="button" disabled={saving} onClick={handleSave} className="btn-primary bg-emerald-600 text-white hover:bg-emerald-700 text-sm disabled:opacity-40">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre</label><input type="text" value={rolNombre} onChange={e => setRolNombre(e.target.value)} className="input-glass w-full" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción</label><input type="text" value={rolDesc} onChange={e => setRolDesc(e.target.value)} className="input-glass w-full" /></div>
        </div>
      </div></div></div>
      {/* Cargos */}
      <div className="w-full flex justify-center px-3 pb-2"><div className="w-full max-w-5xl"><div className="glass-card-solid px-5 sm:px-8 py-5">
        <h2 className="text-lg font-bold text-slate-800 mb-3">Cargos asignados</h2>
        <p className="text-xs text-slate-500 mb-3">Los ministerios con estos cargos heredarán este rol.</p>
        <div className="flex flex-wrap gap-2">{cargos.map((c, i) => (
          <label key={c.id} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border cursor-pointer select-none transition-all ${c.asignado ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            <input type="checkbox" checked={c.asignado} onChange={() => toggleCargo(i)} className="accent-emerald-600 w-4 h-4" />{c.cargo}
          </label>
        ))}</div>
      </div></div></div>
      {/* Matriz permisos */}
      <div className="w-full flex justify-center px-3 pb-6"><div className="w-full max-w-5xl"><div className="glass-card-solid overflow-hidden">
        <div className="px-5 sm:px-8 py-4"><h2 className="text-lg font-bold text-slate-800">Permisos por módulo</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-slate-200 bg-slate-50/50">
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Módulo</th>
            {permHeaders.map(p => <th key={p.permiso_id} className="text-center px-4 py-3 font-semibold text-slate-600">{p.permiso_nombre}</th>)}
          </tr></thead>
          <tbody>{matriz.map((m, mi) => (
            <tr key={m.modulo_id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="px-4 py-3 font-medium text-slate-800">{m.modulo_nombre}</td>
              {m.permisos.map((p, pi) => (
                <td key={p.permiso_id} className="px-4 py-3 text-center">
                  <input type="checkbox" checked={p.activo} onChange={() => togglePermiso(mi, pi)} className="accent-blue-600 w-4 h-4 cursor-pointer" />
                </td>
              ))}
            </tr>
          ))}</tbody>
        </table></div>
      </div></div></div>
    </main>
  );
}
