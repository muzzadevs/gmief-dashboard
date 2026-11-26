"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import type { CredentialData } from "./CredentialCard";

interface CredentialCard3DProps {
  data: CredentialData;
}

const NAVY = "#1a2d50";
const LABEL = "#7a8ca3";
const SEP = "#d0d8e2";
const BODY = "#1e293b";

function formatExpiryDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load: " + src));
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line + w + " ";
    if (ctx.measureText(t).width > maxW && line) { lines.push(line.trim()); line = w + " "; }
    else { line = t; }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DRAW FRONT (Canvas para textura 3D)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function drawFront(
  data: CredentialData, W: number, H: number,
  spainImg: HTMLImageElement | null, photoImg: HTMLImageElement | null, logoImg: HTMLImageElement | null
): Promise<HTMLCanvasElement> {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!;
  const R = 16;
  const pad = 28;
  c.save(); roundRect(c, 0, 0, W, H, R); c.clip();

  // Fondo blanco
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, W, H);

  // Mapa de EspaÃ±a marca de agua
  if (spainImg) {
    c.save(); c.globalAlpha = 0.07;
    const mh = H * 0.55;
    const mw = mh * (spainImg.width / spainImg.height);
    c.drawImage(spainImg, W - mw - 10, 70, mw, mh);
    c.restore();
  }

  // â”€â”€ HEADER: tÃ­tulo grande centrado â”€â”€
  c.textAlign = "center"; c.textBaseline = "top";
  c.fillStyle = NAVY;
  c.font = "800 36px 'Segoe UI', sans-serif";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", W / 2, 18);

  // CIF con lÃ­neas
  const cifText = "CIF R480047J";
  c.font = "600 12px 'Segoe UI', sans-serif";
  c.fillStyle = LABEL;
  const cifW = c.measureText(cifText).width;
  const cifY = 60;
  const lineW = 120;
  c.fillText(cifText, W / 2, cifY);
  c.strokeStyle = NAVY; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(W / 2 - cifW / 2 - lineW - 12, cifY + 7); c.lineTo(W / 2 - cifW / 2 - 12, cifY + 7); c.stroke();
  c.beginPath(); c.moveTo(W / 2 + cifW / 2 + 12, cifY + 7); c.lineTo(W / 2 + cifW / 2 + lineW + 12, cifY + 7); c.stroke();

  // â”€â”€ FOTO â”€â”€
  const pw = 170, ph = 204, px = pad, py = 86;
  c.save();
  roundRect(c, px, py, pw, ph, 6);
  c.fillStyle = "#e8ecf0"; c.fill();
  c.strokeStyle = SEP; c.lineWidth = 1.5; c.stroke();
  if (photoImg) {
    c.clip(); c.drawImage(photoImg, px, py, pw, ph);
  } else {
    const fn = `${data.nombre}`;
    c.fillStyle = "#b0bec5"; c.font = "bold 64px 'Segoe UI', sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(fn[0], px + pw / 2, py + ph / 2);
  }
  c.restore();

  // â”€â”€ DATOS â”€â”€
  const fx = px + pw + 24;
  const fw = W - fx - pad;
  c.textAlign = "left"; c.textBaseline = "top";

  // Nombre
  const nombre = data.nombre.toUpperCase();
  const apellidos = (data.apellidos || "").toUpperCase();
  c.fillStyle = NAVY;
  c.font = "800 32px 'Segoe UI', sans-serif";
  let nameText = nombre;
  while (c.measureText(nameText).width > fw && nameText.length > 3) nameText = nameText.slice(0, -1);
  if (nameText !== nombre) nameText += "\u2026";
  c.fillText(nameText, fx, 92);

  c.font = "700 20px 'Segoe UI', sans-serif";
  let apeText = apellidos;
  while (c.measureText(apeText).width > fw && apeText.length > 3) apeText = apeText.slice(0, -1);
  if (apeText !== apellidos) apeText += "\u2026";
  c.fillText(apeText, fx, 128);

  let fy = 162;
  const drawField = (label: string, value: string, mono?: boolean) => {
    c.fillStyle = LABEL; c.font = "700 10px 'Segoe UI', sans-serif";
    c.fillText(label, fx, fy);
    c.fillStyle = BODY;
    c.font = mono ? "800 18px 'Courier New', monospace" : "700 18px 'Segoe UI', sans-serif";
    c.fillText(value, fx, fy + 14);
    c.strokeStyle = SEP; c.lineWidth = 1;
    c.beginPath(); c.moveTo(fx, fy + 36); c.lineTo(fx + fw * 0.75, fy + 36); c.stroke();
    fy += 44;
  };

  const expiry = formatExpiryDate();
  const docId = data.dni || data.nie || "\u2014";

  drawField("DOCUMENTO", docId);
  drawField("N.\u00ba DE CREDENCIAL", data.codigo || "\u2014", true);

  // â”€â”€ BARRA AZUL: Ministro de Culto â”€â”€
  const barH = 56;
  const barY = H - 30 - barH;
  c.fillStyle = NAVY;
  c.fillRect(0, barY, W, barH);

  // Logo en la barra
  if (logoImg) {
    const lh = 36;
    const lw = lh * (logoImg.width / logoImg.height);
    c.save(); c.globalCompositeOperation = "screen";
    c.drawImage(logoImg, pad, barY + (barH - lh) / 2, lw, lh);
    c.restore();
    // Separador vertical
    c.strokeStyle = "rgba(255,255,255,0.25)"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(pad + lw + 10, barY + 10); c.lineTo(pad + lw + 10, barY + barH - 10); c.stroke();

    const tx = pad + lw + 20;
    c.fillStyle = "#ffffff"; c.font = "800 18px 'Segoe UI', sans-serif";
    c.textBaseline = "top";
    c.fillText("MINISTRO DE CULTO", tx, barY + 8);
    c.fillStyle = "rgba(255,255,255,0.6)"; c.font = "italic 9px 'Segoe UI', sans-serif";
    c.fillText("\u201cId por todo el mundo y predicad el evangelio a toda criatura.\u201d", tx, barY + 30);
    c.fillStyle = "rgba(255,255,255,0.8)"; c.font = "700 9px 'Segoe UI', sans-serif";
    const quoteW = c.measureText("\u201cId por todo el mundo y predicad el evangelio a toda criatura.\u201d  ").width;
    c.fillText("Marcos 16:15", tx + quoteW, barY + 30);
  }

  // â”€â”€ PIE blanco: iglesia + zona â”€â”€
  const footY = barY + barH;
  c.fillStyle = "#f7f8fa";
  c.fillRect(0, footY, W, 30);
  c.strokeStyle = SEP; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, footY); c.lineTo(W, footY); c.stroke();

  c.fillStyle = LABEL; c.font = "600 10px 'Segoe UI', sans-serif";
  c.textBaseline = "middle"; c.textAlign = "left";
  const igText = `${data.iglesia_nombre} \u00b7 [${data.zona_codigo}] ${data.zona_nombre}`;
  c.fillText(igText, pad, footY + 15);

  c.textAlign = "right";
  c.fillText("Caduca: " + expiry, W - pad, footY + 15);

  c.restore();
  return cv;
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DRAW BACK (Canvas para textura 3D)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function drawBack(W: number, H: number, logoImg: HTMLImageElement | null): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!;
  const R = 16;
  c.save(); roundRect(c, 0, 0, W, H, R); c.clip();

  // Fondo blanco
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, W, H);

  // Logo superior
  if (logoImg) {
    const lh = 42;
    const lw = lh * (logoImg.width / logoImg.height);
    c.drawImage(logoImg, (W - lw) / 2, 18, lw, lh);
  }

  // TÃ­tulo
  c.textAlign = "center"; c.textBaseline = "top";
  c.fillStyle = NAVY; c.font = "800 22px 'Segoe UI', sans-serif";
  c.fillText("EXTRACTOS DE LEY", W / 2, 68);

  c.fillStyle = LABEL; c.font = "600 10px 'Segoe UI', sans-serif";
  c.fillText("Ley 7/1980 de Libertad Religiosa  \u2022  Ley 24/1992 Acuerdo Iglesia-Estado", W / 2, 96);

  // Separador
  c.strokeStyle = SEP; c.lineWidth = 1;
  c.beginPath(); c.moveTo(W * 0.15, 115); c.lineTo(W * 0.85, 115); c.stroke();

  // Textos legales
  const mx = 36;
  const maxTW = W - mx * 2;
  const fs = 12;
  const lh = 17;
  const t1 = "El acceso de los Ministros de Culto de la Iglesia Evang\u00e9lica Filadelfia a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros an\u00e1logos del sector p\u00fablico, es libre y sin limitaciones de horarios para su asistencia religiosa. (Ley 7/1980, Art. 2)";
  const t2 = "Los Ministros de Culto de las Iglesias pertenecientes a la Iglesia Evang\u00e9lica Filadelfia no est\u00e1n obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. (Ley 24/1992, Art. 3.2)";

  c.font = `${fs}px 'Segoe UI', sans-serif`;
  const lines1 = getWrappedLines(c, t1, maxTW);
  const lines2 = getWrappedLines(c, t2, maxTW);

  let y = 126;
  c.fillStyle = "#3a4a5e";
  for (const line of lines1) { c.fillText(line, W / 2, y); y += lh; }
  y += 8;

  c.strokeStyle = SEP;
  c.beginPath(); c.moveTo(W * 0.25, y); c.lineTo(W * 0.75, y); c.stroke();
  y += 12;

  c.fillStyle = "#3a4a5e";
  for (const line of lines2) { c.fillText(line, W / 2, y); y += lh; }

  // Barra azul inferior
  const barH = 32;
  c.fillStyle = NAVY;
  c.fillRect(0, H - barH, W, barH);
  c.fillStyle = "rgba(255,255,255,0.5)"; c.font = "700 10px 'Segoe UI', sans-serif";
  c.textBaseline = "middle";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", W / 2, H - barH / 2);

  c.restore();
  return cv;
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   COMPONENTE REACT 3D
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function CredentialCard3D({ data }: CredentialCard3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);

  const tgt = useRef({ x: 0.05, y: -0.1 });
  const cur = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const prev = useRef({ x: 0, y: 0 });

  const init = useCallback(async () => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth;
    const h = Math.min(w * 0.6, 440);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const cam = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    cam.position.set(0, 0, 5.5);
    cameraRef.current = cam;

    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    ren.setSize(w, h);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.toneMapping = THREE.ACESFilmicToneMapping;
    ren.toneMappingExposure = 1.1;
    container.appendChild(ren.domElement);
    rendererRef.current = ren;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 1.2);
    dl.position.set(2, 3, 4); scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xc8b8ff, 0.3);
    dl2.position.set(-3, -1, 2); scene.add(dl2);

    try {
      const CW = 810; const CH = 510;

      const [spainImg, photoImg, logoImg] = await Promise.all([
        loadImage("/spainMap.png").catch(() => null),
        data.has_imagen ? loadImage(`/api/ministerios/${data.ministerio_id}/imagen`).catch(() => null) : Promise.resolve(null),
        loadImage("/TEMPLOGOIEF.png").catch(() => null),
      ]);

      const frontCv = await drawFront(data, CW, CH, spainImg, photoImg, logoImg);
      const backCv = drawBack(CW, CH, logoImg);

      const ft = new THREE.CanvasTexture(frontCv);
      ft.colorSpace = THREE.SRGBColorSpace;
      const bt = new THREE.CanvasTexture(backCv);
      bt.colorSpace = THREE.SRGBColorSpace;

      const aspect = CW / CH;
      const cardH = 2.2;
      const cardW = cardH * aspect;
      const geo = new THREE.BoxGeometry(cardW, cardH, 0.04, 1, 1, 1);

      const edge = new THREE.MeshStandardMaterial({ color: 0xd0d8e2, roughness: 0.3, metalness: 0.1 });
      const mats = [
        edge, edge, edge, edge,
        new THREE.MeshStandardMaterial({ map: ft, roughness: 0.12, metalness: 0.05, transparent: true }),
        new THREE.MeshStandardMaterial({ map: bt, roughness: 0.12, metalness: 0.05, transparent: true }),
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
