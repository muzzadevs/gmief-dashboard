"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import type { CredentialData } from "./CredentialCard";

interface CredentialCard3DProps {
  data: CredentialData;
}

function formatExpiryDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load: " + src));
    img.src = src;
  });
}

/** Draw a rounded rect path (for clipping or filling) */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const t = line + w + " ";
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line.trim(), x, cy);
      line = w + " ";
      cy += lh;
    } else {
      line = t;
    }
  }
  ctx.fillText(line.trim(), x, cy);
}

// ======== FRONT CARD ========
async function drawFront(
  data: CredentialData,
  W: number,
  H: number,
  spainImg: HTMLImageElement | null,
  photoImg: HTMLImageElement | null
): Promise<HTMLCanvasElement> {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d")!;
  const R = 20;

  c.clearRect(0, 0, W, H);

  c.save();
  roundRect(c, 0, 0, W, H, R);
  c.clip();

  // Background
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0c1929");
  bg.addColorStop(1, "#16325a");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Diagonal lines
  c.save();
  c.globalAlpha = 0.035;
  c.strokeStyle = "#fff";
  c.lineWidth = 1;
  for (let i = -H; i < W + H; i += 20) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i - H * 0.5, H);
    c.stroke();
  }
  c.restore();

  // Spain map watermark
  if (spainImg) {
    c.save();
    c.globalAlpha = 0.045;
    const mh = H * 0.75;
    const mw = mh * (spainImg.width / spainImg.height);
    c.drawImage(spainImg, (W - mw) / 2, (H - mh) / 2, mw, mh);
    c.restore();
  }

  // === Photo (right side, 1:1 square) ===
  const pw = 160, ph = 160;
  const px = W - pw - 20;
  const py = 16;

  c.save();
  roundRect(c, px, py, pw, ph, 10);
  c.fillStyle = "rgba(255,255,255,0.06)";
  c.fill();
  c.strokeStyle = "rgba(255,255,255,0.18)";
  c.lineWidth = 2;
  c.stroke();
  if (photoImg) {
    c.clip();
    c.drawImage(photoImg, px, py, pw, ph);
  } else {
    const fn = `${data.nombre} ${data.apellidos || ""}`.trim();
    c.fillStyle = "rgba(255,255,255,0.2)";
    c.font = "bold 60px 'Segoe UI', sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(fn[0], px + pw / 2, py + ph / 2);
    c.textAlign = "left";
    c.textBaseline = "top";
  }
  c.restore();

  // === Left column: all text info ===
  const leftW = px - 20; // available width for text
  const pad = 24;

  // Header
  c.fillStyle = "rgba(255,255,255,0.9)";
  c.font = "bold 24px 'Segoe UI', sans-serif";
  c.textBaseline = "top";
  c.fillText("IGLESIA EVANGÉLICA", pad, 18);
  c.fillText("DE FILADELFIA", pad, 46);

  // Zone
  c.fillStyle = "rgba(255,255,255,0.5)";
  c.font = "16px 'Segoe UI', sans-serif";
  c.fillText(`Zona de ${data.zona_nombre}`, pad, 78);

  // Name (bigger)
  const fn = `${data.nombre} ${data.apellidos || ""}`.trim();
  c.fillStyle = "#fff";
  c.font = "bold 32px 'Segoe UI', sans-serif";
  const maxNameW = leftW - pad;
  const nw = fn.split(" ");
  let l1 = "", l2 = "";
  for (const w of nw) {
    const t = l1 + (l1 ? " " : "") + w;
    if (c.measureText(t).width > maxNameW && l1) l2 += (l2 ? " " : "") + w;
    else l1 = t;
  }
  c.fillText(l1, pad, 112);
  if (l2) c.fillText(l2, pad, 148);

  const iy = l2 ? 190 : 158;

  // DNI
  c.fillStyle = "rgba(255,255,255,0.55)";
  c.font = "18px 'Segoe UI', sans-serif";
  c.fillText(data.dni || data.nie || "—", pad, iy);

  // Code label
  c.fillStyle = "rgba(255,255,255,0.3)";
  c.font = "600 12px 'Segoe UI', sans-serif";
  c.fillText("CÓDIGO", pad, iy + 32);

  // Code value (bigger, sans-serif font)
  c.fillStyle = "#fff";
  c.font = "bold 40px 'Segoe UI', sans-serif";
  c.fillText(data.codigo || "—", pad, iy + 50);

  // === "MINISTRO DE CULTO" above gold bar, bold gold text ===
  const fh = 34;
  const labelY = H - fh - 30;
  c.fillStyle = "#f0c030";
  c.font = "bold 22px 'Segoe UI', sans-serif";
  c.textBaseline = "top";
  c.fillText("MINISTRO DE CULTO", pad, labelY);

  // === Footer gold bar ===
  const fg = c.createLinearGradient(0, H - fh, 0, H);
  fg.addColorStop(0, "#c8920e");
  fg.addColorStop(0.5, "#f0c030");
  fg.addColorStop(1, "#c8920e");
  c.fillStyle = fg;
  c.fillRect(0, H - fh, W, fh);

  // Validez inside gold bar, bigger and visible
  c.fillStyle = "#0c1929";
  c.font = "bold 16px 'Segoe UI', sans-serif";
  c.textBaseline = "middle";
  c.fillText(`Validez: ${formatExpiryDate()}`, pad, H - fh / 2);

  c.fillStyle = "rgba(12,25,41,0.5)";
  c.font = "13px 'Segoe UI', sans-serif";
  c.textAlign = "right";
  c.fillText("IGLESIA EVANGÉLICA DE FILADELFIA", W - 24, H - fh / 2);

  c.restore();

  return cv;
}

