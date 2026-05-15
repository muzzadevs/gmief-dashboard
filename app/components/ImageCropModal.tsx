"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

type ImageCropModalProps = {
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
};

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  maxSize: number = 512
): Promise<File> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelCropX = crop.x * scaleX;
  const pixelCropY = crop.y * scaleY;
  const pixelCropWidth = crop.width * scaleX;
  const pixelCropHeight = crop.height * scaleY;

  // Output size: limit to maxSize for performance
  const outputSize = Math.min(pixelCropWidth, maxSize);
  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    pixelCropX,
    pixelCropY,
    pixelCropWidth,
    pixelCropHeight,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob failed"));
          return;
        }
        const file = new File([blob], "avatar.webp", { type: "image/webp" });
        resolve(file);
      },
      "image/webp",
      0.85
    );
  });
}

export default function ImageCropModal({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, 1));
    },
    []
  );

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;
    setSaving(true);
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop, 512);
      onCropComplete(croppedFile);
    } catch {
      alert("Error al recortar la imagen");
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
      }}
      className="bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <h3 className="text-base sm:text-lg font-bold text-white">
          Recortar foto de perfil
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Crop area - takes all available space */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-3 sm:p-6 min-h-0">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={1}
          circularCrop
          keepSelection
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Imagen a recortar"
            onLoad={onImageLoad}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "calc(100dvh - 180px)",
              width: "auto",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </ReactCrop>
      </div>

      {/* Footer with buttons */}
      <div className="shrink-0 bg-slate-800 border-t border-slate-700 px-4 sm:px-6 py-3 sm:py-4">
        <p className="text-xs text-slate-400 text-center mb-3">
          Arrastra para ajustar el recorte · La imagen se guardará optimizada
        </p>
        <div className="flex gap-3 max-w-md mx-auto">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-60"
            disabled={saving || !completedCrop}
          >
            {saving ? "Procesando..." : "Confirmar recorte"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
