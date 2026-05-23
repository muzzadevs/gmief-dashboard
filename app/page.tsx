"use client";

import { useState, useEffect, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Floating photo component
function FloatingPhoto({
  src,
  index,
  total,
}: {
  src: string;
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Generate deterministic but varied positions/animations per photo
  const size = 180 + (index * 37) % 120; // 180-300px
  const startX = ((index * 31 + 17) % 90) + 5; // 5-95%
  const startY = ((index * 47 + 23) % 80) + 10; // 10-90%
  const duration = 25 + (index * 13) % 20; // 25-45s
  const delay = (index * 3) % 10; // 0-10s
  const rotation = ((index * 19) % 30) - 15; // -15 to 15 deg

  return (
    <div
      ref={ref}
      className="absolute pointer-events-none select-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${startX}%`,
        top: `${startY}%`,
        opacity: 0,
        transform: `rotate(${rotation}deg) scale(0.9)`,
        animation: `floatPhoto ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20 rotate-3">
        <Image
          src={src}
          alt=""
          fill
          className="object-cover grayscale"
          sizes={`${size}px`}
          unoptimized
        />
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFotos = async () => {
      try {
        const res = await fetch("/api/login-fotos");
        const json = await res.json();
        if (json.ok && json.data) {
          setFotos(json.data);
        }
      } catch (err) {
        console.error("Error fetching login fotos:", err);
      }
    };
    fetchFotos();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validación temporal en memoria
    setTimeout(() => {
      if (user === "admin" && pass === "1234") {
        router.push("/dashboard");
      } else {
        setError("Credenciales incorrectas. Inténtalo de nuevo.");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <main className="min-h-screen min-h-dvh relative overflow-hidden">
      {/* Floating photos background */}
      {fotos.length > 0 && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {fotos.map((foto, i) => (
            <FloatingPhoto
              key={foto}
              src={foto}
              index={i}
              total={fotos.length}
            />
          ))}
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-blue-900/60 via-blue-800/40 to-indigo-900/60 backdrop-blur-[2px]" />

      {/* Login form */}
      <div className="relative z-10 min-h-screen min-h-dvh grid place-items-center px-4">
        <div className="w-full max-w-sm">
          {/* Glass card */}
          <div className="glass-card-solid p-8 animate-fadein shadow-2xl">
            {/* Logo / Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6M3.75 9v.75A2.25 2.25 0 006 12h12a2.25 2.25 0 002.25-2.25V9" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                filadelfiaConecta
              </h1>
              <p className="text-sm text-slate-500 mt-1">Panel de administración</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="usuario" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Usuario
                </label>
                <input
                  id="usuario"
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="input-glass w-full"
                  placeholder="Introduce tu usuario"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="contrasena" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div className="relative w-full">
                  <input
                    id="contrasena"
                    type={showPass ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="input-glass w-full pr-12"
                    placeholder="Introduce tu contraseña"
                    autoComplete="current-password"
                    disabled={isLoading}
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
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 animate-fadein flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Entrar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
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

      {/* CSS animations for floating photos */}
      <style jsx>{`
        @keyframes floatPhoto {
          0% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) scale(0.8) translateY(20px);
          }
          5% {
            opacity: 0.35;
          }
          25% {
            opacity: 0.45;
            transform: rotate(calc(var(--rotation, 0deg) + 3deg)) scale(1) translateY(-15px) translateX(10px);
          }
          50% {
            opacity: 1;
            transform: rotate(calc(var(--rotation, 0deg) - 2deg)) scale(0.95) translateY(10px) translateX(-8px);
          }
          75% {
            opacity: 0.45;
            transform: rotate(calc(var(--rotation, 0deg) + 1deg)) scale(1.02) translateY(-20px) translateX(5px);
          }
          95% {
            opacity: 0.35;
          }
          100% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) scale(0.8) translateY(20px);
          }
        }
      `}</style>
    </main>
  );
}
