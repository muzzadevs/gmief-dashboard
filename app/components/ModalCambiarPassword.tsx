"use client";

import { useState, useRef, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface ModalCambiarPasswordProps {
  open: boolean;
  token: string;
  onSuccess: (token: string, user: unknown) => void;
}

export default function ModalCambiarPassword({ open, token, onSuccess }: ModalCambiarPasswordProps) {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  if (!open) return null;

  const triggerShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPass.length < 6) return triggerShake("La contraseña debe tener al menos 6 caracteres");
    if (newPass !== confirmPass) return triggerShake("Las contraseñas no coinciden");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const message = data.error === "NO_AUTH"
          ? "La sesión no está autenticada. Accede desde https://filadelfiaconecta.com e inicia sesión de nuevo."
          : data.error || "Error al cambiar la contraseña";
        return triggerShake(message);
      }
      onSuccess(data.token, data.user);
    } catch { triggerShake("Error de conexión"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`w-full max-w-md glass-card-solid p-8 shadow-2xl animate-fadein ${shake ? "animate-shake" : ""}`}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-amber-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Cambiar contraseña</h2>
          <p className="text-sm text-slate-500 mt-1">Por seguridad, debes establecer una nueva contraseña para tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nueva contraseña</label>
            <div className="relative">
              <input ref={inputRef} type={showNew ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} className="input-glass w-full pr-12" placeholder="Mínimo 6 caracteres" disabled={loading} autoComplete="new-password" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowNew(!showNew)} tabIndex={-1}>{showNew ? <FaEyeSlash size={16} /> : <FaEye size={16} />}</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Confirmar contraseña</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="input-glass w-full pr-12" placeholder="Repite la contraseña" disabled={loading} autoComplete="new-password" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>{showConfirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}</button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading || !newPass || !confirmPass} className="w-full btn-primary bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (<><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Guardando...</>) : (<><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Establecer contraseña</>)}
          </button>
        </form>
      </div>
    </div>
  );
}
