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
  // Mensaje en formato oración, solo la primera letra en mayúscula
  const mensaje = `El código introducido ya existe y le pertenece a `;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <p className="mb-8 text-lg text-black">
          {mensaje}
          <span className="font-bold">
            {nombreMinisterio} {apellidosMinisterio}
          </span>
          .
        </p>
        <button
          onClick={onClose}
          className="flex items-center justify-center gap-2 bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors w-full"
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
