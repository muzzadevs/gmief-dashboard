"use client";

import { useMemo } from "react";
import Image from "next/image";

const PHOTOS = [
  "/loginFotos/f259f97c-6701-45eb-a8bd-68bd49f6df4f_16-9-discover-aspect-ratio_default_0_x1224y353.jpg",
  "/loginFotos/hq720.jpg",
  "/loginFotos/images (1).jpg",
  "/loginFotos/images.jpg",
  "/loginFotos/maxresdefault (1).jpg",
  "/loginFotos/maxresdefault.jpg",
];

interface FloatingPhotoConfig {
  id: number;
  src: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotation: number;
  scale: number;
  opacity: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createPhotoConfig(id: number, src: string): FloatingPhotoConfig {
  const scale = randomBetween(0.6, 1.1);
  const width = randomBetween(140, 220);
  const height = width * randomBetween(0.6, 0.8);
  return {
    id,
    src,
    startX: randomBetween(5, 95),
    startY: randomBetween(5, 95),
    endX: randomBetween(5, 95),
    endY: randomBetween(5, 95),
    rotation: randomBetween(-15, 15),
    scale,
    opacity: randomBetween(0.12, 0.25),
    width,
    height,
    duration: randomBetween(20, 40),
    delay: randomBetween(0, 5),
  };
}

export default function FloatingPhotos() {
  // Generar las configuraciones una sola vez (no provoca re-renders)
  const photos = useMemo(() => {
    const initial = PHOTOS.map((src, i) => createPhotoConfig(i, src));
    const duplicates = PHOTOS.slice(0, 3).map((src, i) =>
      createPhotoConfig(PHOTOS.length + i, src)
    );
    return [...initial, ...duplicates];
  }, []);

  return (
    <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="absolute floating-photo"
          style={{
            left: `${photo.startX}%`,
            top: `${photo.startY}%`,
            opacity: photo.opacity,
            width: photo.width,
            height: photo.height,
            // CSS animation en vez de JS — 0 re-renders
            animation: `floatDrift${photo.id % 4} ${photo.duration}s ease-in-out ${photo.delay}s infinite alternate`,
            transform: `translate(-50%, -50%) rotate(${photo.rotation}deg) scale(${photo.scale})`,
            willChange: "transform",
          }}
        >
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl shadow-black/20 border border-white/10">
            <Image
              src={photo.src}
              alt=""
              fill
              sizes="220px"
              className="object-cover grayscale"
              priority={photo.id < 3}
            />
          </div>
        </div>
      ))}

      {/* CSS keyframes para movimiento — reemplaza requestAnimationFrame */}
      <style jsx>{`
        @keyframes floatDrift0 {
          0% { transform: translate(-50%, -50%) rotate(-5deg) translateX(0) translateY(0); }
          100% { transform: translate(-50%, -50%) rotate(5deg) translateX(40px) translateY(-30px); }
        }
        @keyframes floatDrift1 {
          0% { transform: translate(-50%, -50%) rotate(3deg) translateX(0) translateY(0); }
          100% { transform: translate(-50%, -50%) rotate(-3deg) translateX(-35px) translateY(25px); }
        }
        @keyframes floatDrift2 {
          0% { transform: translate(-50%, -50%) rotate(-8deg) translateX(0) translateY(0); }
          100% { transform: translate(-50%, -50%) rotate(8deg) translateX(25px) translateY(35px); }
        }
        @keyframes floatDrift3 {
          0% { transform: translate(-50%, -50%) rotate(6deg) translateX(0) translateY(0); }
          100% { transform: translate(-50%, -50%) rotate(-6deg) translateX(-30px) translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
