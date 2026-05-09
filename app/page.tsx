"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validación temporal en memoria
    if (user === "admin" && pass === "1234") {
      router.push("/MenuZonas");
    } else {
      setError("Credenciales incorrectas. Inténtalo de nuevo.");
    }
  };

  return (
    <main className="min-h-screen min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-sm glass-card-solid p-8 animate-fadein">
        {/* Logo / Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            GMIEF
          </h1>
          <p className="text-sm text-slate-500 mt-1">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="usuario"
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="input-glass w-full"
              placeholder="Usuario"
              autoComplete="username"
            />
          </div>

          <div className="relative w-full">
            <input
              id="contrasena"
              type={showPass ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="input-glass w-full pr-12"
              placeholder="Contraseña"
              autoComplete="current-password"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={
                showPass ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-transparent border-none outline-none cursor-pointer"
              style={{ lineHeight: 0 }}
            >
              {showPass ? (
                <FaEye className="w-5 h-5 text-slate-500" />
              ) : (
                <FaEyeSlash className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 animate-fadein">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-white font-semibold hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all shadow-lg shadow-blue-500/25"
          >
            Entrar
          </button>
        </form>
      </div>

      {/* Firma elegante */}
      <span className="fixed right-6 bottom-4 z-50 select-none pointer-events-none flex items-end gap-2 text-xs text-white/70 tracking-wide">
        <span>Hecho por Kale Dor Kayiko</span>
        <a
          href="https://www.kaledorkayiko.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto inline-block align-bottom hover:scale-110 transition-transform"
          style={{ width: "23px", height: "16px" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
            <rect width="900" height="300" y="0" fill="#0072CE" />
            <rect width="900" height="300" y="300" fill="#009A00" />
            <g
              fill="none"
              stroke="#D40000"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="450" cy="300" r="180" strokeWidth="30" />
              <g strokeWidth="18">
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(0 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(22.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(45 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(67.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(90 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(112.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(135 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(157.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(180 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(202.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(225 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(247.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(270 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(292.5 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(315 450 300)" />
                <line x1="450" y1="300" x2="450" y2="120" transform="rotate(337.5 450 300)" />
              </g>
              <circle cx="450" cy="300" r="42" fill="#D40000" stroke="#D40000" />
            </g>
          </svg>
        </a>
      </span>
    </main>
  );
}
