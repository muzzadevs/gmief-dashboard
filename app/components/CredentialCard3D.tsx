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


/* ── Patrón de líneas diagonales decorativas ── */
function drawDiagonalPattern(c: CanvasRenderingContext2D, W: number, H: number) {
  c.save(); c.globalAlpha = 0.04; c.strokeStyle = "#ffffff"; c.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    c.beginPath();
    c.moveTo(-W * 0.2 + i * (W / 6), 0);
    c.lineTo(i * (W / 6), H);
    c.stroke();
  }
  c.restore();
}

/* ── Gradiente de fondo azul oscuro ── */
function drawBackground(c: CanvasRenderingContext2D, W: number, H: number) {
  const bg = c.createLinearGradient(0, 0, W * 0.6, H);
  bg.addColorStop(0, "#0d1b2a"); bg.addColorStop(0.5, "#1b2d4f"); bg.addColorStop(1, "#0d1b2a");
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  drawDiagonalPattern(c, W, H);
}

/* ── Línea dorada horizontal ── */
function drawGoldLine(c: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, "#c8920e"); g.addColorStop(0.4, "#d4a017");
  g.addColorStop(0.6, "#e8c547"); g.addColorStop(0.8, "#d4a017"); g.addColorStop(1, "#c8920e");
  c.save(); c.globalAlpha = 0.8; c.fillStyle = g;
  c.fillRect(x, y, w, 3); c.restore();
}

/* ── Footer gradient ── */
function drawFooterGradient(c: CanvasRenderingContext2D, W: number, H: number, fh: number) {
  const g = c.createLinearGradient(0, H - fh, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.4, "rgba(0,0,0,0.6)"); g.addColorStop(1, "rgba(0,0,0,0.85)");
  c.fillStyle = g; c.fillRect(0, H - fh, W, fh);
}

/* ═══════════════════════════════════════════
   DRAW FRONT (Canvas)
   ═══════════════════════════════════════════ */
