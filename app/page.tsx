"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

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
    <main
      className="min-h-screen grid place-items-center bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Bienvenido a GMIEF
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="usuario"
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              placeholder="Usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <input
              id="contrasena"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              placeholder="Contraseña"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-gray-900 px-4 py-2 text-white font-medium hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition"
          >
            Entrar
          </button>
        </form>
      </div>
      {/* Firma elegante abajo a la derecha */}
      <span className="signature absolute right-6 bottom-4 z-50 select-none pointer-events-none flex items-end gap-2">
        <span>Hecho por Kale Dor Kayiko</span>
        <a
          href="https://www.kaledorkayiko.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="flag-link inline-block align-bottom"
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
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(0 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(22.5 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(45 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(67.5 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(90 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(112.5 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(135 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(157.5 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(180 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(202.5 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(225 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(247.5 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(270 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(292.5 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(315 450 300)"
                />
                <line
                  x1="450"
                  y1="300"
                  x2="450"
                  y2="120"
                  transform="rotate(337.5 450 300)"
                />
              </g>
              <circle
                cx="450"
                cy="300"
                r="42"
                fill="#D40000"
                stroke="#D40000"
              />
            </g>
          </svg>
        </a>
      </span>
      <style jsx global>{`
        .signature {
          font-size: 12px;
          color: #fff;
          letter-spacing: 1px;
          opacity: 0.92;
          user-select: none;
        }
        .flag-link {
          pointer-events: auto;
          cursor: pointer;
          transition: transform 0.13s;
        }
        .flag-link:hover {
          transform: scale(1.13) rotate(-2deg);
        }
      `}</style>
    </main>
  );
}
