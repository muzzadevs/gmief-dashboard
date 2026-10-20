"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import LoaderPersonalizado from "@/app/components/LoaderPersonalizado";
import Toast, { useToast } from "@/app/components/Toast";
import { searchIncludes } from "@/lib/search";
import ModalConfirmarEliminar from "@/app/components/ModalConfirmarEliminar";
type Usuario = { id: number; nombre: string; apellidos: string | null; username: string | null; tipo: string; must_change_password: boolean; tiene_password: boolean; cargos: string[]; roles: string[]; };
export default function UsuariosAdmin() {
  const router = useRouter();
  const { user, restoreSession } = useAuthStore();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [resetModal, setResetModal] = useState<{ open: boolean; u: Usuario | null }>({ open: false, u: null });
  const [resetLoading, setResetLoading] = useState(false);
  useEffect(() => { restoreSession(); }, [restoreSession]);
  useEffect(() => { if (user && !user.isSuperAdmin) router.replace("/dashboard"); }, [user, router]);
  const fetchUsuarios = useCallback(async () => {
    try { setLoading(true); const r = await fetch("/api/auth/usuarios"); const d = await r.json(); if (d.ok) setUsuarios(d.data); }
    catch { showError("Error al cargar usuarios"); } finally { setLoading(false); }
  }, [showError]);
  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);
  const handleReset = async () => {
    if (!resetModal.u) return;
    setResetLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ministerioId: resetModal.u.id }) });
      const d = await r.json();
      if (d.ok) { showSuccess("Contraseña reiniciada"); setResetModal({ open: false, u: null }); fetchUsuarios(); }
      else showError(d.error || "Error");
    } catch { showError("Error de conexión"); } finally { setResetLoading(false); }
  };
  const filtered = busqueda.trim() ? usuarios.filter((u) => searchIncludes(u.nombre, busqueda) || (u.apellidos && searchIncludes(u.apellidos, busqueda)) || (u.username && searchIncludes(u.username, busqueda))) : usuarios;
  return (
    <main className="min-h-screen min-h-dvh flex flex-col">
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={hideToast} />
      <div className="w-full flex justify-center px-3 pt-4 sm:pt-6 pb-2"><div className="w-full max-w-5xl"><div className="glass-card-solid px-5 sm:px-8 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
          <div className="text-center sm:text-left"><h1 className="text-2xl font-bold text-slate-800">Usuarios</h1><p className="text-sm text-slate-500 mt-1">{usuarios.length} usuarios</p></div>
          <button type="button" className="btn-primary bg-slate-800 text-white hover:bg-slate-900 text-sm" onClick={() => router.push("/modulos/administracion")}>Volver</button>
        </div>
        <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." className="input-glass w-full" />
      </div></div></div>
      <div className="w-full flex justify-center px-3 pb-6"><div className="w-full max-w-5xl">
        {loading ? <LoaderPersonalizado>Cargando...</LoaderPersonalizado> : (
          <div className="glass-card-solid overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50/50">
              {["Nombre","Username","Tipo","Roles","Estado","Acciones"].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600">{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.nombre}{u.apellidos ? ` ${u.apellidos}` : ""}</td>
                <td className="px-4 py-3"><code className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded font-mono">{u.username||"—"}</code></td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${u.tipo==="MINISTERIO"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`}>{u.tipo==="MINISTERIO"?"Obrero":"Candidato"}</span></td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{u.roles.length>0?u.roles.map((r,i)=><span key={i} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">{r}</span>):<span className="text-xs text-slate-400">Sin rol</span>}</div></td>
                <td className="px-4 py-3">{u.must_change_password?<span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Cambiar pass</span>:u.tiene_password?<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Activo</span>:<span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Sin pass</span>}</td>
                <td className="px-4 py-3 text-center"><button type="button" onClick={()=>setResetModal({open:true,u})} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">Reiniciar pass</button></td>
              </tr>
            ))}</tbody>
          </table>{filtered.length===0&&<div className="text-center py-8 text-slate-400 text-sm">Sin resultados</div>}</div></div>
        )}
      </div></div>
      <ModalConfirmarEliminar isOpen={resetModal.open} titulo={`Reiniciar contraseña de "${resetModal.u?.nombre}"?`} mensaje="Se reiniciará a la predeterminada." loading={resetLoading} onConfirm={handleReset} onCancel={()=>setResetModal({open:false,u:null})} />
    </main>
  );
}
