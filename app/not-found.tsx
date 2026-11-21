import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="glass-card-solid max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <FileQuestion className="w-8 h-8 text-slate-500" />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
        <p className="text-sm text-slate-500 mb-6">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary bg-blue-600 text-white hover:bg-blue-700 inline-flex"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
