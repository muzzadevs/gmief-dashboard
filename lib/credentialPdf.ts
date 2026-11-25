/**
 * Genera un PDF con la credencial en formato ISO/IEC 7810 ID-1 (CR80)
 * Tama\u00f1o real: 85.6mm x 53.98mm
 */

import jsPDF from "jspdf";

export type CredentialPdfData = {
  nombre: string;
  apellidos: string | null;
  codigo: string | null;
  dni: string | null;
  nie: string | null;
  zona_nombre: string;
  zona_codigo: string;
  has_imagen: boolean;
  ministerio_id: number;
  imageDataUrl?: string | null;
};

function formatExpiryDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatTimestamp(): string {
  const d = new Date();
  return d.toISOString().replace(/[-:T]/g, "").slice(0, 14);
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
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" "); const lines: string[] = []; let line = "";
  for (const w of words) {
    const t = line + w + " ";
    if (ctx.measureText(t).width > maxW && line) { lines.push(line.trim()); line = w + " "; }
    else { line = t; }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function drawWavyLines(c: CanvasRenderingContext2D, W: number, H: number) {
  c.save(); c.globalAlpha = 0.07; c.strokeStyle = "#8a9bb5"; c.lineWidth = 1.2;
  for (const f of [0.18, 0.35, 0.52, 0.68, 0.84]) {
    c.beginPath(); c.moveTo(0, H * f);
    c.quadraticCurveTo(W * 0.25, H * (f - 0.06), W * 0.5, H * f);
    c.quadraticCurveTo(W * 0.75, H * (f + 0.06), W, H * (f + 0.04));
    c.stroke();
  }
  c.restore();
}

function drawFooterCurve(c: CanvasRenderingContext2D, W: number, H: number, fh: number) {
  c.save(); c.fillStyle = "#0c1929";
  c.beginPath();
  c.moveTo(0, H - fh + fh * 0.35);
  c.quadraticCurveTo(W * 0.35, H - fh, W * 0.55, H - fh + fh * 0.25);
  c.quadraticCurveTo(W * 0.75, H - fh + fh * 0.5, W, H - fh + fh * 0.1);
  c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  c.restore();
}

function drawFront(
  data: CredentialPdfData, W: number, H: number,
  spainImg: HTMLImageElement | null, photoImg: HTMLImageElement | null, logoImg: HTMLImageElement | null
): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!; const R = 20;
  c.clearRect(0, 0, W, H);
  c.save(); roundRect(c, 0, 0, W, H, R); c.clip();

  c.fillStyle = "#f0ede6"; c.fillRect(0, 0, W, H);
  drawWavyLines(c, W, H);

  if (spainImg) {
    c.save(); c.globalAlpha = 0.08;
    const mh = H * 0.6; const mw = mh * (spainImg.width / spainImg.height);
    c.drawImage(spainImg, W - mw - 10, H * 0.25, mw, mh);
    c.restore();
  }

  const pad = 24;
  if (logoImg) {
    const lh = 56; const lw = lh * (logoImg.width / logoImg.height);
    c.drawImage(logoImg, pad, 14, lw, lh);
  }
  c.fillStyle = "rgba(26,45,80,0.5)"; c.font = "600 10px 'Segoe UI', sans-serif";
  c.textBaseline = "top"; c.fillText("CIF R480047J", pad, 74);

  c.textAlign = "right"; c.fillStyle = "rgba(26,45,80,0.35)";
  c.font = "600 8px 'Segoe UI', sans-serif";
  ["FE","SERVICIO","COMUNIDAD","ESPERANZA"].forEach((v, i) => { c.fillText(v, W - pad, 18 + i * 14); });
  c.save(); c.globalAlpha = 0.5; c.strokeStyle = "#c8920e"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(W - pad - 60, 16); c.lineTo(W - pad - 60, 68); c.stroke(); c.restore();
  c.textAlign = "left";

  const titleX = pad + 170;
  c.fillStyle = "#0c1929"; c.font = "bold 22px 'Segoe UI', sans-serif";
  c.fillText("MINISTRO DE CULTO", titleX, 92);

  const pw = 136, ph = 156, px = pad, py = 110;
  c.save(); roundRect(c, px, py, pw, ph, 8);
  c.fillStyle = "#ddd"; c.fill(); c.strokeStyle = "#bbb"; c.lineWidth = 1; c.stroke();
  if (photoImg) { c.clip(); c.drawImage(photoImg, px, py, pw, ph); }
  else {
    const fn = `${data.nombre} ${data.apellidos || ""}`.trim();
    c.fillStyle = "#999"; c.font = "bold 52px 'Segoe UI', sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(fn[0], px + pw/2, py + ph/2);
    c.textAlign = "left"; c.textBaseline = "top";
  }
  c.restore();

  const fx = px + pw + 16; const fw = W - fx - pad - 60;
  const fields: [string, string, number][] = [
    ["NOMBRE Y APELLIDOS", `${data.nombre} ${data.apellidos || ""}`.trim(), 14],
    ["DNI", data.dni || data.nie || "\u2014", 12],
    ["N\u00daMERO DE CREDENCIAL", data.codigo || "\u2014", 15],
    ["FECHA DE CADUCIDAD", formatExpiryDate(), 12],
  ];
  let fy = 118;
  for (const [label, value, fs] of fields) {
    c.fillStyle = "#1a2d50"; c.font = "bold 8px 'Segoe UI', sans-serif";
    c.fillText(label, fx, fy);
    c.fillStyle = "rgba(200,200,210,0.35)";
    roundRect(c, fx, fy + 10, fw, 18, 4); c.fill();
    c.fillStyle = "#0c1929";
    c.font = label === "N\u00daMERO DE CREDENCIAL" ? `bold ${fs}px 'Courier New', monospace` : `600 ${fs}px 'Segoe UI', sans-serif`;
    c.fillText(value, fx + 8, fy + 24);
    fy += 36;
  }

  c.fillStyle = "rgba(26,45,80,0.3)"; c.font = "600 9px 'Segoe UI', sans-serif";
  c.textAlign = "right";
  c.fillText("AL SERVICIO", W - pad, H - 80);
  c.fillText("DEL EVANGELIO", W - pad, H - 68);
  c.textAlign = "left";

  const fh = 48;
  drawFooterCurve(c, W, H, fh);
  c.fillStyle = "#c8920e"; c.font = "italic 8px 'Segoe UI', sans-serif";
  c.fillText('\u201cId por todo el mundo y predicad el evangelio', pad, H - 22);
  c.fillText('a toda criatura\u201d  Marcos 16:15', pad, H - 11);
  c.strokeStyle = "rgba(255,255,255,0.25)"; c.lineWidth = 0.5;
  c.beginPath(); c.moveTo(W * 0.55, H - 32); c.lineTo(W * 0.55, H - 8); c.stroke();
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

  c.fillStyle = "#f0ede6"; c.fillRect(0, 0, W, H);
  drawWavyLines(c, W, H);

  if (logoImg) {
    const lh = 32; const lw = lh * (logoImg.width / logoImg.height);
    c.save(); c.globalAlpha = 0.35;
    c.drawImage(logoImg, (W - lw) / 2, 14, lw, lh);
    c.restore();
  }

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

  const fh = 30;
  drawFooterCurve(c, W, H, fh);
  c.fillStyle = "rgba(255,255,255,0.6)"; c.font = "600 9px 'Segoe UI', sans-serif";
  c.textAlign = "center";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", W / 2, H - 12);

  c.restore();
  return cv;
}

