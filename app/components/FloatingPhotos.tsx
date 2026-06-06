"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

const PHOTOS = [
  "/loginFotos/f259f97c-6701-45eb-a8bd-68bd49f6df4f_16-9-discover-aspect-ratio_default_0_x1224y353.jpg",
  "/loginFotos/hq720.jpg",
  "/loginFotos/images (1).jpg",
  "/loginFotos/images.jpg",
  "/loginFotos/maxresdefault (1).jpg",
  "/loginFotos/maxresdefault.jpg",
];

interface FloatingPhoto {
  id: number;
  src: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  opacity: number;
  width: number;
  height: number;
}

const SPEED_FACTOR = 0.5;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createPhoto(id: number, src: string): FloatingPhoto {
  const scale = randomBetween(0.6, 1.1);
  const width = randomBetween(140, 220);
  const height = width * randomBetween(0.6, 0.8);
  return {
    id,
    src,
    x: randomBetween(0, 100),
    y: randomBetween(0, 100),
    vx: (randomBetween(-0.015, 0.015) || 0.008) * SPEED_FACTOR,
    vy: (randomBetween(-0.012, 0.012) || 0.006) * SPEED_FACTOR,
    rotation: randomBetween(-15, 15),
    rotationSpeed: randomBetween(-0.08, 0.08) * SPEED_FACTOR,
    scale,
    opacity: randomBetween(0.12, 0.25),
    width,
    height,
  };
}

export default function FloatingPhotos() {
  const [photos, setPhotos] = useState<FloatingPhoto[]>([]);
  const animRef = useRef<number>(0);
  const photosRef = useRef<FloatingPhoto[]>([]);

  useEffect(() => {
    // Initialize photos
    const initial = PHOTOS.map((src, i) => createPhoto(i, src));
    // Add some duplicates for more coverage
    const duplicates = PHOTOS.slice(0, 3).map((src, i) =>
      createPhoto(PHOTOS.length + i, src)
    );
    const all = [...initial, ...duplicates];
    photosRef.current = all;
    setPhotos(all);

    let lastTime = performance.now();

    function animate(now: number) {
      const dt = Math.min(now - lastTime, 50); // cap delta
      lastTime = now;

      photosRef.current = photosRef.current.map((p) => {
        let newX = p.x + p.vx * dt;
        let newY = p.y + p.vy * dt;
        let newVx = p.vx;
        let newVy = p.vy;

        // Bounce off edges with some randomness
        if (newX < -5 || newX > 105) {
          newVx = -newVx * randomBetween(0.8, 1.2);
          newX = newX < -5 ? -5 : 105;
        }
        if (newY < -5 || newY > 105) {
          newVy = -newVy * randomBetween(0.8, 1.2);
          newY = newY < -5 ? -5 : 105;
        }

        return {
          ...p,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          rotation: p.rotation + p.rotationSpeed * dt * 0.01,
        };
      });

      setPhotos([...photosRef.current]);
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="absolute"
          style={{
            left: `${photo.x}%`,
            top: `${photo.y}%`,
            transform: `translate(-50%, -50%) rotate(${photo.rotation}deg) scale(${photo.scale})`,
            opacity: photo.opacity,
            width: photo.width,
            height: photo.height,
            willChange: "transform, left, top",
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
    </div>
  );
}