async function drawFront(
  data: CredentialData, W: number, H: number,
  spainImg: HTMLImageElement | null, photoImg: HTMLImageElement | null, logoImg: HTMLImageElement | null
): Promise<HTMLCanvasElement> {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!; const R = 16; const pad = 20;
  c.clearRect(0, 0, W, H);
  c.save(); roundRect(c, 0, 0, W, H, R); c.clip();

  drawBackground(c, W, H);

  // Mapa de España marca de agua
  if (spainImg) {
    c.save(); c.globalAlpha = 0.04;
    const mh = H * 0.65; const mw = mh * (spainImg.width / spainImg.height);
    c.drawImage(spainImg, W - mw + 10, H * 0.12, mw, mh);
    c.restore();
  }

  // ── HEADER: Logo + nombre org ──
  if (logoImg) {
    const lh = 44; const lw = lh * (logoImg.width / logoImg.height);
    c.drawImage(logoImg, pad, 12, lw, lh);
  }
  c.fillStyle = "rgba(255,255,255,0.7)"; c.font = "bold 10px 'Segoe UI', sans-serif";
  c.textAlign = "right"; c.textBaseline = "top";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", W - pad, 18);
  c.textAlign = "left";

  // ── Línea dorada ──
  drawGoldLine(c, pad, 60, W - pad * 2);

  // ── Título MINISTRO DE CULTO ──
  c.fillStyle = "#d4a017"; c.font = "800 20px 'Segoe UI', sans-serif";
  c.textAlign = "center"; c.textBaseline = "top";
  c.fillText("MINISTRO DE CULTO", W / 2, 70);
  c.textAlign = "left";

  // ── Foto ──
  const pw = 120, ph = 144, px = pad, py = 100;
  c.save();
  roundRect(c, px, py, pw, ph, 8);
  c.fillStyle = "#2a3a5a"; c.fill();
  // Borde dorado
  c.strokeStyle = "rgba(212,160,23,0.5)"; c.lineWidth = 2; c.stroke();
  if (photoImg) {
    c.clip(); c.drawImage(photoImg, px, py, pw, ph);
  } else {
    const fn = `${data.nombre} ${data.apellidos || ""}`.trim();
    c.fillStyle = "rgba(255,255,255,0.4)"; c.font = "bold 48px 'Segoe UI', sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(fn[0], px + pw / 2, py + ph / 2);
    c.textAlign = "left"; c.textBaseline = "top";
  }
  c.restore();


  // ── Campos de datos ──
  const fx = px + pw + 16; const fw = W - fx - pad;
  const expiry = formatExpiryDate();
  const docId = data.dni || data.nie || "\u2014";
  const fullName = `${data.nombre} ${data.apellidos || ""}`.trim();
  let fy = 106;

  // Label helper
  const drawLabel = (label: string, y: number) => {
    c.fillStyle = "rgba(212,160,23,0.7)"; c.font = "600 7px 'Segoe UI', sans-serif";
    c.fillText(label, fx, y);
  };

  // Nombre y Apellidos
  drawLabel("NOMBRE Y APELLIDOS", fy);
  c.fillStyle = "#ffffff"; c.font = "bold 16px 'Segoe UI', sans-serif";
  // Truncar si es muy largo
  let nameText = fullName;
  while (c.measureText(nameText).width > fw && nameText.length > 3) nameText = nameText.slice(0, -1);
  if (nameText !== fullName) nameText += "\u2026";
  c.fillText(nameText, fx, fy + 10);
  fy += 36;

  // DNI + Código en fila
  const colW = (fw - 16) / 2;
  drawLabel("DNI / NIE", fy);
  c.fillStyle = "rgba(255,255,255,0.9)"; c.font = "600 13px 'Segoe UI', sans-serif";
  c.fillText(docId, fx, fy + 10);

  c.fillStyle = "rgba(212,160,23,0.7)"; c.font = "600 7px 'Segoe UI', sans-serif";
  c.fillText("N\u00ba CREDENCIAL", fx + colW + 16, fy);
  c.fillStyle = "#ffffff"; c.font = "bold 13px 'Courier New', monospace";
  c.fillText(data.codigo || "\u2014", fx + colW + 16, fy + 10);
  fy += 34;

  // Iglesia + Zona
  drawLabel("IGLESIA", fy);
  c.fillStyle = "rgba(255,255,255,0.85)"; c.font = "500 11px 'Segoe UI', sans-serif";
  let igText = data.iglesia_nombre;
  const zonaStr = ` \u00b7 [${data.zona_codigo}] ${data.zona_nombre}`;
  while (c.measureText(igText + zonaStr).width > fw && igText.length > 3) igText = igText.slice(0, -1);
  if (igText !== data.iglesia_nombre) igText += "\u2026";
  c.fillText(igText, fx, fy + 10);
  c.fillStyle = "rgba(212,160,23,0.6)"; c.font = "600 10px 'Segoe UI', sans-serif";
  c.fillText(zonaStr, fx + c.measureText(igText).width + 2, fy + 10);

  // ── FOOTER ──
  const fh = 44;
  drawFooterGradient(c, W, H, fh);

  // Cita bíblica
  c.fillStyle = "rgba(212,160,23,0.7)"; c.font = "italic 8px 'Segoe UI', sans-serif";
  c.textBaseline = "bottom";
  c.fillText("\u201cId por todo el mundo y predicad el evangelio", pad, H - 16);
  c.fillText('a toda criatura\u201d', pad, H - 6);
  c.fillStyle = "rgba(255,255,255,0.5)"; c.font = "600 8px 'Segoe UI', sans-serif";
  c.fillText("Marcos 16:15", pad + c.measureText('a toda criatura\u201d  ').width, H - 6);

  // Caducidad + CIF
  c.textAlign = "right";
  c.fillStyle = "rgba(255,255,255,0.5)"; c.font = "600 9px 'Segoe UI', sans-serif";
  c.fillText("Caduca: " + expiry, W - pad, H - 16);
  c.fillStyle = "rgba(255,255,255,0.3)"; c.font = "500 7px 'Segoe UI', sans-serif";
  c.fillText("CIF R480047J", W - pad, H - 6);

  c.restore();
  return cv;
}


/* ═══════════════════════════════════════════
   DRAW BACK (Canvas)
   ═══════════════════════════════════════════ */
