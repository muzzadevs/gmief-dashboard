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
    <main className="min-h-screen grid place-items-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Bienvenido a GMIEF</h1>
        

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
    </main> 
  );
}
