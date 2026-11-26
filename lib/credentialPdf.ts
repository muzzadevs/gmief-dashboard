import jsPDF from "jspdf";

const NAVY = "#1a2d50";
const LABEL = "#7a8ca3";
const SEP = "#d0d8e2";
const BODY = "#1e293b";

export interface PdfData {
  nombre: string;
  apellidos: string | null;
  codigo: string | null;
  dni: string | null;
  nie: string | null;
  zona_nombre: string;
  zona_codigo: string;
  has_imagen: boolean;
  ministerio_id: number;
  iglesia_nombre: string;
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

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r); c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r); c.closePath();
}

function getWrappedLines(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line + w + " ";
    if (c.measureText(t).width > maxW && line) { lines.push(line.trim()); line = w + " "; }
    else { line = t; }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

/* ═══════════════════════════════════════════
   DRAW FRONT (Canvas para PDF)
   ═══════════════════════════════════════════ */
async function drawFront(
  data: PdfData, W: number, H: number,
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

  // Mapa de España marca de agua
  if (spainImg) {
    c.save(); c.globalAlpha = 0.07;
    const mh = H * 0.55;
    const mw = mh * (spainImg.width / spainImg.height);
    c.drawImage(spainImg, W - mw - 10, 70, mw, mh);
    c.restore();
  }

  // ── HEADER: título grande centrado ──
  c.textAlign = "center"; c.textBaseline = "top";
  c.fillStyle = NAVY;
  c.font = "800 36px 'Segoe UI', sans-serif";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", W / 2, 18);

  // CIF con líneas
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

  // ── FOTO ──
  const pw = 170, ph = 204, px = pad, py = 86;
  c.save();
  roundRect(c, px, py, pw, ph, 6);
  c.fillStyle = "#e8ecf0"; c.fill();
  c.strokeStyle = SEP; c.lineWidth = 1.5; c.stroke();
  if (photoImg) {
    c.clip(); c.drawImage(photoImg, px, py, pw, ph);
  } else {
    c.fillStyle = "#b0bec5"; c.font = "bold 64px 'Segoe UI', sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(data.nombre[0], px + pw / 2, py + ph / 2);
  }
  c.restore();

  // ── DATOS ──
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
  drawField("V\u00c1LIDA HASTA", expiry);

  // ── BARRA AZUL: Ministro de Culto ──
  const barH = 56;
  const barY = H - 30 - barH;
  c.fillStyle = NAVY;
  c.fillRect(0, barY, W, barH);

  if (logoImg) {
    const lh = 36;
    const lw = lh * (logoImg.width / logoImg.height);
    c.save(); c.globalCompositeOperation = "screen";
    c.drawImage(logoImg, pad, barY + (barH - lh) / 2, lw, lh);
    c.restore();
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

  // ── PIE blanco: iglesia + zona ──
  const footY = barY + barH;
  c.fillStyle = "#f7f8fa";
  c.fillRect(0, footY, W, 30);
  c.strokeStyle = SEP; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, footY); c.lineTo(W, footY); c.stroke();

  c.fillStyle = LABEL; c.font = "600 10px 'Segoe UI', sans-serif";
  c.textBaseline = "middle"; c.textAlign = "left";
  c.fillText(`${data.iglesia_nombre} \u00b7 [${data.zona_codigo}] ${data.zona_nombre}`, pad, footY + 15);
  c.textAlign = "right";
  c.fillText("Caduca: " + expiry, W - pad, footY + 15);

  c.restore();
  return cv;
}


/* ═══════════════════════════════════════════
   DRAW BACK (Canvas para PDF)
   ═══════════════════════════════════════════ */
function drawBack(W: number, H: number, logoImg: HTMLImageElement | null): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!;
  const R = 16;
  c.save(); roundRect(c, 0, 0, W, H, R); c.clip();

  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, W, H);

  if (logoImg) {
    const lh = 42;
    const lw = lh * (logoImg.width / logoImg.height);
    c.drawImage(logoImg, (W - lw) / 2, 18, lw, lh);
  }

  c.textAlign = "center"; c.textBaseline = "top";
  c.fillStyle = NAVY; c.font = "800 22px 'Segoe UI', sans-serif";
  c.fillText("EXTRACTOS DE LEY", W / 2, 68);

  c.fillStyle = LABEL; c.font = "600 10px 'Segoe UI', sans-serif";
  c.fillText("Ley 7/1980 de Libertad Religiosa  \u2022  Ley 24/1992 Acuerdo Iglesia-Estado", W / 2, 96);

  c.strokeStyle = SEP; c.lineWidth = 1;
  c.beginPath(); c.moveTo(W * 0.15, 115); c.lineTo(W * 0.85, 115); c.stroke();

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

  const barH = 32;
  c.fillStyle = NAVY;
  c.fillRect(0, H - barH, W, barH);
  c.fillStyle = "rgba(255,255,255,0.5)"; c.font = "700 10px 'Segoe UI', sans-serif";
  c.textBaseline = "middle";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", W / 2, H - barH / 2);

  c.restore();
  return cv;
}

/* ═══════════════════════════════════════════
   GENERATE PDF
   ═══════════════════════════════════════════ */
export async function generateCredentialPdf(data: PdfData): Promise<void> {
  const CW = 810;
  const CH = 510;

  const [spainImg, photoImg, logoImg] = await Promise.all([
    loadImage("/spainMap.png").catch(() => null),
    data.has_imagen ? loadImage(`/api/ministerios/${data.ministerio_id}/imagen`).catch(() => null) : Promise.resolve(null),
    loadImage("/TEMPLOGOIEF.png").catch(() => null),
  ]);

  const frontCv = await drawFront(data, CW, CH, spainImg, photoImg, logoImg);
  const backCv = drawBack(CW, CH, logoImg);

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const cardAspect = CW / CH;
  const margin = 15;
  let cw = pw - margin * 2;
  let ch = cw / cardAspect;
  if (ch > ph - margin * 2) { ch = ph - margin * 2; cw = ch * cardAspect; }
  const cx = (pw - cw) / 2;
  const cy = (ph - ch) / 2;

  // Frente
  const fData = frontCv.toDataURL("image/png");
  pdf.addImage(fData, "PNG", cx, cy, cw, ch);

  // Reverso
  pdf.addPage("a4", "landscape");
  const bData = backCv.toDataURL("image/png");
  pdf.addImage(bData, "PNG", cx, cy, cw, ch);

  pdf.save(`credencial_${data.codigo || "ministerio"}.pdf`);
}