function drawBack(W: number, H: number, logoImg: HTMLImageElement | null): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!; const R = 16;
  c.clearRect(0, 0, W, H);
  c.save(); roundRect(c, 0, 0, W, H, R); c.clip();

  drawBackground(c, W, H);

  // Logo superior tenue
  if (logoImg) {
    const lh = 28; const lw = lh * (logoImg.width / logoImg.height);
    c.save(); c.globalAlpha = 0.25;
    c.drawImage(logoImg, (W - lw) / 2, 12, lw, lh);
    c.restore();
  }

  // Título
  c.textAlign = "center"; c.textBaseline = "top";
  c.fillStyle = "#d4a017"; c.font = "800 16px 'Segoe UI', sans-serif";
  c.fillText("EXTRACTOS DE LEY", W / 2, 48);

  c.fillStyle = "rgba(255,255,255,0.45)"; c.font = "600 8px 'Segoe UI', sans-serif";
  c.fillText("Ley 7/1980 de Libertad Religiosa  \u2022  Ley 24/1992 Acuerdo Iglesia-Estado", W / 2, 70);

  // Separador dorado
  const sg = c.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
  sg.addColorStop(0, "transparent"); sg.addColorStop(0.5, "rgba(200,146,14,0.5)"); sg.addColorStop(1, "transparent");
  c.strokeStyle = sg; c.lineWidth = 1;
  c.beginPath(); c.moveTo(W * 0.2, 84); c.lineTo(W * 0.8, 84); c.stroke();

  // Textos legales
  const mx = 30; const maxTW = W - mx * 2;
  const fs = 10; const lh = 14;
  const t1 = "El acceso de los Ministros de Culto de la Iglesia Evang\u00e9lica Filadelfia a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros an\u00e1logos del sector p\u00fablico, es libre y sin limitaciones de horarios para su asistencia religiosa (Ley 7/1980, Art. 2)";
  const t2 = "Los Ministros de Culto de las Iglesias pertenecientes a la Iglesia Evang\u00e9lica Filadelfia no est\u00e1n obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. (Ley 24/1992, Art. 3.2)";

  c.font = `${fs}px 'Segoe UI', sans-serif`;
  const lines1 = getWrappedLines(c, t1, maxTW);
  const lines2 = getWrappedLines(c, t2, maxTW);

  let y = 94;
  c.fillStyle = "rgba(255,255,255,0.75)";
  for (const line of lines1) { c.fillText(line, W / 2, y); y += lh; }
  y += 6;

  // Separador tenue
  const sg2 = c.createLinearGradient(W * 0.3, 0, W * 0.7, 0);
  sg2.addColorStop(0, "transparent"); sg2.addColorStop(0.5, "rgba(255,255,255,0.15)"); sg2.addColorStop(1, "transparent");
  c.strokeStyle = sg2;
  c.beginPath(); c.moveTo(W * 0.3, y); c.lineTo(W * 0.7, y); c.stroke();
  y += 8;

  c.fillStyle = "rgba(255,255,255,0.75)";
  for (const line of lines2) { c.fillText(line, W / 2, y); y += lh; }

  // Footer
  const fh = 28;
  const fg = c.createLinearGradient(0, H - fh, 0, H);
  fg.addColorStop(0, "rgba(0,0,0,0)"); fg.addColorStop(1, "rgba(0,0,0,0.7)");
  c.fillStyle = fg; c.fillRect(0, H - fh, W, fh);

  c.fillStyle = "rgba(255,255,255,0.35)"; c.font = "600 8px 'Segoe UI', sans-serif";
  c.textBaseline = "bottom";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", W / 2, H - 6);

  c.restore();
  return cv;
}


/* ═══════════════════════════════════════════
   COMPONENTE REACT 3D
   ═══════════════════════════════════════════ */
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

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 1.2);
    dl.position.set(2, 3, 4); scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xc8b8ff, 0.3);
    dl2.position.set(-3, -1, 2); scene.add(dl2);

    try {
      const CW = 680; const CH = 428;

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

      const edge = new THREE.MeshStandardMaterial({ color: 0x1a2d4f, roughness: 0.3, metalness: 0.15 });
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

