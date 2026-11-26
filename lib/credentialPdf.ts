/**
 * Genera un PDF con la credencial en formato ISO/IEC 7810 ID-1 (CR80)
 * Tamaño real: 85.6mm x 53.98mm
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
  iglesia_nombre?: string;
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

/* ── Patrón de líneas diagonales ── */
function drawDiagonalPattern(c: CanvasRenderingContext2D, W: number, H: number) {
  c.save(); c.globalAlpha = 0.04; c.strokeStyle = "#ffffff"; c.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    c.beginPath(); c.moveTo(-W * 0.2 + i * (W / 6), 0); c.lineTo(i * (W / 6), H); c.stroke();
  }
  c.restore();
}

/* ── Gradiente de fondo ── */
function drawBackground(c: CanvasRenderingContext2D, W: number, H: number) {
  const bg = c.createLinearGradient(0, 0, W * 0.6, H);
  bg.addColorStop(0, "#0d1b2a"); bg.addColorStop(0.5, "#1b2d4f"); bg.addColorStop(1, "#0d1b2a");
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  drawDiagonalPattern(c, W, H);
}

/* ── Línea dorada ── */
function drawGoldLine(c: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, "#c8920e"); g.addColorStop(0.4, "#d4a017");
  g.addColorStop(0.6, "#e8c547"); g.addColorStop(0.8, "#d4a017"); g.addColorStop(1, "#c8920e");
  c.save(); c.globalAlpha = 0.8; c.fillStyle = g; c.fillRect(x, y, w, 3); c.restore();
}

/* ── Footer gradient ── */
function drawFooterGradient(c: CanvasRenderingContext2D, W: number, H: number, fh: number) {
  const g = c.createLinearGradient(0, H - fh, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.4, "rgba(0,0,0,0.6)"); g.addColorStop(1, "rgba(0,0,0,0.85)");
  c.fillStyle = g; c.fillRect(0, H - fh, W, fh);
}


/* ═══════════════════════════════════════════
   DRAW FRONT (PDF Canvas)
   ═══════════════════════════════════════════ */
function drawFront(
  data: CredentialPdfData, W: number, H: number,
  spainImg: HTMLImageElement | null, photoImg: HTMLImageElement | null, logoImg: HTMLImageElement | null
): HTMLCanvasElement {
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

  // ── HEADER ──
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

  // ── Título ──
  c.fillStyle = "#d4a017"; c.font = "800 20px 'Segoe UI', sans-serif";
  c.textAlign = "center"; c.textBaseline = "top";
  c.fillText("MINISTRO DE CULTO", W / 2, 70);
  c.textAlign = "left";

  // ── Foto ──
  const pw = 120, ph = 144, px = pad, py = 100;
  c.save();
  roundRect(c, px, py, pw, ph, 8);
  c.fillStyle = "#2a3a5a"; c.fill();
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
  const iglesiaName = data.iglesia_nombre || "";
  let fy = 106;

  const drawLabel = (label: string, y: number) => {
    c.fillStyle = "rgba(212,160,23,0.7)"; c.font = "600 7px 'Segoe UI', sans-serif";
    c.fillText(label, fx, y);
  };

  // Nombre y Apellidos
  drawLabel("NOMBRE Y APELLIDOS", fy);
  c.fillStyle = "#ffffff"; c.font = "bold 16px 'Segoe UI', sans-serif";
  let nameText = fullName;
  while (c.measureText(nameText).width > fw && nameText.length > 3) nameText = nameText.slice(0, -1);
  if (nameText !== fullName) nameText += "\u2026";
  c.fillText(nameText, fx, fy + 10);
  fy += 36;

  // DNI + Código
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
  let igText = iglesiaName;
  const zonaStr = ` \u00b7 [${data.zona_codigo}] ${data.zona_nombre}`;
  while (c.measureText(igText + zonaStr).width > fw && igText.length > 3) igText = igText.slice(0, -1);
  if (igText !== iglesiaName) igText += "\u2026";
  c.fillText(igText, fx, fy + 10);
  c.fillStyle = "rgba(212,160,23,0.6)"; c.font = "600 10px 'Segoe UI', sans-serif";
  c.fillText(zonaStr, fx + c.measureText(igText).width + 2, fy + 10);

  // ── FOOTER ──
  const fh = 44;
  drawFooterGradient(c, W, H, fh);

  c.fillStyle = "rgba(212,160,23,0.7)"; c.font = "italic 8px 'Segoe UI', sans-serif";
  c.textBaseline = "bottom";
  c.fillText("\u201cId por todo el mundo y predicad el evangelio", pad, H - 16);
  c.fillText('a toda criatura\u201d', pad, H - 6);
  c.fillStyle = "rgba(255,255,255,0.5)"; c.font = "600 8px 'Segoe UI', sans-serif";
  c.fillText("Marcos 16:15", pad + c.measureText('a toda criatura\u201d  ').width, H - 6);

  c.textAlign = "right";
  c.fillStyle = "rgba(255,255,255,0.5)"; c.font = "600 9px 'Segoe UI', sans-serif";
  c.fillText("Caduca: " + expiry, W - pad, H - 16);
  c.fillStyle = "rgba(255,255,255,0.3)"; c.font = "500 7px 'Segoe UI', sans-serif";
  c.fillText("CIF R480047J", W - pad, H - 6);

  c.restore();
  return cv;
}


/* ═══════════════════════════════════════════
   DRAW BACK (PDF Canvas)
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

  const sg2 = c.createLinearGradient(W * 0.3, 0, W * 0.7, 0);
  sg2.addColorStop(0, "transparent"); sg2.addColorStop(0.5, "rgba(255,255,255,0.15)"); sg2.addColorStop(1, "transparent");
  c.strokeStyle = sg2;
  c.beginPath(); c.moveTo(W * 0.3, y); c.lineTo(W * 0.7, y); c.stroke();
  y += 8;

  c.fillStyle = "rgba(255,255,255,0.75)";
  for (const line of lines2) { c.fillText(line, W / 2, y); y += lh; }

  // Footer
  const fhb = 28;
  const fg = c.createLinearGradient(0, H - fhb, 0, H);
  fg.addColorStop(0, "rgba(0,0,0,0)"); fg.addColorStop(1, "rgba(0,0,0,0.7)");
  c.fillStyle = fg; c.fillRect(0, H - fhb, W, fhb);

  c.fillStyle = "rgba(255,255,255,0.35)"; c.font = "600 8px 'Segoe UI', sans-serif";
  c.textBaseline = "bottom";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", W / 2, H - 6);

  c.restore();
  return cv;
}


/* ═══════════════════════════════════════════
   GENERATE PDF
   ═══════════════════════════════════════════ */
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

