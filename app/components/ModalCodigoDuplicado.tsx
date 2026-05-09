import React from "react";

interface ModalCodigoDuplicadoProps {
  open: boolean;
  nombreMinisterio: string;
  apellidosMinisterio: string;
  onClose: () => void;
}

const ModalCodigoDuplicado: React.FC<ModalCodigoDuplicadoProps> = ({
  open,
  nombreMinisterio,
  apellidosMinisterio,
  onClose,
}) => {
  if (!open) return null;
  const mensaje = `El código introducido ya existe y le pertenece a `;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-card-solid p-8 max-w-md w-full text-center animate-fadein">
        <p className="mb-8 text-lg text-slate-800">
          {mensaje}
          <span className="font-bold">
            {nombreMinisterio} {apellidosMinisterio}
          </span>
          .
        </p>
        <button
          onClick={onClose}
          className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg w-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Volver
        </button>
      </div>
    </div>
  );
};

export default ModalCodigoDuplicado;
