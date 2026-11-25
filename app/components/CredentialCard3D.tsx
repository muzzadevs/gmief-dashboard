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

function drawWavyLines(c: CanvasRenderingContext2D, W: number, H: number) {
  c.save();
  c.globalAlpha = 0.07;
  c.strokeStyle = "#8a9bb5";
  c.lineWidth = 1.2;
  for (const f of [0.18, 0.35, 0.52, 0.68, 0.84]) {
    c.beginPath();
    c.moveTo(0, H * f);
    c.quadraticCurveTo(W * 0.25, H * (f - 0.06), W * 0.5, H * f);
    c.quadraticCurveTo(W * 0.75, H * (f + 0.06), W, H * (f + 0.04));
    c.stroke();
  }
  c.restore();
}

function drawFooterCurve(c: CanvasRenderingContext2D, W: number, H: number, fh: number) {
  c.save();
  c.fillStyle = "#0c1929";
  c.beginPath();
  c.moveTo(0, H - fh + fh * 0.35);
  c.quadraticCurveTo(W * 0.35, H - fh, W * 0.55, H - fh + fh * 0.25);
  c.quadraticCurveTo(W * 0.75, H - fh + fh * 0.5, W, H - fh + fh * 0.1);
  c.lineTo(W, H);
  c.lineTo(0, H);
  c.closePath();
  c.fill();
  c.restore();
}

