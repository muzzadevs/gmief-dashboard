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

// ======== FRONT CARD ========
async function drawFront(
  data: CredentialData,
  W: number,
  H: number,
  spainImg: HTMLImageElement | null,
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null
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

  // Background gradient
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a1628");
  bg.addColorStop(0.4, "#0f2140");
  bg.addColorStop(0.7, "#163060");
  bg.addColorStop(1, "#1a3a7a");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Subtle diagonal lines
  c.save();
  c.globalAlpha = 0.025;
  c.strokeStyle = "#fff";
  c.lineWidth = 1;
  for (let i = -H; i < W + H; i += 22) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i - H * 0.5, H);
    c.stroke();
  }
  c.restore();

  // Spain map watermark (bottom-right, subtle)
  if (spainImg) {
    c.save();
    c.globalAlpha = 0.035;
    const mh = H * 0.65;
    const mw = mh * (spainImg.width / spainImg.height);
    c.drawImage(spainImg, W - mw + 20, H - mh - 10, mw, mh);
    c.restore();
  }

  // === Top Spanish flag accent bar ===
  const flagH = 5;
  c.fillStyle = "#c60b1e";
  c.fillRect(0, 0, W, flagH);
  c.fillStyle = "#ffc400";
  c.fillRect(0, Math.round(flagH * 0.33), W, Math.round(flagH * 0.34));

  // === Header area with logo ===
  const headerY = flagH + 10;
  const pad = 24;

  // Logo (white version via canvas compositing)
  if (logoImg) {
    const logoH = 50;
    const logoW = logoH * (logoImg.width / logoImg.height);
    // Draw logo white by using compositing
    c.save();
    c.globalAlpha = 0.9;
    // Create temp canvas to invert logo to white
    const tmpCv = document.createElement("canvas");
    tmpCv.width = logoImg.width;
    tmpCv.height = logoImg.height;
    const tmpC = tmpCv.getContext("2d")!;
    tmpC.drawImage(logoImg, 0, 0);
    tmpC.globalCompositeOperation = "source-in";
    tmpC.fillStyle = "#ffffff";
    tmpC.fillRect(0, 0, tmpCv.width, tmpCv.height);
    c.drawImage(tmpCv, pad, headerY, logoW, logoH);
    c.restore();
  } else {
    // Fallback text
    c.fillStyle = "rgba(255,255,255,0.9)";
    c.font = "bold 24px 'Segoe UI', sans-serif";
    c.textBaseline = "top";
    c.fillText("IE FILADELFIA", pad, headerY + 10);
  }

  // Zone (right side of header)
  c.fillStyle = "rgba(255,255,255,0.4)";
  c.font = "13px 'Segoe UI', sans-serif";
  c.textAlign = "right";
  c.textBaseline = "top";
  c.fillText(`Zona de ${data.zona_nombre}`, W - pad, headerY + 20);
  c.textAlign = "left";

  // === Gold separator line ===
  const sepY = headerY + 60;
  const goldGrad = c.createLinearGradient(pad, 0, W - pad, 0);
  goldGrad.addColorStop(0, "#c8920e");
  goldGrad.addColorStop(0.5, "#f0c030");
  goldGrad.addColorStop(1, "#c8920e");
  c.fillStyle = goldGrad;
  c.globalAlpha = 0.5;
  c.fillRect(pad, sepY, W - pad * 2, 1.5);
  c.globalAlpha = 1;

  // === Body area: Photo left, Info right ===
  const bodyY = sepY + 12;

  // Photo
  const pw = 142, ph = 178;
  const px = pad;
  const py = bodyY;

  c.save();
  roundRect(c, px, py, pw, ph, 10);
  c.fillStyle = "rgba(255,255,255,0.05)";
  c.fill();
  // Gold border
  c.strokeStyle = "rgba(212,180,80,0.35)";
  c.lineWidth = 2.5;
  c.stroke();
  if (photoImg) {
    c.clip();
    c.drawImage(photoImg, px, py, pw, ph);
  } else {
    const fn = `${data.nombre} ${data.apellidos || ""}`.trim();
    c.fillStyle = "rgba(255,255,255,0.2)";
    c.font = "bold 56px 'Segoe UI', sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(fn[0], px + pw / 2, py + ph / 2);
    c.textAlign = "left";
    c.textBaseline = "top";
  }
  c.restore();

  // === Right column: text info ===
  const infoX = px + pw + 18;
  const infoW = W - infoX - pad;

  // Name
  const fn = `${data.nombre} ${data.apellidos || ""}`.trim();
  c.fillStyle = "#fff";
  c.font = "bold 28px 'Segoe UI', sans-serif";
  c.textBaseline = "top";
  const nw = fn.split(" ");
  let l1 = "", l2 = "";
  for (const w of nw) {
    const t = l1 + (l1 ? " " : "") + w;
    if (c.measureText(t).width > infoW && l1) l2 += (l2 ? " " : "") + w;
    else l1 = t;
  }
  c.fillText(l1, infoX, bodyY + 4);
  if (l2) c.fillText(l2, infoX, bodyY + 36);

  const iy = bodyY + (l2 ? 76 : 44);

  // DNI/NIE
  c.fillStyle = "rgba(255,255,255,0.5)";
  c.font = "16px 'Courier New', monospace";
  c.fillText(data.dni || data.nie || "—", infoX, iy);

  // Code label
  c.fillStyle = "rgba(255,255,255,0.25)";
  c.font = "600 10px 'Segoe UI', sans-serif";
  c.fillText("CÓDIGO", infoX, iy + 30);

  // Code value (gold gradient)
  const codeGrad = c.createLinearGradient(infoX, 0, infoX + 200, 0);
  codeGrad.addColorStop(0, "#f0c030");
  codeGrad.addColorStop(1, "#e0a820");
  c.fillStyle = codeGrad;
  c.font = "bold 32px 'Courier New', monospace";
  c.fillText(data.codigo || "—", infoX, iy + 46);

  // === Footer gold bar ===
  const fh = 46;
  const footGrad = c.createLinearGradient(0, H - fh, W, H - fh);
  footGrad.addColorStop(0, "#b8860b");
  footGrad.addColorStop(0.3, "#d4a017");
  footGrad.addColorStop(0.5, "#f0c030");
  footGrad.addColorStop(0.7, "#d4a017");
  footGrad.addColorStop(1, "#b8860b");
  c.fillStyle = footGrad;
  c.fillRect(0, H - fh, W, fh);

  // "MINISTRO DE CULTO" in footer
  c.fillStyle = "#0a1628";
  c.font = "bold 18px 'Segoe UI', sans-serif";
  c.textBaseline = "middle";
  c.fillText("MINISTRO DE CULTO", pad, H - fh / 2);

  // Validez
  c.fillStyle = "rgba(10,22,40,0.55)";
  c.font = "600 13px 'Segoe UI', sans-serif";
  c.textAlign = "right";
  c.fillText(`Validez: ${formatExpiryDate()}`, W - pad, H - fh / 2);

  c.restore();

  return cv;
}

