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
    className={`flex flex-col items-center justify-center w-full py-12 ${className}`}
  >
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600 mb-2"></div>
    <span className="text-gray-500 text-sm">{children}</span>
  </div>
);

export default LoaderPersonalizado;