// ======== BACK CARD ========
function drawBack(W: number, H: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d")!;
  const R = 20;

  c.clearRect(0, 0, W, H);

  c.save();
  roundRect(c, 0, 0, W, H, R);
  c.clip();

  // Background
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0c1929");
  bg.addColorStop(1, "#16325a");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Diagonal lines
  c.save();
  c.globalAlpha = 0.035;
  c.strokeStyle = "#fff";
  c.lineWidth = 1;
  for (let i = -H; i < W + H; i += 20) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i - H * 0.5, H);
    c.stroke();
  }
  c.restore();

  // --- Measure all text to center vertically ---
  const mx = 36;
  const maxTW = W - mx * 2;
  const fs = 11;
  const lh = 15;

  const t1 = "El acceso de los Ministros de Culto de la Iglesia Evangélica Filadelfia a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros análogos del sector público, es libre y sin limitaciones de horarios para su asistencia religiosa (Ley 7/1980, Art. 2)";
  const t2 = "Los Ministros de Culto de las Iglesias pertenecientes a la Iglesia Evangélica Filadelfia no están obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. (Ley 24/1992, Art. 3.2)";

  c.font = `${fs}px 'Segoe UI', sans-serif`;
  const lines1 = getWrappedLines(c, t1, maxTW);
  const lines2 = getWrappedLines(c, t2, maxTW);

  // Layout: title (18px) + gap(8) + subtitle (11px) + gap(12) + separator(1) + gap(10)
  //        + paragraph1 + gap(10) + separator(1) + gap(10) + paragraph2
  const titleH = 20;
  const subtitleH = 13;
  const sepH = 1;
  const gapSmall = 8;
  const gapMed = 10;
  const p1H = lines1.length * lh;
  const p2H = lines2.length * lh;

  const totalH = titleH + gapSmall + subtitleH + gapMed + sepH + gapMed + p1H + gapMed + sepH + gapMed + p2H;
  let y = (H - totalH) / 2;

  // Title
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.font = "bold 17px 'Segoe UI', sans-serif";
  c.textAlign = "center";
  c.textBaseline = "top";
  c.fillText("EXTRACTOS DE LEY", W / 2, y);
  y += titleH + gapSmall;

  // Subtitle
  c.fillStyle = "rgba(255,255,255,0.4)";
  c.font = "10px 'Segoe UI', sans-serif";
  c.fillText("Ley 7/1980 de Libertad Religiosa  •  Ley 24/1992 Acuerdo Iglesia-Estado", W / 2, y);
  y += subtitleH + gapMed;

  // Separator
  c.strokeStyle = "rgba(255,255,255,0.15)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(W * 0.15, y);
  c.lineTo(W * 0.85, y);
  c.stroke();
  y += sepH + gapMed;

  // Paragraph 1 (centered)
  c.fillStyle = "rgba(255,255,255,0.65)";
  c.font = `${fs}px 'Segoe UI', sans-serif`;
  c.textAlign = "center";
  for (const line of lines1) {
    c.fillText(line, W / 2, y);
    y += lh;
  }
  y += gapMed;

  // Separator
  c.strokeStyle = "rgba(255,255,255,0.1)";
  c.beginPath();
  c.moveTo(W * 0.25, y);
  c.lineTo(W * 0.75, y);
  c.stroke();
  y += sepH + gapMed;

  // Paragraph 2 (centered)
  c.fillStyle = "rgba(255,255,255,0.65)";
  for (const line of lines2) {
    c.fillText(line, W / 2, y);
    y += lh;
  }

  c.restore();

  return cv;
}