export async function generateCredentialPdf(data: CredentialPdfData): Promise<void> {
  const W_MM = 85.6; const H_MM = 53.98;
  const CW = 680; const CH = 428;

  let spainImg: HTMLImageElement | null = null;
  try { spainImg = await loadImage("/spainMap.png"); } catch { /* */ }
  let photoImg: HTMLImageElement | null = null;
  if (data.has_imagen) {
    try { photoImg = await loadImage(`/api/ministerios/${data.ministerio_id}/imagen`); } catch { /* */ }
  }
  let logoImg: HTMLImageElement | null = null;
  try { logoImg = await loadImage("/TEMPLOGOIEF.png"); } catch { /* */ }

  const frontCanvas = drawFront(data, CW, CH, spainImg, photoImg, logoImg);
  const backCanvas = drawBack(CW, CH, logoImg);

  const frontDataUrl = frontCanvas.toDataURL("image/png");
  const backDataUrl = backCanvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [W_MM, H_MM] });
  pdf.addImage(frontDataUrl, "PNG", 0, 0, W_MM, H_MM);
  pdf.addPage([W_MM, H_MM], "landscape");
  pdf.addImage(backDataUrl, "PNG", 0, 0, W_MM, H_MM);

  const timestamp = formatTimestamp();
  const filename = `${data.codigo || "CRED"}_${timestamp}.pdf`;
  pdf.save(filename);
}