async function drawFront(
  data: CredentialData, W: number, H: number,
  spainImg: HTMLImageElement | null, photoImg: HTMLImageElement | null, logoImg: HTMLImageElement | null
): Promise<HTMLCanvasElement> {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!; const R = 20;
  c.clearRect(0, 0, W, H);
  c.save(); roundRect(c, 0, 0, W, H, R); c.clip();

  // Background
  c.fillStyle = "#f0ede6"; c.fillRect(0, 0, W, H);
  drawWavyLines(c, W, H);

  // Spain map watermark
  if (spainImg) {
    c.save(); c.globalAlpha = 0.08;
    const mh = H * 0.6; const mw = mh * (spainImg.width / spainImg.height);
    c.drawImage(spainImg, W - mw - 10, H * 0.25, mw, mh);
    c.restore();
  }

  const pad = 24;
  // Logo
  if (logoImg) {
    const lh = 56; const lw = lh * (logoImg.width / logoImg.height);
    c.drawImage(logoImg, pad, 14, lw, lh);
  }
  // CIF
  c.fillStyle = "rgba(26,45,80,0.5)"; c.font = "600 10px 'Segoe UI', sans-serif";
  c.textBaseline = "top"; c.fillText("CIF R480047J", pad, 74);

  // Right column: values
  c.textAlign = "right"; c.fillStyle = "rgba(26,45,80,0.35)";
  c.font = "600 8px 'Segoe UI', sans-serif";
  const vals = ["FE", "SERVICIO", "COMUNIDAD", "ESPERANZA"];
  vals.forEach((v, i) => { c.fillText(v, W - pad, 18 + i * 14); });
  // Gold vertical line
  c.save(); c.globalAlpha = 0.5;
  c.strokeStyle = "#c8920e"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(W - pad - 60, 16); c.lineTo(W - pad - 60, 16 + 52); c.stroke();
  c.restore();
  c.textAlign = "left";

  // MINISTRO DE CULTO
  const titleX = pad + 170;
  c.fillStyle = "#0c1929"; c.font = "bold 22px 'Segoe UI', sans-serif";
  c.fillText("MINISTRO DE CULTO", titleX, 92);

  // Photo
  const pw = 136, ph = 156, px = pad, py = 110;
  c.save(); roundRect(c, px, py, pw, ph, 8);
  c.fillStyle = "#ddd"; c.fill();
  c.strokeStyle = "#bbb"; c.lineWidth = 1; c.stroke();
  if (photoImg) { c.clip(); c.drawImage(photoImg, px, py, pw, ph); }
  else {
    const fn = `${data.nombre} ${data.apellidos || ""}`.trim();
    c.fillStyle = "#999"; c.font = "bold 52px 'Segoe UI', sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(fn[0], px + pw/2, py + ph/2);
    c.textAlign = "left"; c.textBaseline = "top";
  }
  c.restore();

  // Fields
  const fx = px + pw + 16; const fw = W - fx - pad - 60;
  const fields: [string, string, number][] = [
    ["NOMBRE Y APELLIDOS", `${data.nombre} ${data.apellidos || ""}`.trim(), 14],
    ["DNI", data.dni || data.nie || "\u2014", 12],
    ["N\u00daMERO DE CREDENCIAL", data.codigo || "\u2014", 15],
    ["FECHA DE CADUCIDAD", formatExpiryDate(), 12],
  ];
  let fy = 118;
  for (const [label, value, fs] of fields) {
    c.fillStyle = "#1a2d50"; c.font = `bold 8px 'Segoe UI', sans-serif`;
    c.fillText(label, fx, fy);
    // Field bg
    c.fillStyle = "rgba(200,200,210,0.35)";
    roundRect(c, fx, fy + 10, fw, 18, 4); c.fill();
    c.fillStyle = "#0c1929";
    c.font = label === "N\u00daMERO DE CREDENCIAL" ? `bold ${fs}px 'Courier New', monospace` : `600 ${fs}px 'Segoe UI', sans-serif`;
    c.fillText(value, fx + 8, fy + 24);
    fy += 36;
  }

  // AL SERVICIO DEL EVANGELIO
  c.fillStyle = "rgba(26,45,80,0.3)"; c.font = "600 9px 'Segoe UI', sans-serif";
  c.textAlign = "right";
  c.fillText("AL SERVICIO", W - pad, H - 80);
  c.fillText("DEL EVANGELIO", W - pad, H - 68);
  c.textAlign = "left";

  // Footer
  const fh = 48;
  drawFooterCurve(c, W, H, fh);
  // Bible verse
  c.fillStyle = "#c8920e"; c.font = "italic 8px 'Segoe UI', sans-serif";
  c.fillText('\u201cId por todo el mundo y predicad el evangelio', pad, H - 22);
  c.fillText('a toda criatura\u201d  Marcos 16:15', pad, H - 11);
  // Separator
  c.strokeStyle = "rgba(255,255,255,0.25)"; c.lineWidth = 0.5;
  c.beginPath(); c.moveTo(W * 0.55, H - 32); c.lineTo(W * 0.55, H - 8); c.stroke();
  // Church name
  c.fillStyle = "rgba(255,255,255,0.7)"; c.font = "600 9px 'Segoe UI', sans-serif";
  c.textAlign = "right";
  c.fillText("IGLESIA EVANG\u00c9LICA", W - pad, H - 20);
  c.fillText("FILADELFIA", W - pad, H - 9);

  c.restore();
  return cv;
}

