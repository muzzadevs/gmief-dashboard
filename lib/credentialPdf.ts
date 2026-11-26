import jsPDF from "jspdf";

const NAVY = "#0f172a";
const BLUE = "#1e3a8a";
const LBL = "#64748b";
const SEP = "#cbd5e1";
const VAL = "#1e293b";
const CW = 2400;
const CH = 1508;

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

function formatExpiry(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("load fail:" + src));
    i.src = src;
  });
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r); c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r); c.closePath();
}

function wrap(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur + w + " ";
    if (c.measureText(t).width > maxW && cur) { lines.push(cur.trim()); cur = w + " "; }
    else { cur = t; }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

function gradRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, NAVY); g.addColorStop(1, BLUE);
  c.fillStyle = g; c.fillRect(x, y, w, h);
}
async function drawFront(
  data: PdfData,
  sp: HTMLImageElement | null, ph: HTMLImageElement | null, lg: HTMLImageElement | null
): Promise<HTMLCanvasElement> {
  const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
  const c = cv.getContext("2d")!;
  c.save(); rr(c, 0, 0, CW, CH, 36); c.clip();
  c.fillStyle = "#fff"; c.fillRect(0, 0, CW, CH);

  const hdrH = 160;
  gradRect(c, 0, 0, CW, hdrH);
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillStyle = "#fff"; c.font = "800 90px Poppins, sans-serif";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", CW / 2, 68);
  c.fillStyle = "rgba(255,255,255,0.45)"; c.font = "500 28px Poppins, sans-serif";
  c.fillText("CIF R480047J", CW / 2, 128);

  if (sp) {
    c.save(); c.globalAlpha = 0.12;
    const mh = CH * 0.55; const mw = mh * (sp.width / sp.height);
    c.drawImage(sp, CW - mw + 40, hdrH + 20, mw, mh); c.restore();
  }

  const bodyTop = hdrH + 50;
  const px = 80;
  const pw = 520, ppH = 650;
  c.save(); rr(c, px, bodyTop, pw, ppH, 16);
  c.fillStyle = "#e2e8f0"; c.fill();
  c.strokeStyle = "#e2e8f0"; c.lineWidth = 3; c.stroke();
  if (ph) { c.clip(); c.drawImage(ph, px, bodyTop, pw, ppH); }
  else {
    c.fillStyle = "#94a3b8"; c.font = "800 200px Poppins, sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(data.nombre[0], px + pw / 2, bodyTop + ppH / 2);
  }
  c.restore();

  const fx = px + pw + 70; const fw = CW - fx - 80;
  c.textAlign = "left"; c.textBaseline = "top";
  c.fillStyle = NAVY; c.font = "800 110px Poppins, sans-serif";
  let nm = data.nombre.toUpperCase();
  while (c.measureText(nm).width > fw && nm.length > 3) nm = nm.slice(0, -1);
  c.fillText(nm, fx, bodyTop);
  c.fillStyle = BLUE; c.font = "700 70px Poppins, sans-serif";
  let ap = (data.apellidos || "").toUpperCase();
  while (c.measureText(ap).width > fw && ap.length > 3) ap = ap.slice(0, -1);
  c.fillText(ap, fx, bodyTop + 120);

  let fy = bodyTop + 230;
  const field = (label: string, val: string) => {
    c.fillStyle = BLUE; c.font = "700 30px Poppins, sans-serif";
    c.fillText(label.toUpperCase(), fx, fy);
    c.fillStyle = VAL; c.font = "700 56px Poppins, sans-serif";
    c.fillText(val, fx, fy + 38);
    c.strokeStyle = SEP; c.lineWidth = 2;
    c.beginPath(); c.moveTo(fx, fy + 105); c.lineTo(fx + fw * 0.85, fy + 105); c.stroke();
    fy += 140;
  };
  const expiry = formatExpiry();
  field("Documento", data.dni || data.nie || "\u2014");
  field("N.\u00ba de Credencial", data.codigo || "\u2014");
  field("V\u00e1lida hasta", expiry);
  const barH = 150; const barY = CH - 90 - barH;
  gradRect(c, 0, barY, CW, barH);
  if (lg) {
    const lh2 = 100; const lw2 = lh2 * (lg.width / lg.height);
    c.save(); c.globalCompositeOperation = "screen";
    c.drawImage(lg, 80, barY + (barH - lh2) / 2, lw2, lh2); c.restore();
    c.strokeStyle = "rgba(255,255,255,0.2)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(80 + lw2 + 28, barY + 24); c.lineTo(80 + lw2 + 28, barY + barH - 24); c.stroke();
    const tx = 80 + lw2 + 56;
    c.fillStyle = "#fff"; c.font = "800 56px Poppins, sans-serif";
    c.textBaseline = "top"; c.textAlign = "left";
    c.fillText("MINISTRO DE CULTO", tx, barY + 24);
    c.fillStyle = "rgba(255,255,255,0.5)"; c.font = "italic 28px Poppins, sans-serif";
    c.fillText("\u201cId por todo el mundo y predicad el evangelio a toda criatura\u201d", tx, barY + 90);
    const qw = c.measureText("\u201cId por todo el mundo y predicad el evangelio a toda criatura\u201d  ").width;
    c.fillStyle = "rgba(255,255,255,0.75)"; c.font = "700 28px Poppins, sans-serif";
    c.fillText("Marcos 16:15", tx + qw, barY + 90);
  }

  const ftY = barY + barH;
  c.fillStyle = "#f1f5f9"; c.fillRect(0, ftY, CW, 90);
  c.strokeStyle = SEP; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(0, ftY); c.lineTo(CW, ftY); c.stroke();
  c.fillStyle = LBL; c.font = "600 28px Poppins, sans-serif";
  c.textBaseline = "middle"; c.textAlign = "left";
  c.fillText(`${data.iglesia_nombre} \u00b7 [${data.zona_codigo}] ${data.zona_nombre}`, 80, ftY + 45);
  c.textAlign = "right";
  c.fillText("Caduca: " + expiry, CW - 80, ftY + 45);

  c.restore(); return cv;
}
function drawBack(lg: HTMLImageElement | null): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
  const c = cv.getContext("2d")!;
  c.save(); rr(c, 0, 0, CW, CH, 36); c.clip();
  c.fillStyle = "#fff"; c.fillRect(0, 0, CW, CH);

  const hdrH = 200;
  gradRect(c, 0, 0, CW, hdrH);
  if (lg) {
    const lh2 = 60; const lw2 = lh2 * (lg.width / lg.height);
    c.save(); c.globalCompositeOperation = "screen";
    c.drawImage(lg, (CW - lw2) / 2, 24, lw2, lh2); c.restore();
  }
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillStyle = "#fff"; c.font = "800 72px Poppins, sans-serif";
  c.fillText("EXTRACTOS DE LEY", CW / 2, 120);
  c.fillStyle = "rgba(255,255,255,0.45)"; c.font = "500 26px Poppins, sans-serif";
  c.fillText("Ley 7/1980 de Libertad Religiosa  \u2022  Ley 24/1992 Acuerdo Iglesia-Estado", CW / 2, 170);

  const mx = 100; const maxTW = CW - mx * 2; const fs = 40; const lh2 = 58;
  const t1 = "El acceso de los Ministros de Culto de la Iglesia Evang\u00e9lica Filadelfia a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros an\u00e1logos del sector p\u00fablico, es libre y sin limitaciones de horarios para su asistencia religiosa. (Ley 7/1980, Art. 2)";
  const t2 = "Los Ministros de Culto de las Iglesias pertenecientes a la Iglesia Evang\u00e9lica Filadelfia no est\u00e1n obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. (Ley 24/1992, Art. 3.2)";

  c.font = `${fs}px Poppins, sans-serif`;
  c.textAlign = "center"; c.textBaseline = "top";
  const l1 = wrap(c, t1, maxTW); const l2 = wrap(c, t2, maxTW);
  const totalTextH = (l1.length + l2.length) * lh2 + 60;
  const availH = CH - hdrH - 100;
  let y = hdrH + (availH - totalTextH) / 2;

  c.fillStyle = "#334155";
  for (const ln of l1) { c.fillText(ln, CW / 2, y); y += lh2; }
  y += 30;
  c.strokeStyle = SEP; c.lineWidth = 2;
  c.beginPath(); c.moveTo(CW * 0.2, y); c.lineTo(CW * 0.8, y); c.stroke();
  y += 30;
  for (const ln of l2) { c.fillText(ln, CW / 2, y); y += lh2; }

  const fH = 90;
  gradRect(c, 0, CH - fH, CW, fH);
  c.fillStyle = "rgba(255,255,255,0.4)"; c.font = "700 28px Poppins, sans-serif";
  c.textBaseline = "middle"; c.textAlign = "center";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", CW / 2, CH - fH / 2);

  c.restore(); return cv;
}

export async function generateCredentialPdf(data: PdfData): Promise<void> {
  const [sp, ph, lg] = await Promise.all([
    loadImg("/spainMap.png").catch(() => null),
    data.has_imagen ? loadImg(`/api/ministerios/${data.ministerio_id}/imagen`).catch(() => null) : Promise.resolve(null),
    loadImg("/TEMPLOGOIEF.png").catch(() => null),
  ]);

  const fCv = await drawFront(data, sp, ph, lg);
  const bCv = drawBack(lg);

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ppH = pdf.internal.pageSize.getHeight();
  const cardAspect = CW / CH;
  const margin = 15;
  let cw = pw - margin * 2;
  let ch = cw / cardAspect;
  if (ch > ppH - margin * 2) { ch = ppH - margin * 2; cw = ch * cardAspect; }
  const cx = (pw - cw) / 2;
  const cy = (ppH - ch) / 2;

  pdf.addImage(fCv.toDataURL("image/png"), "PNG", cx, cy, cw, ch);
  pdf.addPage("a4", "landscape");
  pdf.addImage(bCv.toDataURL("image/png"), "PNG", cx, cy, cw, ch);
  pdf.save(`credencial_${data.codigo || "ministerio"}.pdf`);
}