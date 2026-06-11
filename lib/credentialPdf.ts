/**
 * Genera un PDF con la credencial en formato ISO/IEC 7810 ID-1 (CR80)
 * Tamaño real: 85.6mm x 53.98mm
 * Usa canvas para renderizar exactamente el mismo diseño que la vista previa 3D.
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

// ======== FRONT CARD (identical to CredentialCard3D) ========
function drawFront(
  data: CredentialPdfData,
  W: number,
  H: number,
  spainImg: HTMLImageElement | null,
  photoImg: HTMLImageElement | null
): HTMLCanvasElement {
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

  // Photo (right side, 1:1 square)
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

  // Left column
  const leftW = px - 20;
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

  // Name
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

  // Code value
  c.fillStyle = "#fff";
  c.font = "bold 40px 'Segoe UI', sans-serif";
  c.fillText(data.codigo || "—", pad, iy + 50);

  // "MINISTRO DE CULTO" above gold bar
  const fh = 34;
  const labelY = H - fh - 30;
  c.fillStyle = "#f0c030";
  c.font = "bold 22px 'Segoe UI', sans-serif";
  c.textBaseline = "top";
  c.fillText("MINISTRO DE CULTO", pad, labelY);

  // Footer gold bar
  const fg = c.createLinearGradient(0, H - fh, 0, H);
  fg.addColorStop(0, "#c8920e");
  fg.addColorStop(0.5, "#f0c030");
  fg.addColorStop(1, "#c8920e");
  c.fillStyle = fg;
  c.fillRect(0, H - fh, W, fh);

  // Validez inside gold bar
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

// ======== BACK CARD (identical to CredentialCard3D) ========
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

  // Measure text to center vertically
  const mx = 36;
  const maxTW = W - mx * 2;
  const fs = 11;
  const lh = 15;

  const t1 = "El acceso de los Ministros de Culto de la Iglesia Evangélica Filadelfia a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros análogos del sector público, es libre y sin limitaciones de horarios para su asistencia religiosa (Ley 7/1980, Art. 2)";
  const t2 = "Los Ministros de Culto de las Iglesias pertenecientes a la Iglesia Evangélica Filadelfia no están obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. (Ley 24/1992, Art. 3.2)";

  c.font = `${fs}px 'Segoe UI', sans-serif`;
  const lines1 = getWrappedLines(c, t1, maxTW);
  const lines2 = getWrappedLines(c, t2, maxTW);

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

  // Paragraph 1
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

  // Paragraph 2
  c.fillStyle = "rgba(255,255,255,0.65)";
  for (const line of lines2) {
    c.fillText(line, W / 2, y);
    y += lh;
  }

  c.restore();
  return cv;
}

export async function generateCredentialPdf(data: CredentialPdfData): Promise<void> {
  // CR80 card size in mm
  const W_MM = 85.6;
  const H_MM = 53.98;

  // Use the same canvas size as the 3D preview (680x428)
  // This ensures text and elements are the same proportion
  const CW = 680;
  const CH = 428;

  // Load images
  let spainImg: HTMLImageElement | null = null;
  try { spainImg = await loadImage("/spainMap.png"); } catch { /* */ }

  let photoImg: HTMLImageElement | null = null;
  if (data.has_imagen) {
    try { photoImg = await loadImage(`/api/ministerios/${data.ministerio_id}/imagen`); } catch { /* */ }
  }

  // Draw front and back canvases at high resolution
  const frontCanvas = drawFront(data, CW, CH, spainImg, photoImg);
  const backCanvas = drawBack(CW, CH);

  // Convert canvases to data URLs
  const frontDataUrl = frontCanvas.toDataURL("image/png");
  const backDataUrl = backCanvas.toDataURL("image/png");

  // Create PDF at exact CR80 size
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [W_MM, H_MM],
  });

  // Page 1: Front - fill entire page with the canvas image
  pdf.addImage(frontDataUrl, "PNG", 0, 0, W_MM, H_MM);

  // Page 2: Back
  pdf.addPage([W_MM, H_MM], "landscape");
  pdf.addImage(backDataUrl, "PNG", 0, 0, W_MM, H_MM);

  // Save
  const timestamp = formatTimestamp();
  const filename = `${data.codigo || "CRED"}_${timestamp}.pdf`;
  pdf.save(filename);
}
