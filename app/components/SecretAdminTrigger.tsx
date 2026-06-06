"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAdminStore } from "@/store/adminStore";

const SECRET_PASSWORD = "1234";

function isMobileOrTablet(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    "android",
    "webos",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "iemobile",
    "opera mini",
    "mobile",
    "tablet",
  ];
  const isMobileUA = mobileKeywords.some((kw) => ua.includes(kw));
  const isSmallScreen = window.innerWidth < 1024;
  const isTouchOnly =
    "ontouchstart" in window && navigator.maxTouchPoints > 0 && !window.matchMedia("(pointer: fine)").matches;
  return isMobileUA || (isSmallScreen && isTouchOnly);
}

export default function SecretAdminTrigger() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const unlock = useAdminStore((s) => s.unlock);
  const setReturnPath = useAdminStore((s) => s.setReturnPath);

  const [showModal, setShowModal] = useState(false);
  const [showMobileMsg, setShowMobileMsg] = useState(false);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileMsgTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listener for Ctrl+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ".") {
        e.preventDefault();
        e.stopPropagation();

        if (isMobileOrTablet()) {
          setShowMobileMsg(true);
          if (mobileMsgTimeout.current) clearTimeout(mobileMsgTimeout.current);
          mobileMsgTimeout.current = setTimeout(() => setShowMobileMsg(false), 3500);
          return;
        }

        setShowModal(true);
        setPassword("");
        setError("");
        setShake(false);
        setUnlockSuccess(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      if (mobileMsgTimeout.current) clearTimeout(mobileMsgTimeout.current);
    };
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (showModal && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showModal]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (password === SECRET_PASSWORD) {
        setIsLoading(true);
        setUnlockSuccess(true);
        const query = searchParams.toString();
        const currentRoute = `${pathname}${query ? `?${query}` : ""}`;
        setReturnPath(currentRoute);
        unlock();
        setTimeout(() => {
          setShowModal(false);
          setIsLoading(false);
          router.push("/admin");
        }, 800);
      } else {
        setError("Contraseña incorrecta");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPassword("");
      }
    },
    [password, pathname, searchParams, setReturnPath, unlock, router]
  );

  const handleClose = useCallback(() => {
    setShowModal(false);
    setPassword("");
    setError("");
    setShake(false);
    setUnlockSuccess(false);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!showModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showModal, handleClose]);

  return (
    <>
      {/* Mobile/Tablet message */}
      {showMobileMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] animate-fadein">
          <div className="bg-slate-900/95 backdrop-blur-xl text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700/50 flex items-center gap-3 max-w-sm">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 text-amber-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-200">
              Este comando solo está disponible en ordenadores
            </p>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-fadein"
            onClick={handleClose}
          />

          {/* Modal card */}
          <div
            className={`relative w-full max-w-sm mx-4 animate-fadein ${
              shake ? "animate-shake" : ""
            }`}
          >
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Top accent line */}
              <div className="h-1 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700" />

              <div className="p-8">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  aria-label="Cerrar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Vault icon */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-16 h-16 mb-4">
                    {/* Spinning ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-slate-700/40" />
                    <div
                      className={`absolute inset-0 rounded-full border-2 border-transparent border-t-slate-400 ${
                        isLoading ? "animate-spin" : ""
                      }`}
                    />
                    {/* Lock/Shield icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {unlockSuccess ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-7 h-7 text-emerald-400 transition-colors duration-300"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-7 h-7 text-slate-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-slate-200 tracking-tight">
                    Acceso restringido
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Introduce la clave de administrador
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <div className="relative w-full">
                      <input
                        ref={inputRef}
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-3 pr-12 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
                        placeholder="Contraseña"
                        autoComplete="off"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-transparent border-none outline-none cursor-pointer"
                        style={{ lineHeight: 0 }}
                      >
                        {showPass ? (
                          <FaEye className="w-4 h-4 text-slate-500" />
                        ) : (
                          <FaEyeSlash className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2 animate-fadein">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-3.5 h-3.5 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !password}
                    className="w-full rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-3 text-white text-sm font-semibold hover:from-slate-600 hover:to-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all shadow-lg shadow-black/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin w-4 h-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Desbloqueando...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                        Desbloquear
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shake animation CSS */}
      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-4px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(4px);
          }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
}
