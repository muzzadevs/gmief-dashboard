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
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null
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
    c.save();
    c.globalAlpha = 0.9;
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

// ======== BACK CARD (identical to CredentialCard3D) ========
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

  // Paragraph 1
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

  // Paragraph 2
  c.fillStyle = "rgba(255,255,255,0.6)";
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

  let logoImg: HTMLImageElement | null = null;
  try { logoImg = await loadImage("/TEMPLOGOIEF.png"); } catch { /* */ }

  // Draw front and back canvases at high resolution
  const frontCanvas = drawFront(data, CW, CH, spainImg, photoImg, logoImg);
  const backCanvas = drawBack(CW, CH, logoImg);

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