// ======== BACK CARD ========
function drawBack(W: number, H: number, logoImg: HTMLImageElement | null): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d")!;
  const R = 20;

  c.clearRect(0, 0, W, H);

  c.save();
  roundRect(c, 0, 0, W, H, R);
  c.clip();

  // Background (same as front)
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a1628");
  bg.addColorStop(0.4, "#0f2140");
  bg.addColorStop(0.7, "#163060");
  bg.addColorStop(1, "#1a3a7a");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Subtle diagonal lines
  c.save();
  c.globalAlpha = 0.025;
  c.strokeStyle = "#fff";
  c.lineWidth = 1;
  for (let i = -H; i < W + H; i += 22) {
    c.beginPath();
    c.moveTo(i, 0);
    c.lineTo(i - H * 0.5, H);
    c.stroke();
  }
  c.restore();

  // Top gold accent
  const accentGrad1 = c.createLinearGradient(0, 0, W, 0);
  accentGrad1.addColorStop(0, "#b8860b");
  accentGrad1.addColorStop(0.5, "#f0c030");
  accentGrad1.addColorStop(1, "#b8860b");
  c.fillStyle = accentGrad1;
  c.fillRect(0, 0, W, 3);

  // Bottom gold accent
  c.fillStyle = accentGrad1;
  c.fillRect(0, H - 3, W, 3);

  // --- Logo at top ---
  if (logoImg) {
    const logoH = 32;
    const logoW = logoH * (logoImg.width / logoImg.height);
    c.save();
    c.globalAlpha = 0.45;
    const tmpCv = document.createElement("canvas");
    tmpCv.width = logoImg.width;
    tmpCv.height = logoImg.height;
    const tmpC = tmpCv.getContext("2d")!;
    tmpC.drawImage(logoImg, 0, 0);
    tmpC.globalCompositeOperation = "source-in";
    tmpC.fillStyle = "#ffffff";
    tmpC.fillRect(0, 0, tmpCv.width, tmpCv.height);
    c.drawImage(tmpCv, (W - logoW) / 2, 14, logoW, logoH);
    c.restore();
  }

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

  const logoSpace = logoImg ? 50 : 10;
  const titleH = 20;
  const subtitleH = 13;
  const sepH = 1;
  const gapSmall = 6;
  const gapMed = 8;
  const p1H = lines1.length * lh;
  const p2H = lines2.length * lh;

  const contentH = titleH + gapSmall + subtitleH + gapMed + sepH + gapMed + p1H + gapMed + sepH + gapMed + p2H;
  let y = logoSpace + (H - logoSpace - contentH) / 2;

  // Title
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.font = "bold 17px 'Segoe UI', sans-serif";
  c.textAlign = "center";
  c.textBaseline = "top";
  c.fillText("EXTRACTOS DE LEY", W / 2, y);
  y += titleH + gapSmall;

  // Subtitle
  c.fillStyle = "rgba(255,255,255,0.35)";
  c.font = "10px 'Segoe UI', sans-serif";
  c.fillText("Ley 7/1980 de Libertad Religiosa  •  Ley 24/1992 Acuerdo Iglesia-Estado", W / 2, y);
  y += subtitleH + gapMed;

  // Separator (gold gradient)
  const sepGrad = c.createLinearGradient(W * 0.15, 0, W * 0.85, 0);
  sepGrad.addColorStop(0, "transparent");
  sepGrad.addColorStop(0.5, "rgba(240,192,48,0.4)");
  sepGrad.addColorStop(1, "transparent");
  c.strokeStyle = sepGrad;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(W * 0.15, y);
  c.lineTo(W * 0.85, y);
  c.stroke();
  y += sepH + gapMed;

  // Paragraph 1 (centered)
  c.fillStyle = "rgba(255,255,255,0.6)";
  c.font = `${fs}px 'Segoe UI', sans-serif`;
  c.textAlign = "center";
  for (const line of lines1) {
    c.fillText(line, W / 2, y);
    y += lh;
  }
  y += gapMed;

  // Separator
  const sepGrad2 = c.createLinearGradient(W * 0.25, 0, W * 0.75, 0);
  sepGrad2.addColorStop(0, "transparent");
  sepGrad2.addColorStop(0.5, "rgba(255,255,255,0.15)");
  sepGrad2.addColorStop(1, "transparent");
  c.strokeStyle = sepGrad2;
  c.beginPath();
  c.moveTo(W * 0.25, y);
  c.lineTo(W * 0.75, y);
  c.stroke();
  y += sepH + gapMed;

  // Paragraph 2 (centered)
  c.fillStyle = "rgba(255,255,255,0.6)";
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
      let li: HTMLImageElement | null = null;
      try { li = await loadImage("/TEMPLOGOIEF.png"); } catch { /* */ }

      const fc = await drawFront(data, TW, TH, si, pi, li);
      const bc = drawBack(TW, TH, li);

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
