import React from "react";

interface LoaderPersonalizadoProps {
  children: React.ReactNode;
  className?: string;
}

const LoaderPersonalizado: React.FC<LoaderPersonalizadoProps> = ({
  children,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center w-full min-h-screen bg-transparent py-12 ${className}`}
  >
    <div className="relative w-10 h-10 mb-3">
      <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
    </div>
    <span className="text-white/70 text-sm font-medium">{children}</span>
  </div>
);

export default LoaderPersonalizado;
