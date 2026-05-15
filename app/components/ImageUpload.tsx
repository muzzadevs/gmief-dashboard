"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import ImageCropModal from "./ImageCropModal";

type ImageUploadProps = {
  ministerioId?: number | null;
  hasImagen?: boolean;
  onChange?: (file: File | null) => void;
  size?: "sm" | "lg";
  nombre?: string;
};

export default function ImageUpload({
  ministerioId,
  hasImagen,
  onChange,
  size = "lg",
  nombre,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const sizeClass = size === "lg" ? "w-28 h-28" : "w-12 h-12";
  const sizePixels = size === "lg" ? 112 : 48;
  const textSize = size === "lg" ? "text-4xl" : "text-xl";
  const iconSize = size === "lg" ? "w-6 h-6" : "w-3.5 h-3.5";

  const imageSrc = preview
    ? preview
    : !removed && ministerioId && hasImagen
    ? `/api/ministerios/${ministerioId}/imagen?t=${Date.now()}`
    : null;

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validar tipo
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Formato no soportado. Use JPG, PNG, GIF o WebP");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("La imagen no puede superar los 10MB");
        return;
      }
      // Read file and open crop modal
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    // Set preview from cropped file
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setRemoved(false);
    };
    reader.readAsDataURL(croppedFile);
    onChange?.(croppedFile);
    setCropSrc(null);
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setRemoved(true);
    if (inputRef.current) inputRef.current.value = "";
    onChange?.(null);
  };

  const letra = nombre ? nombre[0].toUpperCase() : "?";

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <div className="relative group">
          <button
            type="button"
            onClick={handleClick}
            className={`${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg ring-2 ring-white/30 transition-all hover:ring-blue-400 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer`}
          >
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt="Foto"
                width={sizePixels}
                height={sizePixels}
                className="w-full h-full object-cover"
                unoptimized={imageSrc.startsWith("data:") || imageSrc.startsWith("/api/")}
              />
            ) : (
              <span className={`${textSize} font-bold text-white select-none`}>
                {letra}
              </span>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className={iconSize}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
            </div>
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {size === "lg" && (
          <span className="text-xs text-slate-400">
            {imageSrc ? "Clic para cambiar foto" : "Clic para subir foto"}
          </span>
        )}

        {/* Botón visible para eliminar foto */}
        {imageSrc && (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            Eliminar foto de perfil
          </button>
        )}
      </div>

      {/* Crop Modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
