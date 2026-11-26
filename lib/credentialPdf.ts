import jsPDF from "jspdf";

const NAVY = "#1a2d50";
const LBL = "#7a8ca3";
const SEP = "#d0d8e2";
const BODY = "#1e293b";
const CW = 1800;
const CH = 1131;

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
async function drawFront(
  data: PdfData,
  sp: HTMLImageElement | null, ph: HTMLImageElement | null, lg: HTMLImageElement | null
): Promise<HTMLCanvasElement> {
  const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
  const c = cv.getContext("2d")!;
  c.save(); rr(c, 0, 0, CW, CH, 30); c.clip();
  c.fillStyle = "#fff"; c.fillRect(0, 0, CW, CH);

  if (sp) {
    c.save(); c.globalAlpha = 0.08;
    const mh = CH * 0.6; const mw = mh * (sp.width / sp.height);
    c.drawImage(sp, CW - mw - 15, 135, mw, mh); c.restore();
  }

  c.textAlign = "center"; c.textBaseline = "top";
  c.fillStyle = NAVY; c.font = "800 81px 'Segoe UI',sans-serif";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", CW / 2, 36);
  const cif = "CIF R480047J";
  c.font = "600 27px 'Segoe UI',sans-serif"; c.fillStyle = LBL;
  const tw = c.measureText(cif).width;
  c.fillText(cif, CW / 2, 129);
  c.strokeStyle = NAVY; c.lineWidth = 3;
  c.beginPath(); c.moveTo(CW / 2 - tw / 2 - 270, 144); c.lineTo(CW / 2 - tw / 2 - 24, 144); c.stroke();
  c.beginPath(); c.moveTo(CW / 2 + tw / 2 + 24, 144); c.lineTo(CW / 2 + tw / 2 + 270, 144); c.stroke();

  const pw = 375, ppH = 450, px = 60, py = 180;
  c.save(); rr(c, px, py, pw, ppH, 12);
  c.fillStyle = "#e8ecf0"; c.fill();
  c.strokeStyle = SEP; c.lineWidth = 3; c.stroke();
  if (ph) { c.clip(); c.drawImage(ph, px, py, pw, ppH); }
  else {
    c.fillStyle = "#b0bec5"; c.font = "bold 144px 'Segoe UI',sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(data.nombre[0], px + pw / 2, py + ppH / 2);
  }
  c.restore();

  const fx = px + pw + 54; const fw = CW - fx - 75;
  c.textAlign = "left"; c.textBaseline = "top"; c.fillStyle = NAVY;
  c.font = "800 75px 'Segoe UI',sans-serif";
  let nm = data.nombre.toUpperCase();
  while (c.measureText(nm).width > fw && nm.length > 3) nm = nm.slice(0, -1);
  c.fillText(nm, fx, 189);
  c.font = "700 48px 'Segoe UI',sans-serif";
  let ap = (data.apellidos || "").toUpperCase();
  while (c.measureText(ap).width > fw && ap.length > 3) ap = ap.slice(0, -1);
  c.fillText(ap, fx, 273);

  let fy = 348;
  const field = (label: string, val: string, mono?: boolean) => {
    c.fillStyle = LBL; c.font = "700 22px 'Segoe UI',sans-serif";
    c.fillText(label, fx, fy);
    c.fillStyle = BODY; c.font = mono ? "700 42px 'Courier New',monospace" : "700 42px 'Segoe UI',sans-serif";
    c.fillText(val, fx, fy + 28);
    c.strokeStyle = SEP; c.lineWidth = 2;
    c.beginPath(); c.moveTo(fx, fy + 78); c.lineTo(fx + fw * 0.75, fy + 78); c.stroke();
    fy += 100;
  };
  const expiry = formatExpiry();
  field("DOCUMENTO", data.dni || data.nie || "\u2014");
  field("N.\u00ba DE CREDENCIAL", data.codigo || "\u2014", true);
  field("V\u00c1LIDA HASTA", expiry);
  // BARRA AZUL
  const barH = 120; const barY = CH - 66 - barH;
  c.fillStyle = NAVY; c.fillRect(0, barY, CW, barH);
  if (lg) {
    const lh2 = 78; const lw2 = lh2 * (lg.width / lg.height);
    c.save(); c.globalCompositeOperation = "screen";
    c.drawImage(lg, 60, barY + (barH - lh2) / 2, lw2, lh2); c.restore();
    c.strokeStyle = "rgba(255,255,255,0.25)"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(60 + lw2 + 21, barY + 18); c.lineTo(60 + lw2 + 21, barY + barH - 18); c.stroke();
    const tx = 60 + lw2 + 42;
    c.fillStyle = "#fff"; c.font = "800 42px 'Segoe UI',sans-serif";
    c.textBaseline = "top"; c.textAlign = "left";
    c.fillText("MINISTRO DE CULTO", tx, barY + 18);
    c.fillStyle = "rgba(255,255,255,0.55)"; c.font = "italic 21px 'Segoe UI',sans-serif";
    c.fillText("\u201cId por todo el mundo y predicad el evangelio a toda criatura.\u201d", tx, barY + 69);
    const qw = c.measureText("\u201cId por todo el mundo y predicad el evangelio a toda criatura.\u201d  ").width;
    c.fillStyle = "rgba(255,255,255,0.8)"; c.font = "700 21px 'Segoe UI',sans-serif";
    c.fillText("Marcos 16:15", tx + qw, barY + 69);
  }

  const ftY = barY + barH;
  c.fillStyle = "#f4f6f8"; c.fillRect(0, ftY, CW, 66);
  c.strokeStyle = SEP; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(0, ftY); c.lineTo(CW, ftY); c.stroke();
  c.fillStyle = LBL; c.font = "600 21px 'Segoe UI',sans-serif";
  c.textBaseline = "middle"; c.textAlign = "left";
  c.fillText(`${data.iglesia_nombre} \u00b7 [${data.zona_codigo}] ${data.zona_nombre}`, 60, ftY + 33);
  c.textAlign = "right";
  c.fillText("Caduca: " + expiry, CW - 60, ftY + 33);

  c.restore(); return cv;
}
function drawBack(lg: HTMLImageElement | null): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
  const c = cv.getContext("2d")!;
  c.save(); rr(c, 0, 0, CW, CH, 30); c.clip();
  c.fillStyle = "#f4f6f8"; c.fillRect(0, 0, CW, CH);

  if (lg) {
    const lh2 = 90; const lw2 = lh2 * (lg.width / lg.height);
    c.drawImage(lg, (CW - lw2) / 2, 36, lw2, lh2);
  }

  c.textAlign = "center"; c.textBaseline = "top";
  c.fillStyle = NAVY; c.font = "800 51px 'Segoe UI',sans-serif";
  c.fillText("EXTRACTOS DE LEY", CW / 2, 144);
  c.fillStyle = LBL; c.font = "600 22px 'Segoe UI',sans-serif";
  c.fillText("Ley 7/1980 de Libertad Religiosa  \u2022  Ley 24/1992 Acuerdo Iglesia-Estado", CW / 2, 207);

  c.strokeStyle = SEP; c.lineWidth = 2;
  c.beginPath(); c.moveTo(CW * 0.15, 246); c.lineTo(CW * 0.85, 246); c.stroke();

  const mx = 75; const maxTW = CW - mx * 2; const fs = 26; const lh2 = 36;
  const t1 = "El acceso de los Ministros de Culto de la Iglesia Evang\u00e9lica Filadelfia a centros o establecimientos penitenciarios, hospitalarios, asistenciales u otros an\u00e1logos del sector p\u00fablico, es libre y sin limitaciones de horarios para su asistencia religiosa. (Ley 7/1980, Art. 2)";
  const t2 = "Los Ministros de Culto de las Iglesias pertenecientes a la Iglesia Evang\u00e9lica Filadelfia no est\u00e1n obligados a declarar sobre los hechos que les hayan sido revelados en el ejercicio de sus funciones de culto y asistencia religiosa. (Ley 24/1992, Art. 3.2)";

  c.font = `${fs}px 'Segoe UI',sans-serif`;
  const l1 = wrap(c, t1, maxTW); const l2 = wrap(c, t2, maxTW);
  let y = 270; c.fillStyle = "#3a4a5e";
  for (const ln of l1) { c.fillText(ln, CW / 2, y); y += lh2; }
  y += 21;
  c.strokeStyle = SEP; c.beginPath(); c.moveTo(CW * 0.25, y); c.lineTo(CW * 0.75, y); c.stroke();
  y += 27; c.fillStyle = "#3a4a5e";
  for (const ln of l2) { c.fillText(ln, CW / 2, y); y += lh2; }

  const bH = 69; c.fillStyle = NAVY; c.fillRect(0, CH - bH, CW, bH);
  c.fillStyle = "rgba(255,255,255,0.5)"; c.font = "700 22px 'Segoe UI',sans-serif";
  c.textBaseline = "middle";
  c.fillText("IGLESIA EVANG\u00c9LICA FILADELFIA", CW / 2, CH - bH / 2);

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