/** Get wrapped lines for centered text */
function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line + w + " ";
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line.trim());
      line = w + " ";
    } else {
      line = t;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

// ======== THREE.JS COMPONENT ========
export default function CredentialCard3D({ data }: CredentialCard3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef(0);
  const dragging = useRef(false);
  const prev = useRef({ x: 0, y: 0 });
  const tgt = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

  const init = useCallback(async () => {
    if (!mountRef.current || rendererRef.current) return;
    const el = mountRef.current;
    const cw = el.clientWidth || 800;
    const ch = Math.min(cw * 0.6, 440) || 380;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, cw / ch, 0.1, 100);
    cam.position.set(0, 0, 5.2);
    cameraRef.current = cam;

    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ren.setSize(cw, ch);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.setClearColor(0x000000, 0);
    ren.toneMapping = THREE.ACESFilmicToneMapping;
    ren.toneMappingExposure = 1.2;
    el.appendChild(ren.domElement);
    rendererRef.current = ren;

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const d1 = new THREE.DirectionalLight(0xffffff, 1.3);
    d1.position.set(4, 5, 8);
    scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x93c5fd, 0.25);
    d2.position.set(-3, 2, 5);
    scene.add(d2);

    const TW = 680, TH = 428;

    try {
      let si: HTMLImageElement | null = null;
      try { si = await loadImage("/spainMap.png"); } catch { /* */ }
      let pi: HTMLImageElement | null = null;
      if (data.has_imagen) {
        try { pi = await loadImage(`/api/ministerios/${data.ministerio_id}/imagen`); } catch { /* */ }
      }

      const fc = await drawFront(data, TW, TH, si, pi);
      const bc = drawBack(TW, TH);

      const ft = new THREE.CanvasTexture(fc);
      ft.colorSpace = THREE.SRGBColorSpace;
      const bt = new THREE.CanvasTexture(bc);
      bt.colorSpace = THREE.SRGBColorSpace;

      // Use simple BoxGeometry - it maps UVs correctly
      const cardW = 3.6;
      const cardH = cardW / (85.6 / 53.98);
      const geo = new THREE.BoxGeometry(cardW, cardH, 0.025);

      const edge = new THREE.MeshStandardMaterial({ color: 0x0c1929, roughness: 0.4, metalness: 0.2 });
      const mats = [
        edge, edge, edge, edge,
        new THREE.MeshStandardMaterial({ map: ft, roughness: 0.12, metalness: 0.08, transparent: true }),
        new THREE.MeshStandardMaterial({ map: bt, roughness: 0.12, metalness: 0.08, transparent: true }),
      ];

      const mesh = new THREE.Mesh(geo, mats);
      scene.add(mesh);
      meshRef.current = mesh;
      tgt.current = { x: 0.05, y: -0.1 };
      setLoading(false);
    } catch (e) {
      console.error("3D error:", e);
      setLoading(false);
    }

    const anim = () => {
      frameRef.current = requestAnimationFrame(anim);
      if (meshRef.current) {
        cur.current.x += (tgt.current.x - cur.current.x) * 0.06;
        cur.current.y += (tgt.current.y - cur.current.y) * 0.06;
        meshRef.current.rotation.x = cur.current.x;
        meshRef.current.rotation.y = cur.current.y;
      }
      ren.render(scene, cam);
    };
    anim();
  }, [data]);

  useEffect(() => {
    const t = setTimeout(init, 80);
    const m = mountRef.current;
    return () => {
      clearTimeout(t);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current && m) {
        try { m.removeChild(rendererRef.current.domElement); } catch { /* */ }
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [init]);

  useEffect(() => {
    const h = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const hh = Math.min(w * 0.6, 440);
      cameraRef.current.aspect = w / hh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, hh);
    };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const onD = useCallback((e: React.PointerEvent) => { dragging.current = true; prev.current = { x: e.clientX, y: e.clientY }; }, []);
  const onM = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    tgt.current.y += (e.clientX - prev.current.x) * 0.008;
    tgt.current.x += (e.clientY - prev.current.y) * 0.008;
    tgt.current.x = Math.max(-0.6, Math.min(0.6, tgt.current.x));
    prev.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onU = useCallback(() => { dragging.current = false; }, []);

  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-white/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
            </div>
            <span className="text-white/60 text-sm">Generando vista 3D...</span>
          </div>
        </div>
      )}
      <div
        ref={mountRef}
        className="w-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: 360, touchAction: "none" }}
        onPointerDown={onD}
        onPointerMove={onM}
        onPointerUp={onU}
        onPointerLeave={onU}
      />
      <p className="text-center text-white/40 text-xs mt-2">Arrastra para girar la tarjeta</p>
    </div>
  );
}