function drawBack(W: number, H: number, logoImg: HTMLImageElement | null): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!; const R = 20;
  c.clearRect(0, 0, W, H);
  c.save(); roundRect(c, 0, 0, W, H, R); c.clip();

  // Background
  c.fillStyle = "#f0ede6"; c.fillRect(0, 0, W, H);
  drawWavyLines(c, W, H);

  // Logo at top
  if (logoImg) {
    const lh = 32; const lw = lh * (logoImg.width / logoImg.height);
    c.save(); c.globalAlpha = 0.35;
    c.drawImage(logoImg, (W - lw) / 2, 14, lw, lh);
    c.restore();
  }

  // Text content
  const mx = 36; const maxTW = W - mx * 2;
  const fs = 11; const lh = 15;
  const t1 = "El acceso de los Ministros de Culto de la Iglesia Evang\u00e9lica Filadelfia a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros an\u00e1logos del sector p\u00fablico, es libre y sin limitaciones de horarios para su asistencia religiosa (Ley 7/1980, Art. 2)";
  const t2 = "Los Ministros de Culto de las Iglesias pertenecientes a la Iglesia Evang\u00e9lica Filadelfia no est\u00e1n obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. (Ley 24/1992, Art. 3.2)";
  c.font = `${fs}px 'Segoe UI', sans-serif`;
  const lines1 = getWrappedLines(c, t1, maxTW);
  const lines2 = getWrappedLines(c, t2, maxTW);

  const logoSpace = logoImg ? 50 : 10;
  const titleH = 20; const subtitleH = 13; const sepH = 1;
  const gapSmall = 6; const gapMed = 8;
  const p1H = lines1.length * lh; const p2H = lines2.length * lh;
  const contentH = titleH + gapSmall + subtitleH + gapMed + sepH + gapMed + p1H + gapMed + sepH + gapMed + p2H;
  let y = logoSpace + (H - logoSpace - contentH - 30) / 2;

  c.fillStyle = "#0c1929"; c.font = "bold 17px 'Segoe UI', sans-serif";
  c.textAlign = "center"; c.textBaseline = "top";
  c.fillText("EXTRACTOS DE LEY", W / 2, y);
  y += titleH + gapSmall;

  c.fillStyle = "#5a6a7a"; c.font = "10px 'Segoe UI', sans-serif";
  c.fillText("Ley 7/1980 de Libertad Religiosa  \u2022  Ley 24/1992 Acuerdo Iglesia-Estado", W / 2, y);
  y += subtitleH + gapMed;

  // Gold separator
  const sg = c.createLinearGradient(W * 0.15, 0, W * 0.85, 0);
  sg.addColorStop(0, "transparent"); sg.addColorStop(0.5, "rgba(200,146,14,0.5)"); sg.addColorStop(1, "transparent");
  c.strokeStyle = sg; c.lineWidth = 1;
  c.beginPath(); c.moveTo(W * 0.15, y); c.lineTo(W * 0.85, y); c.stroke();
  y += sepH + gapMed;

  c.fillStyle = "#2a3a50"; c.font = `${fs}px 'Segoe UI', sans-serif`;
  c.textAlign = "center";
  for (const line of lines1) { c.fillText(line, W / 2, y); y += lh; }
  y += gapMed;

  const sg2 = c.createLinearGradient(W * 0.25, 0, W * 0.75, 0);
  sg2.addColorStop(0, "transparent"); sg2.addColorStop(0.5, "rgba(26,45,80,0.2)"); sg2.addColorStop(1, "transparent");
  c.strokeStyle = sg2;
  c.beginPath(); c.moveTo(W * 0.25, y); c.lineTo(W * 0.75, y); c.stroke();
  y += sepH + gapMed;

  c.fillStyle = "#2a3a50";
  for (const line of lines2) { c.fillText(line, W / 2, y); y += lh; }

  // Footer
  const fh = 30;
  drawFooterCurve(c, W, H, fh);
  c.fillStyle = "rgba(255,255,255,0.6)"; c.font = "600 9px 'Segoe UI', sans-serif";
  c.textAlign = "center";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", W / 2, H - 12);

  c.restore();
  return cv;
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
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth;
    const h = Math.min(w * 0.6, 440);

    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.setSize(w, h);
    ren.setClearColor(0x000000, 0);
    ren.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(ren.domElement);
    rendererRef.current = ren;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(35, w / h, 0.1, 50);
    cam.position.set(0, 0, 6);
    cameraRef.current = cam;

    const a = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(a);
    const d1 = new THREE.DirectionalLight(0xfff8e1, 0.9);
    d1.position.set(3, 4, 5);
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

      const cardW = 3.6;
      const cardH = cardW / (85.6 / 53.98);
      const geo = new THREE.BoxGeometry(cardW, cardH, 0.025);

      const edge = new THREE.MeshStandardMaterial({ color: 0xd4cfc5, roughness: 0.4, metalness: 0.1 });
      const mats = [
        edge, edge, edge, edge,
        new THREE.MeshStandardMaterial({ map: ft, roughness: 0.15, metalness: 0.05, transparent: true }),
        new THREE.MeshStandardMaterial({ map: bt, roughness: 0.15, metalness: 0.05, transparent: true }),
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
