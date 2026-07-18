/**
 * OndeSanMarcos — Presentación final (generador PPTX).
 *
 * Se escribe en JS y se compila a .pptx con PptxGenJS:
 *     npm run build   ->   dist/OndeSanMarcos.pptx
 *
 * Diseño: fondo negro limpio, tipografía Arial (compatible multiplataforma),
 * front = azul, back = teal. Todo el posicionamiento pasa por helpers para
 * mantener los elementos alineados y consistentes entre slides.
 */

const path = require("path");
const PptxGenJS = require("pptxgenjs");

// ---------------------------------------------------------------------------
// Tema
// ---------------------------------------------------------------------------
const C = {
  bg: "0A0A0C",
  bgAlt: "0E0E12",
  surface: "16171C",
  surface2: "1D1F26",
  border: "2A2C35",
  borderHi: "3B3E4A",
  white: "FFFFFF",
  text: "EAEBF0",
  sub: "9AA0AC",
  muted: "676D79",
  blue: "5B8CFF", // acento frontend
  blueDim: "24304F",
  teal: "2DD4A7", // acento backend
  tealDim: "123C33",
  amber: "F5B94D", // servicios externos / highlight
  violet: "A78BFA",
  red: "F87171",
  green: "4ADE80",
};
const FONT = "Arial";
const PAGE_W = 13.333;
const PAGE_H = 7.5;
const MX = 0.7; // margen horizontal
const CW = PAGE_W - MX * 2; // ancho de contenido

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "anycodef";
pptx.company = "UNMSM";
pptx.title = "OndeSanMarcos — Presentación final";
const S = pptx.ShapeType;

let PAGE = 0;

// ---------------------------------------------------------------------------
// Helpers de bajo nivel
// ---------------------------------------------------------------------------
function newSlide(color = C.bg) {
  const s = pptx.addSlide();
  s.background = { color };
  return s;
}

function rect(s, o) {
  s.addShape(o.round ? S.roundRect : S.rect, {
    x: o.x, y: o.y, w: o.w, h: o.h,
    fill: o.fill === false ? { type: "none" } : { color: o.fill || C.surface },
    line: o.line === false
      ? { type: "none" }
      : { color: o.lineColor || C.border, width: o.lineW || 1, dashType: o.dash || "solid" },
    rectRadius: o.round ? (o.radius || 0.06) : undefined,
    shadow: o.shadow || undefined,
  });
}

function txt(s, text, o) {
  s.addText(text, {
    x: o.x, y: o.y, w: o.w, h: o.h,
    fontFace: o.font || FONT,
    fontSize: o.size || 14,
    color: o.color || C.text,
    bold: o.bold || false,
    italic: o.italic || false,
    align: o.align || "left",
    valign: o.valign || "top",
    charSpacing: o.spacing,
    lineSpacingMultiple: o.lh,
    bullet: o.bullet || false,
    breakLine: o.breakLine,
    fill: o.tfill ? { color: o.tfill } : undefined,
    margin: o.margin != null ? o.margin : 0,
    wrap: o.wrap !== false,
  });
}

// IMPORTANTE (Canva): al importar, Canva descarta los elementos de tipo "línea"
// (S.line). Por eso los conectores se dibujan como RECTÁNGULOS delgados rotados y
// las puntas de flecha como TRIÁNGULOS: son figuras nativas que sí se conservan.

// Un segmento recto = rectángulo delgado rotado al ángulo del tramo. Si es
// punteado, se compone de varios rectángulos cortos.
function segment(s, x1, y1, x2, y2, color, width, dash) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const th = Math.max((width || 1.25) / 72, 0.012); // grosor en pulgadas
  const put = (sx, sy, ex, ey) => {
    const l = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);
    if (l < 0.001) return;
    s.addShape(S.rect, {
      x: (sx + ex) / 2 - l / 2, y: (sy + ey) / 2 - th / 2, w: l, h: th,
      fill: { color: color || C.borderHi }, line: { type: "none" }, rotate: angle,
    });
  };
  if (!dash || dash === "solid") { put(x1, y1, x2, y2); return; }
  const dashLen = 0.09, gap = 0.07, step = dashLen + gap;
  const ux = dx / len, uy = dy / len;
  for (let d = 0; d < len - 0.001; d += step) {
    const seg = Math.min(dashLen, len - d);
    put(x1 + ux * d, y1 + uy * d, x1 + ux * (d + seg), y1 + uy * (d + seg));
  }
}

// Punta de flecha = triángulo con la punta en (px,py) apuntando según `angleDeg`
// (0 = derecha). El triángulo nativo apunta hacia arriba, así que se rota +90.
function arrowHead(s, px, py, angleDeg, color, size) {
  const hh = size || 0.15, hw = (size || 0.15) * 0.85;
  const th = (angleDeg * Math.PI) / 180;
  const cx = px - (hh / 2) * Math.cos(th);
  const cy = py - (hh / 2) * Math.sin(th);
  s.addShape(S.triangle, {
    x: cx - hw / 2, y: cy - hh / 2, w: hw, h: hh,
    fill: { color: color || C.borderHi }, line: { type: "none" }, rotate: angleDeg + 90,
  });
}

function line(s, x1, y1, x2, y2, o = {}) {
  const color = o.color || C.borderHi;
  const width = o.width || 1;
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const hasEnd = o.end && o.end !== "none";
  const hasBegin = o.begin && o.begin !== "none";
  // acorta el tramo para no asomar por la punta
  const pull = 0.09;
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) || 1;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const ex = hasEnd ? x2 - ux * pull : x2;
  const ey = hasEnd ? y2 - uy * pull : y2;
  const sx = hasBegin ? x1 + ux * pull : x1;
  const sy = hasBegin ? y1 + uy * pull : y1;
  segment(s, sx, sy, ex, ey, color, width, o.dash);
  if (hasEnd) arrowHead(s, x2, y2, angle, color, o.headSize);
  if (hasBegin) arrowHead(s, x1, y1, angle + 180, color, o.headSize);
}

// Kicker + título + regla de acento (encabezado estándar de slide de contenido)
function header(s, kicker, title, accent = C.blue, lead) {
  if (kicker)
    txt(s, kicker.toUpperCase(), {
      x: MX, y: 0.5, w: CW, h: 0.3, size: 11.5, color: accent, bold: true, spacing: 2.5,
    });
  txt(s, title, { x: MX, y: 0.8, w: CW, h: 0.72, size: 28, color: C.white, bold: true });
  rect(s, { x: MX + 0.01, y: 1.55, w: 0.55, h: 0.055, fill: accent, line: false });
  if (lead)
    txt(s, lead, { x: MX, y: 1.72, w: CW, h: 0.45, size: 13.5, color: C.sub, lh: 1.15 });
}

function footer(s, section, accent = C.muted) {
  line(s, MX, 7.02, PAGE_W - MX, 7.02, { color: C.border, width: 0.75 });
  txt(s, "OndeSanMarcos · Asistente de campus UNMSM", {
    x: MX, y: 7.06, w: 8, h: 0.3, size: 8.5, color: C.muted,
  });
  if (section)
    txt(s, section, { x: PAGE_W / 2 - 3, y: 7.06, w: 6, h: 0.3, size: 8.5, color: accent, align: "center", spacing: 1 });
  txt(s, String(PAGE).padStart(2, "0"), {
    x: PAGE_W - MX - 1.2, y: 7.06, w: 1.2, h: 0.3, size: 8.5, color: C.muted, align: "right",
  });
}

// Slide de contenido base
function content(kicker, title, accent = C.blue, lead, section) {
  PAGE += 1;
  const s = newSlide();
  header(s, kicker, title, accent, lead);
  footer(s, section, accent);
  return s;
}

// Chip / pill pequeño
function chip(s, x, y, w, text, accent = C.blue, opts = {}) {
  const h = opts.h || 0.34;
  rect(s, { x, y, w, h, round: true, radius: h / 2, fill: opts.fill || C.surface2, lineColor: accent, lineW: 1 });
  txt(s, text, { x: x + 0.1, y, w: w - 0.2, h, size: opts.size || 10.5, color: opts.color || C.text, align: "center", valign: "middle", bold: opts.bold });
}

// Caja de diagrama con título y líneas de detalle
function card(s, o) {
  rect(s, {
    x: o.x, y: o.y, w: o.w, h: o.h, round: true, radius: 0.08,
    fill: o.fill || C.surface, lineColor: o.accent || C.border, lineW: o.lineW || 1,
  });
  // pestaña de acento a la izquierda
  if (o.accent && o.tab !== false)
    rect(s, { x: o.x, y: o.y + 0.12, w: 0.06, h: o.h - 0.24, fill: o.accent, line: false });
  const px = o.x + 0.22;
  if (o.title)
    txt(s, o.title, { x: px, y: o.y + 0.13, w: o.w - 0.4, h: 0.32, size: o.tsize || 13, color: o.titleColor || C.white, bold: true });
  if (o.sub)
    txt(s, o.sub, { x: px, y: o.y + (o.title ? 0.46 : 0.13), w: o.w - 0.4, h: 0.3, size: 9.5, color: o.accent || C.sub, bold: false });
  if (o.lines && o.lines.length) {
    const startY = o.y + (o.title ? (o.sub ? 0.78 : 0.5) : 0.16);
    txt(s, o.lines.map((t) => ({ text: t, options: { breakLine: true } })), {
      x: px, y: startY, w: o.w - 0.42, h: o.h - (startY - o.y) - 0.12,
      size: o.lsize || 10.5, color: C.sub, lh: 1.28,
      bullet: o.bullet ? { characterCode: "2022", indent: 12 } : false,
    });
  }
}

// Bullets con cuadrito de acento (una viñeta por ítem; soporta {h, t})
function bullets(s, items, o) {
  const accent = o.accent || C.blue;
  const color = o.color || C.text;
  const runs = [];
  items.forEach((it) => {
    const head = typeof it === "string" ? null : it.h;
    const body = typeof it === "string" ? it : it.t;
    if (head) runs.push({ text: head + "  ", options: { color: accent, bold: true } });
    runs.push({
      text: body,
      options: { color, breakLine: true, bullet: { characterCode: "25AA", indent: 18 } },
    });
  });
  s.addText(runs, {
    x: o.x, y: o.y, w: o.w, h: o.h, fontFace: FONT, fontSize: o.size || 13,
    color, lineSpacingMultiple: o.lh || 1.4, paraSpaceAfter: o.psa != null ? o.psa : 7,
    valign: o.valign || "top", align: "left", margin: 0,
  });
}

// Lista simple con viñeta por línea (para tarjetas de detalle)
function bulletBox(s, items, o) {
  const runs = items.map((t) => ({
    text: t,
    options: { breakLine: true, bullet: { characterCode: o.code || "2022", indent: o.indent || 12 } },
  }));
  s.addText(runs, {
    x: o.x, y: o.y, w: o.w, h: o.h, fontFace: FONT, fontSize: o.size || 11.5,
    color: o.color || C.sub, lineSpacingMultiple: o.lh || 1.5,
    paraSpaceAfter: o.psa != null ? o.psa : 5, valign: o.valign || "top", margin: 0,
  });
}

// Flecha (recta) con punta
function arrow(s, x1, y1, x2, y2, color = C.borderHi, width = 1.5) {
  line(s, x1, y1, x2, y2, { color, width, end: "triangle" });
}

// Etiqueta flotante sobre una flecha
function tag(s, x, y, w, text, color = C.muted) {
  txt(s, text, { x, y, w, h: 0.26, size: 8.5, color, align: "center", italic: true });
}

// Placeholder de captura estilo ventana de navegador
function browserShot(s, o) {
  const bar = 0.34;
  rect(s, { x: o.x, y: o.y, w: o.w, h: o.h, round: true, radius: 0.06, fill: C.bgAlt, lineColor: o.accent || C.borderHi, lineW: 1, dash: "dash" });
  rect(s, { x: o.x, y: o.y, w: o.w, h: bar, fill: C.surface2, line: false });
  [0, 1, 2].forEach((i) =>
    s.addShape(S.ellipse, { x: o.x + 0.16 + i * 0.2, y: o.y + 0.12, w: 0.1, h: 0.1, fill: { color: [C.red, C.amber, C.green][i] }, line: { type: "none" } })
  );
  rect(s, { x: o.x + 0.85, y: o.y + 0.07, w: o.w - 1.1, h: 0.2, round: true, radius: 0.1, fill: C.bg, line: false });
  txt(s, o.url || "", { x: o.x + 0.95, y: o.y + 0.07, w: o.w - 1.2, h: 0.2, size: 8, color: C.muted, valign: "middle" });
  txt(s, "◱  " + (o.label || "CAPTURA"), {
    x: o.x, y: o.y + bar, w: o.w, h: 0.5, size: 11, color: o.accent || C.sub, bold: true, align: "center", valign: "middle", spacing: 1.5,
  });
  txt(s, o.desc || "", {
    x: o.x + 0.4, y: o.y + o.h / 2 - 0.1, w: o.w - 0.8, h: o.h / 2, size: 10, color: C.sub, align: "center", valign: "top", lh: 1.25, italic: true,
  });
}

// Placeholder de pantalla de app estilo teléfono
function phoneShot(s, o) {
  const w = o.w || 1.65;
  const h = o.h || 3.4;
  rect(s, { x: o.x, y: o.y, w, h, round: true, radius: 0.14, fill: C.bgAlt, lineColor: o.accent || C.borderHi, lineW: 1.25, dash: "dash" });
  rect(s, { x: o.x + w / 2 - 0.28, y: o.y + 0.1, w: 0.56, h: 0.1, round: true, radius: 0.05, fill: C.surface2, line: false });
  txt(s, "▢", { x: o.x, y: o.y + h / 2 - 0.55, w, h: 0.4, size: 16, color: o.accent || C.muted, align: "center" });
  txt(s, o.label || "", { x: o.x + 0.08, y: o.y + h / 2 - 0.15, w: w - 0.16, h: 0.7, size: 9, color: C.sub, align: "center", valign: "top", lh: 1.15 });
  if (o.caption)
    txt(s, o.caption, { x: o.x - 0.1, y: o.y + h + 0.06, w: w + 0.2, h: 0.3, size: 9, color: C.muted, align: "center" });
}

// Clase UML (3 compartimentos)
function umlClass(s, o) {
  const px = o.x, py = o.y, w = o.w;
  const nameH = 0.42;
  const attrH = o.attrs && o.attrs.length ? 0.05 + o.attrs.length * 0.245 : 0;
  const methH = o.methods && o.methods.length ? 0.05 + o.methods.length * 0.245 : 0;
  const h = nameH + attrH + methH;
  rect(s, { x: px, y: py, w, h, round: true, radius: 0.05, fill: C.surface, lineColor: o.accent || C.borderHi, lineW: 1.25 });
  rect(s, { x: px, y: py, w, h: nameH, fill: o.headFill || C.surface2, line: false });
  if (o.stereo)
    txt(s, o.stereo, { x: px, y: py + 0.03, w, h: 0.18, size: 7.5, color: o.accent || C.sub, align: "center", italic: true });
  txt(s, o.name, { x: px, y: py + (o.stereo ? 0.16 : 0), w, h: o.stereo ? 0.26 : nameH, size: 11.5, color: C.white, bold: true, align: "center", valign: "middle" });
  let cy = py + nameH;
  if (attrH) {
    line(s, px, cy, px + w, cy, { color: o.accent || C.borderHi, width: 1 });
    txt(s, o.attrs.map((t) => ({ text: t, options: { breakLine: true } })), {
      x: px + 0.12, y: cy + 0.04, w: w - 0.2, h: attrH - 0.05, size: 9, color: C.sub, lh: 1.15, font: FONT,
    });
    cy += attrH;
  }
  if (methH) {
    line(s, px, cy, px + w, cy, { color: o.accent || C.borderHi, width: 1 });
    txt(s, o.methods.map((t) => ({ text: t, options: { breakLine: true } })), {
      x: px + 0.12, y: cy + 0.04, w: w - 0.2, h: methH - 0.05, size: 9, color: C.text, lh: 1.15, font: FONT,
    });
  }
  return { x: px, y: py, w, h };
}

// Divisor de sección
function divider(kicker, title, accent, sub, no) {
  PAGE += 1;
  const s = newSlide(C.bg);
  // banda de acento vertical
  rect(s, { x: 0, y: 0, w: 0.16, h: PAGE_H, fill: accent, line: false });
  rect(s, { x: 0.16, y: 0, w: 0.04, h: PAGE_H, fill: C.surface2, line: false });
  txt(s, no || "", { x: MX + 0.1, y: 2.15, w: 3, h: 1.6, size: 96, color: C.surface2, bold: true });
  txt(s, kicker.toUpperCase(), { x: MX + 0.15, y: 2.9, w: 10, h: 0.4, size: 13, color: accent, bold: true, spacing: 3 });
  txt(s, title, { x: MX + 0.1, y: 3.25, w: 11, h: 1.1, size: 44, color: C.white, bold: true });
  rect(s, { x: MX + 0.15, y: 4.42, w: 0.9, h: 0.06, fill: accent, line: false });
  if (sub)
    txt(s, sub, { x: MX + 0.15, y: 4.62, w: 9.5, h: 0.9, size: 14, color: C.sub, lh: 1.3 });
  footer(s, null, accent);
  return s;
}

// ===========================================================================
// SLIDES
// ===========================================================================

// --- 01 Portada ------------------------------------------------------------
(function cover() {
  PAGE += 1;
  const s = newSlide(C.bg);
  // acentos geométricos sutiles
  rect(s, { x: 9.7, y: -1.2, w: 4.6, h: 4.6, round: true, radius: 0.4, fill: false, lineColor: C.blueDim, lineW: 1.5 });
  rect(s, { x: 10.6, y: 4.4, w: 3.8, h: 3.8, round: true, radius: 0.4, fill: false, lineColor: C.tealDim, lineW: 1.5 });
  s.addShape(S.ellipse, { x: 11.2, y: 1.9, w: 0.16, h: 0.16, fill: { color: C.blue }, line: { type: "none" } });
  s.addShape(S.ellipse, { x: 9.9, y: 3.5, w: 0.12, h: 0.12, fill: { color: C.teal }, line: { type: "none" } });

  chip(s, MX, 1.5, 2.55, "PROYECTO · UNMSM", C.blue, { size: 10, color: C.sub, fill: C.surface });
  txt(s, "OndeSanMarcos", { x: MX - 0.03, y: 2.15, w: 11, h: 1.4, size: 72, color: C.white, bold: true });
  txt(s, "Asistente inteligente de navegación y consultas del campus", {
    x: MX, y: 3.55, w: 9.5, h: 0.6, size: 20, color: C.blue, bold: false,
  });
  txt(s,
    "App móvil con mapa interactivo y un asistente conversacional (RAG) anclado al\nconocimiento oficial de la Universidad Nacional Mayor de San Marcos.",
    { x: MX, y: 4.25, w: 9.2, h: 0.9, size: 13.5, color: C.sub, lh: 1.35 }
  );
  line(s, MX, 5.5, MX + 4.6, 5.5, { color: C.border, width: 1 });
  txt(s, "Exposición final", { x: MX, y: 5.62, w: 6, h: 0.35, size: 13, color: C.text, bold: true });
  txt(s, "Ingeniería de Software · Equipo anycodef", { x: MX, y: 5.95, w: 8, h: 0.35, size: 11.5, color: C.muted });
  footer(s, null, C.blue);
})();

// --- 02 Integrantes --------------------------------------------------------
(function team() {
  const s = content("Equipo", "Integrantes", C.blue, "Equipo anycodef — desarrollo full-stack, RAG y experiencia móvil.", "Presentación");
  const members = [
    { n: "Sota Rios, Pedro Josué", r: "Frontend · Mapa & Mapbox" },
    { n: "Condor Huarhuachi, Frank", r: "Backend · API & despliegue" },
    { n: "Patricio Julca, Vilberto", r: "Frontend · Chat & navegación" },
    { n: "Macchiavello Perez, Oscar", r: "Backend · RAG & datos" },
    { n: "Lozano Paredes, Renzo", r: "Frontend · Rutas & ubicaciones" },
    { n: "Calle Ramos, Guillermo", r: "QA · Pruebas & documentación" },
  ];
  const cols = 3, rows = 2;
  const gx = 0.4, gy = 0.45;
  const cardW = (CW - gx * (cols - 1)) / cols;
  const cardH = 1.85;
  const y0 = 2.35;
  members.forEach((m, i) => {
    const cx = MX + (i % cols) * (cardW + gx);
    const cy = y0 + Math.floor(i / cols) * (cardH + gy);
    card(s, { x: cx, y: cy, w: cardW, h: cardH, accent: C.blue });
    s.addShape(S.ellipse, { x: cx + 0.28, y: cy + 0.3, w: 0.62, h: 0.62, fill: { color: C.surface2 }, line: { color: C.blue, width: 1.25 } });
    const initials = m.n.split(",")[0].trim()[0] + (m.n.split(",")[1] || " ").trim()[0];
    txt(s, initials.toUpperCase(), { x: cx + 0.28, y: cy + 0.3, w: 0.62, h: 0.62, size: 15, color: C.blue, bold: true, align: "center", valign: "middle" });
    txt(s, m.n, { x: cx + 1.05, y: cy + 0.36, w: cardW - 1.2, h: 0.6, size: 13, color: C.white, bold: true, valign: "middle", lh: 1.05 });
    txt(s, m.r, { x: cx + 0.3, y: cy + 1.15, w: cardW - 0.55, h: 0.5, size: 10.5, color: C.sub, lh: 1.1 });
  });
})();

// --- 03 Agenda -------------------------------------------------------------
(function agenda() {
  const s = content("Índice", "Agenda", C.blue, null, "Presentación");
  const items = [
    ["01", "Contexto y problema", "Qué resolvemos y para quién", C.blue],
    ["02", "Vista general del proyecto", "Arquitectura completa, servicios y flujos", C.violet],
    ["03", "Frontend", "App móvil Expo / React Native", C.blue],
    ["04", "Backend", "API RAG con FastAPI, Gemini y pgvector", C.teal],
    ["05", "Demo", "La app en funcionamiento", C.amber],
    ["06", "Conclusiones y trabajo futuro", "Resultados y próximos pasos", C.green],
  ];
  const y0 = 2.3, rowH = 0.72, gap = 0.05;
  items.forEach((it, i) => {
    const cy = y0 + i * (rowH + gap);
    rect(s, { x: MX, y: cy, w: CW, h: rowH, round: true, radius: 0.06, fill: C.surface, lineColor: C.border, lineW: 1 });
    rect(s, { x: MX, y: cy + 0.1, w: 0.06, h: rowH - 0.2, fill: it[3], line: false });
    txt(s, it[0], { x: MX + 0.3, y: cy, w: 0.9, h: rowH, size: 20, color: it[3], bold: true, valign: "middle" });
    txt(s, it[1], { x: MX + 1.35, y: cy, w: 5.5, h: rowH, size: 15, color: C.white, bold: true, valign: "middle" });
    txt(s, it[2], { x: MX + 6.8, y: cy, w: CW - 7, h: rowH, size: 11.5, color: C.sub, valign: "middle" });
  });
})();

// --- 04 Contexto y problema ------------------------------------------------
(function problem() {
  const s = content("Contexto", "El problema", C.blue,
    "La Ciudad Universitaria de San Marcos es enorme y difícil de recorrer para quien no la conoce.", "Presentación");
  const left = [
    { h: "Campus extenso:", t: "decenas de facultades, oficinas y servicios dispersos en ~1.2 km²." },
    { h: "Sin guía unificada:", t: "ingresantes, visitantes y postulantes se pierden buscando un lugar." },
    { h: "Información dispersa:", t: "horarios, teléfonos y ubicaciones viven en fuentes distintas." },
    { h: "Señalización limitada:", t: "no hay una forma rápida de \"¿cómo llego a…?\"." },
  ];
  bullets(s, left, { x: MX, y: 2.35, w: 6.1, h: 3.4, accent: C.blue, size: 13.5, lh: 1.6 });

  card(s, { x: 7.15, y: 2.3, w: CW - 6.45, h: 3.9, accent: C.blue, title: "¿A quién impacta?", tsize: 14 });
  const who = [
    ["Ingresantes", "Primer contacto con el campus"],
    ["Postulantes", "Ubicar OCA, aulas de examen"],
    ["Visitantes", "Trámites, eventos, biblioteca"],
    ["Comunidad UNMSM", "Servicios del día a día"],
  ];
  who.forEach((w, i) => {
    const cy = 2.95 + i * 0.78;
    s.addShape(S.ellipse, { x: 7.45, y: cy, w: 0.4, h: 0.4, fill: { color: C.blueDim }, line: { color: C.blue, width: 1 } });
    txt(s, w[0], { x: 8.05, y: cy - 0.05, w: 4.2, h: 0.35, size: 12.5, color: C.white, bold: true });
    txt(s, w[1], { x: 8.05, y: cy + 0.28, w: 4.2, h: 0.3, size: 10, color: C.sub });
  });
})();

// --- 05 La solución --------------------------------------------------------
(function solution() {
  const s = content("Propuesta", "La solución: OndeSanMarcos", C.blue,
    "Una app que combina un mapa interactivo con un asistente que responde en lenguaje natural.", "Presentación");
  const feats = [
    ["Mapa interactivo", "Ubica facultades, oficinas y servicios sobre Mapbox con detalle 3D.", C.blue],
    ["Asistente IA (RAG)", "Responde preguntas del campus ancladas al conocimiento oficial.", C.teal],
    ["Rutas paso a paso", "Traza el camino peatonal desde tu ubicación hasta el destino.", C.violet],
    ["Chat → Mapa", "\"¿Cómo llego al rectorado?\" abre el mapa y dibuja la ruta.", C.amber],
  ];
  const cardW = (CW - 0.5) / 2, cardH = 1.75, gx = 0.5, gy = 0.35;
  feats.forEach((f, i) => {
    const cx = MX + (i % 2) * (cardW + gx);
    const cy = 2.4 + Math.floor(i / 2) * (cardH + gy);
    card(s, { x: cx, y: cy, w: cardW, h: cardH, accent: f[2], title: f[0], tsize: 15 });
    txt(s, f[1], { x: cx + 0.25, y: cy + 0.62, w: cardW - 0.5, h: 1, size: 12, color: C.sub, lh: 1.35 });
  });
})();

// --- 06 Objetivos ----------------------------------------------------------
(function goals() {
  const s = content("Alcance", "Objetivos del proyecto", C.blue, null, "Presentación");
  card(s, { x: MX, y: 2.3, w: 5.8, h: 3.95, accent: C.blue, title: "Objetivo general", tsize: 15 });
  txt(s,
    "Facilitar la orientación dentro del campus de la UNMSM mediante una app móvil que integre mapa, rutas y un asistente conversacional confiable.",
    { x: MX + 0.28, y: 2.9, w: 5.3, h: 1.3, size: 13, color: C.text, lh: 1.4 });
  line(s, MX + 0.28, 4.3, MX + 5.5, 4.3, { color: C.border });
  txt(s, "Pilares", { x: MX + 0.28, y: 4.42, w: 5, h: 0.3, size: 10, color: C.blue, bold: true, spacing: 1.5 });
  bullets(s, ["Precisión de la información", "Experiencia móvil fluida", "Respuestas ancladas (sin inventar)"],
    { x: MX + 0.28, y: 4.75, w: 5.2, h: 1.4, accent: C.blue, size: 12, lh: 1.5 });

  const specifics = [
    ["Cartografía del campus", "Modelar lugares, coordenadas y entradas peatonales."],
    ["Asistente RAG", "Recuperar y generar respuestas del corpus oficial."],
    ["Enrutamiento", "Camino más corto peatonal con grafo del campus."],
    ["Despliegue real", "Backend público y app instalable, reproducibles."],
  ];
  txt(s, "Objetivos específicos", { x: 6.95, y: 2.3, w: 6, h: 0.35, size: 12, color: C.blue, bold: true, spacing: 1 });
  specifics.forEach((o, i) => {
    const cy = 2.75 + i * 0.88;
    rect(s, { x: 6.95, y: cy, w: CW - 6.25, h: 0.75, round: true, radius: 0.06, fill: C.surface, lineColor: C.border });
    txt(s, String(i + 1), { x: 7.1, y: cy, w: 0.55, h: 0.75, size: 18, color: C.blue, bold: true, valign: "middle", align: "center" });
    txt(s, o[0], { x: 7.75, y: cy + 0.1, w: 4.7, h: 0.3, size: 12.5, color: C.white, bold: true });
    txt(s, o[1], { x: 7.75, y: cy + 0.4, w: 4.7, h: 0.3, size: 10, color: C.sub });
  });
})();

// ===========================================================================
// SECCIÓN: VISTA GENERAL
// ===========================================================================
divider("Vista general", "Panorama del proyecto", C.violet,
  "Arquitectura completa, servicios externos y el flujo de una consulta de extremo a extremo.", "01");

// --- Vista general: composición del sistema --------------------------------
(function overview() {
  const s = content("Vista general", "Composición del sistema", C.violet,
    "Dos grandes piezas —app móvil y backend RAG— apoyadas en servicios gestionados.", "Vista general");
  const zones = [
    { x: MX, w: 3.75, t: "APP MÓVIL", c: C.blue, items: ["Expo · React Native", "Mapa (Mapbox)", "Chat asistente", "Rutas peatonales", "Auth (Supabase)"] },
    { x: MX + 4.1, w: 3.75, t: "BACKEND RAG", c: C.teal, items: ["FastAPI (Python)", "Motor RAG", "Embeddings + pgvector", "LLM (Gemini)", "Guardrails"] },
    { x: MX + 8.2, w: CW - 8.2, t: "SERVICIOS", c: C.amber, items: ["Google Gemini AI", "Supabase (Postgres)", "Mapbox GL", "Render (hosting)"] },
  ];
  zones.forEach((z) => {
    card(s, { x: z.x, y: 2.35, w: z.w, h: 3.85, accent: z.c, title: z.t, tsize: 13 });
    z.items.forEach((it, i) => chip(s, z.x + 0.25, 2.95 + i * 0.58, z.w - 0.5, it, z.c, { size: 10.5 }));
  });
  arrow(s, MX + 3.75, 4.2, MX + 4.1, 4.2, C.sub, 1.75);
  arrow(s, MX + 7.85, 4.2, MX + 8.2, 4.2, C.sub, 1.75);
  tag(s, MX + 3.55, 3.78, 0.75, "HTTPS", C.muted);
  tag(s, MX + 7.65, 3.78, 0.75, "SDK", C.muted);
})();

// --- Arquitectura completa (LA grande) -------------------------------------
(function fullArch() {
  const s = content("Vista general", "Arquitectura completa", C.violet,
    "Recorrido de una petición: del dispositivo al backend, y de éste a los servicios de IA y datos.", "Vista general");
  // Capa cliente
  card(s, { x: MX, y: 2.25, w: 3.5, h: 2.0, accent: C.blue, title: "Cliente · Móvil", tsize: 12.5, tab: false });
  ["Chat UI", "Mapa Mapbox", "Rutas (grafo)", "Zustand · stores"].forEach((t, i) =>
    chip(s, MX + 0.22, 2.75 + i * 0.36, 3.05, t, C.blue, { size: 9, h: 0.3 }));

  // Backend
  card(s, { x: 5.35, y: 2.05, w: 3.55, h: 3.5, accent: C.teal, title: "Backend · Render", tsize: 12.5, tab: false });
  txt(s, "FastAPI · /api/chat", { x: 5.55, y: 2.5, w: 3.15, h: 0.3, size: 9.5, color: C.sub, italic: true });
  ["Guardrails", "Retriever (top-k)", "Detección de lugares", "LLM · generación", "Compose respuesta"].forEach((t, i) =>
    chip(s, 5.55, 2.85 + i * 0.5, 3.15, t, C.teal, { size: 9.5, h: 0.4 }));

  // Servicios externos (columna derecha)
  const svc = [
    ["Google Gemini", "LLM + embeddings", C.amber, 2.15],
    ["Supabase", "pgvector · Postgres", C.green, 3.35],
    ["Mapbox GL", "Teselas / mapa", C.blue, 4.55],
  ];
  svc.forEach((v) => {
    card(s, { x: 10.05, y: v[3], w: CW - 9.35, h: 1.0, accent: v[2], title: v[0], tsize: 12 });
    txt(s, v[1], { x: 10.27, y: v[3] + 0.5, w: 2.5, h: 0.4, size: 9.5, color: C.sub });
  });

  // Conexiones
  arrow(s, MX + 3.5, 3.25, 5.35, 3.25, C.sub, 1.75);
  tag(s, MX + 3.45, 2.85, 1.9, "REST · JSON", C.muted);
  arrow(s, 8.9, 3.05, 10.05, 2.65, C.amber, 1.5);
  arrow(s, 8.9, 3.6, 10.05, 3.85, C.green, 1.5);
  // Mapbox directo desde el cliente
  line(s, 2.45, 4.25, 2.45, 6.05, { color: C.blue, width: 1.25, dash: "dash" });
  arrow(s, 2.45, 6.05, 10.05, 5.05, C.blue, 1.25);
  tag(s, 4.7, 5.75, 3, "el cliente pide teselas directo a Mapbox", C.muted);

  // Pipeline offline
  rect(s, { x: MX, y: 4.55, w: 3.5, h: 1.05, round: true, radius: 0.06, fill: C.bgAlt, lineColor: C.violet, lineW: 1, dash: "dash" });
  txt(s, "Ingesta offline", { x: MX + 0.2, y: 4.65, w: 3, h: 0.3, size: 10.5, color: C.violet, bold: true });
  txt(s, "unmsm_info.md → chunks →\nembeddings → pgvector", { x: MX + 0.2, y: 4.95, w: 3.1, h: 0.6, size: 9, color: C.sub, lh: 1.2 });
  arrow(s, 3.6, 4.9, 10.05, 3.55, C.violet, 1);
})();

// --- Stack tecnológico -----------------------------------------------------
(function stack() {
  const s = content("Vista general", "Stack tecnológico", C.violet, null, "Vista general");
  const groups = [
    ["Frontend", C.blue, ["Expo ~54", "React Native 0.81", "React 19 · TypeScript", "React Navigation 7", "Zustand 5", "@rnmapbox/maps 10", "expo-location"]],
    ["Backend", C.teal, ["Python 3.11", "FastAPI 0.136", "Pydantic 2", "google-genai 2.10", "supabase-py 2.31", "Uvicorn", "Pytest"]],
    ["Datos & IA", C.amber, ["Gemini 2.5 Flash", "gemini-embedding-001", "Supabase · Postgres", "pgvector (HNSW)", "Mapbox GL", "Corpus oficial UNMSM"]],
    ["Infra & Dev", C.green, ["Render (blueprint)", "GitHub · monorepo", "Auto-deploy CI", "EAS / Expo build", "dotenv · secrets", "Docker (Supabase local)"]],
  ];
  const cardW = (CW - 0.4 * 3) / 4;
  groups.forEach((g, i) => {
    const cx = MX + i * (cardW + 0.4);
    card(s, { x: cx, y: 2.35, w: cardW, h: 3.9, accent: g[1], title: g[0], tsize: 13 });
    bulletBox(s, g[2], { x: cx + 0.25, y: 2.95, w: cardW - 0.45, h: 3.1, size: 11, lh: 1.4, psa: 6 });
  });
})();

// --- Diagrama de servicios -------------------------------------------------
(function services() {
  const s = content("Vista general", "Diagrama de servicios", C.violet,
    "Responsabilidad de cada servicio gestionado y cómo se conecta con el sistema.", "Vista general");
  // Núcleo
  s.addShape(S.ellipse, { x: 5.75, y: 3.35, w: 1.85, h: 1.85, fill: { color: C.surface2 }, line: { color: C.violet, width: 1.5 } });
  txt(s, "OndeSan\nMarcos", { x: 5.75, y: 3.35, w: 1.85, h: 1.85, size: 12, color: C.white, bold: true, align: "center", valign: "middle", lh: 1.05 });
  const nodes = [
    ["Render", "Hospeda el backend FastAPI\ny auto-despliega en cada push.", C.teal, 1.3, 2.35],
    ["Google Gemini", "LLM de generación y modelo\nde embeddings (768 dims).", C.amber, 9.2, 2.35],
    ["Supabase", "Postgres + pgvector para\nbúsqueda semántica y Auth.", C.green, 1.3, 4.55],
    ["Mapbox", "Teselas del mapa, estilo y\ncapas 3D del campus.", C.blue, 9.2, 4.55],
  ];
  nodes.forEach((n) => {
    card(s, { x: n[3], y: n[4], w: 2.85, h: 1.35, accent: n[2], title: n[0], tsize: 13 });
    txt(s, n[1], { x: n[3] + 0.24, y: n[4] + 0.52, w: 2.4, h: 0.8, size: 9.5, color: C.sub, lh: 1.2 });
  });
  arrow(s, 5.75, 3.9, 4.15, 3.0, C.teal, 1.25);
  arrow(s, 7.6, 3.9, 9.2, 3.0, C.amber, 1.25);
  arrow(s, 5.75, 4.6, 4.15, 5.1, C.green, 1.25);
  arrow(s, 7.6, 4.6, 9.2, 5.1, C.blue, 1.25);
})();

// --- Flujo de una consulta (secuencia) -------------------------------------
(function flow() {
  const s = content("Vista general", "Flujo de una consulta", C.violet,
    "\"¿A qué hora abre la biblioteca?\" — de la pregunta a la respuesta anclada.", "Vista general");
  const steps = [
    ["1", "Usuario", "Escribe la consulta en el chat de la app.", C.blue],
    ["2", "App móvil", "POST /api/chat { query } al backend en Render.", C.blue],
    ["3", "Guardrails", "¿Es del dominio UNMSM? Si no, declina.", C.teal],
    ["4", "Recuperación", "Embebe la consulta y busca en pgvector (coseno).", C.teal],
    ["5", "Gemini", "Genera la respuesta anclada al contexto recuperado.", C.amber],
    ["6", "Respuesta", "{ answer, locations, draw_route } de vuelta a la app.", C.blue],
  ];
  const y0 = 2.45, rowH = 0.6, gap = 0.08;
  steps.forEach((st, i) => {
    const cy = y0 + i * (rowH + gap);
    rect(s, { x: MX, y: cy, w: CW, h: rowH, round: true, radius: 0.06, fill: C.surface, lineColor: C.border });
    s.addShape(S.ellipse, { x: MX + 0.18, y: cy + 0.11, w: 0.38, h: 0.38, fill: { color: st[3] }, line: { type: "none" } });
    txt(s, st[0], { x: MX + 0.18, y: cy + 0.11, w: 0.38, h: 0.38, size: 13, color: C.bg, bold: true, align: "center", valign: "middle" });
    txt(s, st[1], { x: MX + 0.8, y: cy, w: 2.6, h: rowH, size: 13, color: C.white, bold: true, valign: "middle" });
    txt(s, st[2], { x: MX + 3.5, y: cy, w: CW - 3.7, h: rowH, size: 11.5, color: C.sub, valign: "middle" });
    if (i < steps.length - 1) arrow(s, MX + 0.37, cy + rowH, MX + 0.37, cy + rowH + gap, C.borderHi, 1);
  });
})();

// --- Modelo de despliegue --------------------------------------------------
(function deploy() {
  const s = content("Vista general", "Modelo de despliegue", C.violet,
    "Cada componente vive donde mejor rinde; el repositorio es la fuente de la verdad.", "Vista general");
  const cols = [
    ["Dispositivo del usuario", C.blue, ["App Expo / React Native", "Build con EAS", "Cachea mapa y estado local", "Pide teselas a Mapbox"]],
    ["Nube de aplicación", C.teal, ["Render · web service", "FastAPI + Uvicorn", "Blueprint render.yaml", "Auto-deploy en push a main"]],
    ["Nube de datos e IA", C.amber, ["Supabase · Postgres + pgvector", "Google Gemini API", "Secretos por variables de entorno", "Esquema reproducible (schema.sql)"]],
  ];
  const cardW = (CW - 0.5 * 2) / 3;
  cols.forEach((c, i) => {
    const cx = MX + i * (cardW + 0.5);
    card(s, { x: cx, y: 2.4, w: cardW, h: 3.65, accent: c[1], title: c[0], tsize: 13.5 });
    bulletBox(s, c[2], { x: cx + 0.25, y: 3.0, w: cardW - 0.45, h: 2.9, size: 11.5, lh: 1.45, psa: 7 });
    if (i < 2) arrow(s, cx + cardW, 4.2, cx + cardW + 0.5, 4.2, C.sub, 1.5);
  });
})();

// ===========================================================================
// SECCIÓN: FRONTEND
// ===========================================================================
divider("Frontend", "Aplicación móvil", C.blue,
  "Expo + React Native · mapa interactivo, asistente conversacional y enrutamiento peatonal.", "02");

// --- Frontend overview -----------------------------------------------------
(function feOverview() {
  const s = content("Frontend", "Visión general de la app", C.blue,
    "App multiplataforma construida con Expo; UI declarativa por features y estado global ligero.", "Frontend");
  bullets(s, [
    { h: "Multiplataforma:", t: "un solo código para Android e iOS con Expo / React Native." },
    { h: "Arquitectura por features:", t: "cada dominio (map, chat, routing, auth) es autocontenido." },
    { h: "Estado con Zustand:", t: "stores pequeños y desacoplados, sin boilerplate." },
    { h: "Mapa nativo:", t: "@rnmapbox/maps para rendimiento y capas 3D del campus." },
    { h: "Consume el backend:", t: "cliente HTTP tipado contra /api/chat, con modo mock de respaldo." },
  ], { x: MX, y: 2.4, w: 6.2, h: 3.7, accent: C.blue, size: 13, lh: 1.55 });

  card(s, { x: 7.35, y: 2.35, w: CW - 6.65, h: 3.9, accent: C.blue, title: "En números", tsize: 14 });
  const stats = [["5", "features de dominio"], ["4", "stores Zustand"], ["37+", "lugares del campus"], ["2", "modos: real / mock"]];
  stats.forEach((st, i) => {
    const cy = 2.95 + i * 0.8;
    txt(s, st[0], { x: 7.6, y: cy, w: 1.5, h: 0.6, size: 26, color: C.blue, bold: true, valign: "middle" });
    txt(s, st[1], { x: 9.1, y: cy, w: 3.3, h: 0.6, size: 12, color: C.sub, valign: "middle" });
  });
})();

// --- Frontend arquitectura por features (estructura) -----------------------
(function feStructure() {
  const s = content("Frontend", "Arquitectura por features", C.blue,
    "src/ organizado por dominio; el núcleo (core) y los servicios son transversales.", "Frontend");
  // core
  card(s, { x: MX, y: 2.3, w: CW, h: 0.95, accent: C.violet, title: "core/", tsize: 12.5, tab: false });
  ["navigation/", "store/ (Zustand)", "providers/"].forEach((t, i) => chip(s, MX + 0.25 + i * 3.9, 2.75, 3.6, t, C.violet, { size: 10 }));

  // features
  card(s, { x: MX, y: 3.45, w: CW, h: 1.5, accent: C.blue, title: "features/", tsize: 12.5, tab: false });
  const feats = ["auth/", "map/", "chat/", "routing/", "profile/"];
  const fw = (CW - 0.5 - 0.25 * (feats.length - 1)) / feats.length;
  feats.forEach((f, i) => {
    const cx = MX + 0.25 + i * (fw + 0.25);
    rect(s, { x: cx, y: 3.95, w: fw, h: 0.85, round: true, radius: 0.06, fill: C.surface2, lineColor: C.blue });
    txt(s, f, { x: cx, y: 3.98, w: fw, h: 0.3, size: 11, color: C.white, bold: true, align: "center" });
    txt(s, ["screens", "components", "hooks", "utils", "screens"][i], { x: cx, y: 4.28, w: fw, h: 0.3, size: 8.5, color: C.sub, align: "center" });
  });

  // services + shared
  card(s, { x: MX, y: 5.15, w: 6.3, h: 1.05, accent: C.teal, title: "services/", tsize: 12.5, tab: false });
  ["api/ (client, chatApi)", "supabase/ (auth, client)"].forEach((t, i) => chip(s, MX + 0.25 + i * 2.95, 5.62, 2.75, t, C.teal, { size: 9.5 }));
  card(s, { x: 7.35, y: 5.15, w: CW - 6.65, h: 1.05, accent: C.amber, title: "shared/ · theme/ · constants/", tsize: 12.5, tab: false });
  txt(s, "Componentes UI, tokens de tema, Config (env)", { x: 7.6, y: 5.62, w: 5.4, h: 0.4, size: 10, color: C.sub });
})();

// --- Frontend diagrama de módulos/clases -----------------------------------
(function feClasses() {
  const s = content("Frontend", "Diagrama de módulos (chat)", C.blue,
    "Cómo colaboran pantalla, hook, stores y cliente HTTP al enviar una consulta.", "Frontend");
  umlClass(s, { x: MX, y: 2.35, w: 3.05, accent: C.blue, name: "ChatScreen", stereo: "«screen»",
    attrs: ["- messages", "- inputText"], methods: ["+ sendMessage()", "+ renderMessage()"] });
  umlClass(s, { x: MX, y: 4.55, w: 3.05, accent: C.blue, name: "useChat", stereo: "«hook»",
    attrs: ["- chatState", "- isLoading"], methods: ["+ requestReply()", "+ retryMessage()"] });
  umlClass(s, { x: 4.75, y: 2.35, w: 3.05, accent: C.violet, name: "useChatStore", stereo: "«store»",
    attrs: ["- conversations[]", "- activeId"], methods: ["+ addMessage()", "+ startNew()"] });
  umlClass(s, { x: 4.75, y: 4.55, w: 3.05, accent: C.violet, name: "useMapStore", stereo: "«store»",
    attrs: ["- focusTarget", "- userLocation"], methods: ["+ setFocusTarget()"] });
  umlClass(s, { x: 9.05, y: 2.35, w: 3.15, accent: C.teal, name: "chatApi", stereo: "«service»",
    attrs: [], methods: ["+ sendChatQuery(q)", "  → normaliza snake→camel"] });
  umlClass(s, { x: 9.05, y: 4.15, w: 3.15, accent: C.teal, name: "apiClient", stereo: "«service»",
    attrs: ["- baseUrl", "- timeout 60s"], methods: ["+ post() · AbortController"] });

  arrow(s, MX + 1.5, 4.55, MX + 1.5, 4.05, C.borderHi, 1.25); // screen -> hook (usa)
  arrow(s, 3.05, 3.0, 4.75, 3.4, C.borderHi, 1.25); // screen -> chatStore
  arrow(s, 3.05, 5.3, 4.75, 5.4, C.borderHi, 1.25); // hook -> mapStore
  arrow(s, 3.05, 4.9, 9.05, 3.3, C.teal, 1.25); // hook -> chatApi
  arrow(s, 10.6, 4.15, 10.6, 3.62, C.borderHi, 1.25); // chatApi -> apiClient
  // (la flecha verde useChat→chatApi habla por sí sola; la caja chatApi ya rotula el método)
})();

// --- Frontend estado (Zustand) ---------------------------------------------
(function feState() {
  const s = content("Frontend", "Gestión de estado · Zustand", C.blue,
    "Cuatro stores independientes; se persiste lo necesario en AsyncStorage.", "Frontend");
  const stores = [
    ["useChatStore", "Conversaciones, mensajes, estado del chat e historial.", "AsyncStorage", C.blue],
    ["useMapStore", "focusTarget, ubicación del usuario, ruta activa, lugar enfocado.", "en memoria", C.teal],
    ["useThemeStore", "Tema claro/oscuro y color primario de la UI.", "AsyncStorage", C.violet],
    ["useAuthStore", "Sesión y perfil del usuario (vía Supabase Auth).", "sesión Supabase", C.amber],
  ];
  const cardW = (CW - 0.5) / 2, cardH = 1.7, gx = 0.5, gy = 0.35;
  stores.forEach((st, i) => {
    const cx = MX + (i % 2) * (cardW + gx);
    const cy = 2.4 + Math.floor(i / 2) * (cardH + gy);
    card(s, { x: cx, y: cy, w: cardW, h: cardH, accent: st[3], title: st[0], tsize: 14 });
    txt(s, st[1], { x: cx + 0.25, y: cy + 0.6, w: cardW - 0.5, h: 0.7, size: 11.5, color: C.sub, lh: 1.3 });
    chip(s, cx + 0.25, cy + cardH - 0.5, 1.9, "persist · " + st[2], st[3], { size: 8.5, h: 0.3 });
  });
})();

// --- Frontend navegación ---------------------------------------------------
(function feNav() {
  const s = content("Frontend", "Navegación", C.blue,
    "React Navigation: un stack de autenticación y, tras iniciar sesión, las pestañas principales.", "Frontend");
  card(s, { x: 5.35, y: 2.35, w: 2.65, h: 0.7, accent: C.violet, title: "AppNavigator", tsize: 12, tab: false });
  // Auth stack
  card(s, { x: MX + 0.4, y: 3.5, w: 2.9, h: 2.4, accent: C.amber, title: "AuthStack", tsize: 12.5 });
  ["Welcome", "Onboarding", "Login", "Register", "EmailSent"].forEach((t, i) => chip(s, MX + 0.6, 4.05 + i * 0.36, 2.5, t, C.amber, { size: 9, h: 0.3 }));
  // Main tabs
  card(s, { x: 5.35, y: 3.5, w: 2.65, h: 2.4, accent: C.blue, title: "MainTabs", tsize: 12.5 });
  ["Mapa", "Chat", "Perfil"].forEach((t, i) => chip(s, 5.55, 4.05 + i * 0.5, 2.25, t, C.blue, { size: 10, h: 0.4 }));
  // Profile stack
  card(s, { x: 9.3, y: 3.5, w: 2.75, h: 2.4, accent: C.teal, title: "ProfileStack", tsize: 12.5 });
  ["Perfil", "Editar perfil", "Tema", "Notificaciones"].forEach((t, i) => chip(s, 9.5, 4.05 + i * 0.44, 2.35, t, C.teal, { size: 9, h: 0.34 }));

  arrow(s, 6.1, 3.05, 4.4, 3.5, C.borderHi, 1.25);
  tag(s, 3.9, 3.15, 1.6, "sin sesión", C.muted);
  arrow(s, 6.67, 3.05, 6.67, 3.5, C.borderHi, 1.25);
  tag(s, 6.7, 3.12, 1.9, "con sesión", C.muted);
  arrow(s, 8.0, 4.7, 9.3, 4.7, C.borderHi, 1.25);
})();

// --- Feature Mapa ----------------------------------------------------------
(function feMap() {
  const s = content("Frontend · Feature", "Mapa interactivo", C.blue,
    "El corazón visual: ubica lugares, sigue al usuario y dibuja rutas sobre Mapbox.", "Frontend");
  bullets(s, [
    { h: "Mapbox nativo:", t: "estilo del campus, capas 3D de edificios y marcadores por categoría." },
    { h: "Ubicación en vivo:", t: "expo-location + brújula para seguir y orientar al usuario." },
    { h: "Ficha de lugar:", t: "horario, servicios y acción \"cómo llegar\" al tocar un punto." },
    { h: "Modos:", t: "libre, guía y selección de ruta (origen → destino)." },
  ], { x: MX, y: 2.4, w: 7.1, h: 3.6, accent: C.blue, size: 13, lh: 1.55 });
  phoneShot(s, { x: 9.55, y: 2.35, w: 2.55, h: 3.85, accent: C.blue, label: "Pantalla del mapa\ncon marcadores y ruta", caption: "MapScreen" });
})();

// --- Feature Chat ----------------------------------------------------------
(function feChat() {
  const s = content("Frontend · Feature", "Asistente conversacional", C.blue,
    "Chat que consume el backend RAG y, si detecta intención de ruta, salta al mapa.", "Frontend");
  bullets(s, [
    { h: "Consultas en lenguaje natural:", t: "\"¿dónde queda la biblioteca?\", \"horario del comedor\"." },
    { h: "Respuestas ancladas:", t: "muestra tarjetas de lugar con \"Ver en mapa\"." },
    { h: "Chat → Mapa (HU-2.3):", t: "\"cómo llego a…\" fija el destino y dibuja la ruta." },
    { h: "Resiliencia:", t: "timeout de 60 s, botón Reintentar y modo mock de respaldo." },
  ], { x: MX, y: 2.4, w: 7.1, h: 3.6, accent: C.blue, size: 13, lh: 1.55 });
  phoneShot(s, { x: 9.55, y: 2.35, w: 2.55, h: 3.85, accent: C.blue, label: "Conversación con\ntarjetas de lugar", caption: "ChatScreen" });
})();

// --- Feature Routing -------------------------------------------------------
(function feRouting() {
  const s = content("Frontend · Feature", "Enrutamiento peatonal", C.blue,
    "El camino más corto se calcula en el dispositivo sobre un grafo del campus.", "Frontend");
  const stepsX = MX;
  card(s, { x: stepsX, y: 2.4, w: 5.9, h: 3.75, accent: C.blue, title: "Cómo funciona", tsize: 14 });
  bullets(s, [
    { h: "Grafo del campus:", t: "nodos y aristas de caminos (rutas-caminos.json)." },
    { h: "Dijkstra:", t: "pathfinder.ts calcula el camino mínimo origen→destino." },
    { h: "Distancia real:", t: "suma de tramos con fórmula de Haversine." },
    { h: "Entradas peatonales:", t: "prioriza la entrada del lugar, no su centro." },
    { h: "100% cliente:", t: "sin llamada al backend → respuesta instantánea." },
  ], { x: stepsX + 0.25, y: 3.0, w: 5.45, h: 3.0, accent: C.blue, size: 12, lh: 1.5 });

  // mini flujo
  const fx = 7.15, fy = 2.85;
  const nodes = ["Origen", "Grafo", "Dijkstra", "Polyline"];
  nodes.forEach((n, i) => {
    const cy = fy + i * 0.85;
    rect(s, { x: fx, y: cy, w: 4.3, h: 0.6, round: true, radius: 0.06, fill: C.surface, lineColor: C.blue });
    txt(s, n, { x: fx + 0.2, y: cy, w: 4, h: 0.6, size: 12, color: C.white, bold: true, valign: "middle" });
    if (i < nodes.length - 1) arrow(s, fx + 2.15, cy + 0.6, fx + 2.15, cy + 0.85, C.borderHi, 1.25);
  });
})();

// --- Feature Auth ----------------------------------------------------------
(function feAuth() {
  const s = content("Frontend · Feature", "Autenticación", C.blue,
    "Registro e inicio de sesión gestionados por Supabase Auth desde el cliente.", "Frontend");
  bullets(s, [
    { h: "Supabase Auth:", t: "email/contraseña con verificación por correo." },
    { h: "Flujo dedicado:", t: "Welcome → Onboarding → Login / Register → EmailSent." },
    { h: "Sesión persistida:", t: "el usuario permanece autenticado entre aperturas." },
    { h: "Perfil editable:", t: "nombre, correo y preferencias de tema." },
  ], { x: MX, y: 2.4, w: 7.1, h: 3.6, accent: C.blue, size: 13, lh: 1.55 });
  phoneShot(s, { x: 9.55, y: 2.35, w: 2.55, h: 3.85, accent: C.blue, label: "Pantallas de\nWelcome / Login", caption: "AuthStack" });
})();

// --- Frontend integración con backend --------------------------------------
(function feIntegration() {
  const s = content("Frontend", "Integración con el backend", C.blue,
    "El cliente HTTP traduce el contrato del backend al modelo del frontend.", "Frontend");
  const boxes = [
    ["useChat", "Orquesta el envío y\nla respuesta en la UI.", C.blue, MX],
    ["chatApi", "sendChatQuery():\nPOST /api/chat.", C.teal, MX + 3.15],
    ["apiClient", "fetch + timeout 60 s\n(AbortController).", C.teal, MX + 6.3],
    ["Backend", "Render · FastAPI\n/api/chat.", C.amber, MX + 9.45],
  ];
  boxes.forEach((b, i) => {
    card(s, { x: b[3], y: 2.7, w: 2.75, h: 1.5, accent: b[2], title: b[0], tsize: 13 });
    txt(s, b[1], { x: b[3] + 0.24, y: 3.2, w: 2.3, h: 0.9, size: 10, color: C.sub, lh: 1.25 });
    if (i < boxes.length - 1) arrow(s, b[3] + 2.75, 3.45, b[3] + 3.15, 3.45, C.sub, 1.5);
  });
  card(s, { x: MX, y: 4.75, w: CW, h: 1.45, accent: C.blue, title: "Normalización del contrato", tsize: 13 });
  txt(s, "Backend (snake_case):  { answer, locations, draw_route, destination }", { x: MX + 0.3, y: 5.3, w: 11, h: 0.35, size: 12, color: C.sub, font: FONT });
  arrow(s, MX + 3.5, 5.68, MX + 4.2, 5.68, C.blue, 1.5);
  txt(s, "Frontend (camelCase):  { answer, locations, drawRoute, destination }", { x: MX + 0.3, y: 5.75, w: 11, h: 0.35, size: 12, color: C.text, font: FONT });
})();

// --- Frontend pantallas (placeholders) -------------------------------------
(function feScreens() {
  const s = content("Frontend", "Pantallas de la app", C.blue,
    "Espacios reservados para las capturas reales de la aplicación en el dispositivo.", "Frontend");
  const shots = [
    ["Mapa + marcadores", "MapScreen"],
    ["Ficha de lugar", "MapPlaceInfoCard"],
    ["Chat asistente", "ChatScreen"],
    ["Ruta trazada", "MapRouteInfoCard"],
    ["Login / Perfil", "AuthStack"],
  ];
  const w = 2.15, gap = (CW - w * 5) / 4;
  shots.forEach((sh, i) => {
    phoneShot(s, { x: MX + i * (w + gap), y: 2.4, w, h: 3.55, accent: C.blue, label: sh[0], caption: sh[1] });
  });
})();

// ===========================================================================
// SECCIÓN: BACKEND
// ===========================================================================
divider("Backend", "API RAG", C.teal,
  "FastAPI + Gemini + pgvector · recuperación semántica sobre el conocimiento oficial del campus.", "03");

// --- Backend overview ------------------------------------------------------
(function beOverview() {
  const s = content("Backend", "Visión general del backend", C.teal,
    "Un servicio FastAPI que implementa RAG: recupera contexto verificado y genera respuestas con un LLM.", "Backend");
  bullets(s, [
    { h: "RAG (Retrieval-Augmented Generation):", t: "el LLM responde solo con contexto recuperado del corpus." },
    { h: "Proveedores intercambiables:", t: "mock (tests, offline) o real (Gemini + pgvector) tras una interfaz." },
    { h: "Contrato mínimo:", t: "GET /health y POST /api/chat; errores de proveedor → HTTP 503." },
    { h: "Corpus oficial:", t: "37+ lugares y 41 documentos derivados de un doc verificado del campus." },
  ], { x: MX, y: 2.4, w: 6.2, h: 3.7, accent: C.teal, size: 13, lh: 1.55 });

  card(s, { x: 7.35, y: 2.35, w: CW - 6.65, h: 3.9, accent: C.teal, title: "Principios de diseño", tsize: 14 });
  bullets(s, [
    "Interfaces antes que implementaciones",
    "Anclaje: nunca inventar datos del campus",
    "Degradación elegante (503, no 500)",
    "Tests herméticos (mock, sin red)",
    "Reproducible: fuente única de la verdad",
  ], { x: 7.6, y: 2.95, w: 5.1, h: 3.2, accent: C.teal, size: 12, lh: 1.7 });
})();

// --- Backend arquitectura en capas -----------------------------------------
(function beLayers() {
  const s = content("Backend", "Arquitectura en capas", C.teal,
    "De la petición HTTP al motor RAG y sus proveedores, cada capa con una única responsabilidad.", "Backend");
  const layers = [
    ["API", "main.py · api/chat.py — enrutado FastAPI, CORS, manejo de errores 503.", C.blue],
    ["Esquemas", "schemas/chat.py — contrato Pydantic: ChatRequest / ChatResponse.", C.violet],
    ["Motor RAG", "rag/engine.py — orquesta guardrails → retrieve → places → LLM → compose.", C.teal],
    ["Proveedores", "rag/providers.py — elige mock vs real (Gemini, PgVectorRetriever).", C.amber],
    ["Conocimiento", "knowledge/ — corpus.py, places.py y fuentes (unmsm_info.md).", C.green],
  ];
  const y0 = 2.4, rowH = 0.72, gap = 0.1;
  layers.forEach((l, i) => {
    const cy = y0 + i * (rowH + gap);
    rect(s, { x: MX, y: cy, w: CW, h: rowH, round: true, radius: 0.06, fill: C.surface, lineColor: C.border });
    rect(s, { x: MX, y: cy + 0.1, w: 0.06, h: rowH - 0.2, fill: l[2], line: false });
    txt(s, l[0], { x: MX + 0.3, y: cy, w: 2.6, h: rowH, size: 14, color: l[2], bold: true, valign: "middle" });
    txt(s, l[1], { x: MX + 3.0, y: cy, w: CW - 3.2, h: rowH, size: 11.5, color: C.sub, valign: "middle" });
  });
})();

// --- Backend diagrama de clases --------------------------------------------
(function beClasses() {
  const s = content("Backend", "Diagrama de clases · motor RAG", C.teal,
    "El motor depende de interfaces (Protocol), no de implementaciones concretas.", "Backend");
  umlClass(s, { x: 5.05, y: 2.3, w: 3.25, accent: C.teal, name: "RAGEngine",
    attrs: ["- retriever: SupportsRetrieve", "- llm: LLMProvider", "- top_k, score_threshold"],
    methods: ["+ answer(query): ChatResponse", "- _detect_places()", "- _compose()"] });

  umlClass(s, { x: MX, y: 5.0, w: 3.0, accent: C.violet, stereo: "«Protocol»", name: "SupportsRetrieve",
    attrs: [], methods: ["+ retrieve(q, top_k)"] });
  umlClass(s, { x: 9.35, y: 5.0, w: 3.0, accent: C.violet, stereo: "«Protocol»", name: "LLMProvider",
    attrs: [], methods: ["+ generate(q, ctx)"] });

  umlClass(s, { x: MX, y: 6.35, w: 3.0, accent: C.teal, name: "PgVectorRetriever", attrs: [], methods: [] });
  umlClass(s, { x: 3.35, y: 6.35, w: 2.4, accent: C.sub, name: "Retriever (mock)", attrs: [], methods: [] });
  umlClass(s, { x: 9.35, y: 6.35, w: 2.0, accent: C.teal, name: "GeminiLLM", attrs: [], methods: [] });
  umlClass(s, { x: 11.45, y: 6.35, w: 1.85, accent: C.sub, name: "TemplateLLM", attrs: [], methods: [] });

  // relaciones
  arrow(s, 5.6, 5.0, 2.4, 3.05, C.teal, 1.25); // engine -> SupportsRetrieve (usa)
  arrow(s, 7.7, 5.0, 10.4, 3.05, C.teal, 1.25); // engine -> LLMProvider
  line(s, 1.7, 6.35, 1.7, 5.9, { color: C.violet, width: 1.25, end: "triangle" }); // pgvector -> protocol (impl)
  line(s, 4.5, 6.35, 2.3, 5.9, { color: C.sub, width: 1, end: "triangle" });
  line(s, 10.2, 6.35, 10.6, 5.9, { color: C.violet, width: 1.25, end: "triangle" });
  line(s, 12.2, 6.35, 11.2, 5.9, { color: C.sub, width: 1, end: "triangle" });
  tag(s, 2.7, 3.9, 2.6, "usa (top-k coseno)", C.muted);
  tag(s, 7.8, 3.9, 2.6, "usa (generación)", C.muted);
})();

// --- Backend pipeline RAG --------------------------------------------------
(function bePipeline() {
  const s = content("Backend", "Pipeline RAG de una consulta", C.teal,
    "engine.answer(query) recorre cinco etapas antes de componer la respuesta.", "Backend");
  const stages = [
    ["Guardrails", "¿dominio UNMSM?", C.red],
    ["Retrieve", "top-k por coseno", C.teal],
    ["Detección lugares", "keywords + top doc", C.blue],
    ["LLM", "Gemini genera", C.amber],
    ["Compose", "answer + locations", C.green],
  ];
  const bw = 2.15, gap = (CW - bw * 5) / 4, y = 2.95;
  stages.forEach((st, i) => {
    const cx = MX + i * (bw + gap);
    rect(s, { x: cx, y, w: bw, h: 1.5, round: true, radius: 0.08, fill: C.surface, lineColor: st[2], lineW: 1.25 });
    txt(s, String(i + 1), { x: cx + 0.15, y: y + 0.12, w: 0.5, h: 0.4, size: 13, color: st[2], bold: true });
    txt(s, st[0], { x: cx + 0.15, y: y + 0.55, w: bw - 0.3, h: 0.4, size: 12.5, color: C.white, bold: true, align: "center" });
    txt(s, st[1], { x: cx + 0.15, y: y + 0.98, w: bw - 0.3, h: 0.4, size: 9.5, color: C.sub, align: "center" });
    if (i < stages.length - 1) arrow(s, cx + bw, y + 0.75, cx + bw + gap, y + 0.75, C.borderHi, 1.5);
  });
  card(s, { x: MX, y: 4.9, w: CW, h: 1.3, accent: C.teal, title: "Salvaguardas", tsize: 13 });
  txt(s, "Si guardrails rechaza → mensaje fuera de alcance.   Si no hay contexto ni lugares → \"no tengo esa información oficial\".   El LLM solo ve el contexto recuperado (no responde de memoria).",
    { x: MX + 0.3, y: 5.45, w: CW - 0.6, h: 0.7, size: 11.5, color: C.sub, lh: 1.35 });
})();

// --- Backend ingesta & embeddings ------------------------------------------
(function beIngest() {
  const s = content("Backend", "Ingesta y embeddings", C.teal,
    "Proceso offline que convierte el documento oficial en vectores consultables.", "Backend");
  const stages = [
    ["unmsm_info.md", "Documento oficial\nverificado del campus", C.green],
    ["load + split", "Troceado con\nsolapamiento (chunks)", C.blue],
    ["Gemini embed", "gemini-embedding-001\n768 dims · normalizado", C.amber],
    ["pgvector", "Tabla documents\n+ índice HNSW coseno", C.teal],
  ];
  const bw = 2.75, gap = (CW - bw * 4) / 3, y = 2.95;
  stages.forEach((st, i) => {
    const cx = MX + i * (bw + gap);
    card(s, { x: cx, y, w: bw, h: 1.7, accent: st[2], title: st[0], tsize: 12.5 });
    txt(s, st[1], { x: cx + 0.22, y: y + 0.58, w: bw - 0.4, h: 0.95, size: 10.5, color: C.sub, lh: 1.3 });
    if (i < stages.length - 1) arrow(s, cx + bw, y + 0.85, cx + bw + gap, y + 0.85, C.sub, 1.5);
  });
  txt(s, "python -m app.rag.ingest_pgvector", { x: MX, y: 5.1, w: 6, h: 0.4, size: 12, color: C.teal, bold: true, font: FONT });
  txt(s, "Asimetría de tareas: los documentos se embeben como RETRIEVAL_DOCUMENT y la consulta como RETRIEVAL_QUERY para mejor recuperación.",
    { x: MX, y: 5.55, w: CW, h: 0.6, size: 11, color: C.sub, lh: 1.3, italic: true });
})();

// --- Backend pgvector / Supabase (placeholder) -----------------------------
(function bePgvector() {
  const s = content("Backend", "Base de datos · Supabase pgvector", C.teal,
    "Postgres con la extensión vector: búsqueda por similitud coseno vía función RPC.", "Backend");
  card(s, { x: MX, y: 2.4, w: 6.0, h: 3.8, accent: C.teal, title: "Esquema (db/schema.sql)", tsize: 13.5 });
  const schema = [
    "extension vector",
    "table documents (",
    "   id bigint,",
    "   content text,",
    "   metadata jsonb  → { place_id, … },",
    "   embedding vector(768) )",
    "index HNSW · vector_cosine_ops",
    "function match_documents(query, k)",
    "   → similarity = 1 − distancia",
  ];
  txt(s, schema.map((t) => ({ text: t, options: { breakLine: true } })), {
    x: MX + 0.28, y: 2.95, w: 5.5, h: 3.1, size: 11.5, color: C.text, lh: 1.4, font: FONT,
  });
  browserShot(s, { x: 6.9, y: 2.4, w: CW - 6.2, h: 3.8, accent: C.teal, url: "supabase.com/dashboard · Table editor",
    label: "CAPTURA · SUPABASE",
    desc: "Tabla documents poblada (48 fragmentos)\ny la función match_documents en el editor SQL." });
})();

// --- Backend LLM + guardrails ----------------------------------------------
(function beLLM() {
  const s = content("Backend", "LLM, guardrails e intención", C.teal,
    "El modelo genera; las reglas acotan el alcance y detectan la intención de navegar.", "Backend");
  const cols = [
    ["LLM · Gemini", C.amber, ["gemini-2.5-flash", "system prompt anclado", "temperature 0.2", "solo usa el contexto", "máx. 600 tokens"]],
    ["Guardrails", C.red, ["Filtro de dominio UNMSM", "coincidencia por palabra", "declina fuera de alcance", "mensaje claro al usuario"]],
    ["Intención de ruta", C.blue, ["wants_route(query)", "\"cómo llego\", \"llévame\"", "activa draw_route", "devuelve destination"]],
  ];
  const cardW = (CW - 0.5 * 2) / 3;
  cols.forEach((c, i) => {
    const cx = MX + i * (cardW + 0.5);
    card(s, { x: cx, y: 2.4, w: cardW, h: 3.75, accent: c[1], title: c[0], tsize: 13.5 });
    bulletBox(s, c[2], { x: cx + 0.25, y: 3.0, w: cardW - 0.45, h: 3.0, size: 11.5, lh: 1.45, psa: 8 });
  });
})();

// --- Backend pipeline de conocimiento (tooling) ----------------------------
(function beKnowledge() {
  const s = content("Backend", "Pipeline de conocimiento", C.teal,
    "Herramientas para mantener el corpus al día con el mapa — con revisión humana antes de subir.", "Backend");
  const stages = [
    ["Google Places", "fetch_places · datos\nreales (grounding)", C.amber],
    ["build_unmsm_ts", "mapea lugares a\ncoordenadas", C.blue],
    ["find_gaps", "lugares en el mapa\nausentes del corpus", C.violet],
    ["Revisión humana", "se verifica la\nveracidad", C.red],
    ["upload_entries", "inserta / actualiza\nen pgvector", C.teal],
  ];
  const bw = 2.15, gap = (CW - bw * 5) / 4, y = 2.95;
  stages.forEach((st, i) => {
    const cx = MX + i * (bw + gap);
    rect(s, { x: cx, y, w: bw, h: 1.6, round: true, radius: 0.08, fill: C.surface, lineColor: st[2], lineW: 1.25 });
    txt(s, st[0], { x: cx + 0.15, y: y + 0.18, w: bw - 0.3, h: 0.6, size: 11.5, color: C.white, bold: true, align: "center", valign: "middle" });
    txt(s, st[1], { x: cx + 0.12, y: y + 0.82, w: bw - 0.24, h: 0.7, size: 9, color: C.sub, align: "center", lh: 1.2 });
    if (i < stages.length - 1) arrow(s, cx + bw, y + 0.8, cx + bw + gap, y + 0.8, C.borderHi, 1.5);
  });
  txt(s, "Principio: el LLM redacta borradores, pero un humano verifica antes de que entren al corpus. Nada de datos inventados en producción.",
    { x: MX, y: 5.05, w: CW, h: 0.7, size: 12, color: C.sub, italic: true, lh: 1.35, align: "center" });
})();

// --- Backend contrato API --------------------------------------------------
(function beContract() {
  const s = content("Backend", "Contrato de la API · /api/chat", C.teal,
    "Un endpoint simple y estable; el frontend solo necesita enviar la consulta.", "Backend");
  card(s, { x: MX, y: 2.4, w: 5.9, h: 3.8, accent: C.blue, title: "Petición", tsize: 13.5 });
  txt(s, "POST /api/chat", { x: MX + 0.28, y: 2.95, w: 5, h: 0.3, size: 12, color: C.blue, bold: true, font: FONT });
  txt(s, "{\n   \"query\": \"¿cómo llego al rectorado?\"\n}", { x: MX + 0.28, y: 3.35, w: 5.4, h: 1, size: 12, color: C.text, font: FONT, lh: 1.35 });
  line(s, MX + 0.28, 4.55, MX + 5.6, 4.55, { color: C.border });
  txt(s, "GET /health → { status, service, version }", { x: MX + 0.28, y: 4.7, w: 5.4, h: 0.4, size: 11, color: C.sub, font: FONT });
  txt(s, "Errores de proveedor → HTTP 503 (Reintentar)", { x: MX + 0.28, y: 5.25, w: 5.4, h: 0.4, size: 11, color: C.sub, font: FONT });

  card(s, { x: 6.9, y: 2.4, w: CW - 6.2, h: 3.8, accent: C.teal, title: "Respuesta", tsize: 13.5 });
  const resp = [
    "{",
    "   \"answer\": \"El Rectorado… trazo la ruta.\",",
    "   \"locations\": [",
    "      { \"id\": \"rectorado\",",
    "        \"name\": \"Rectorado\",",
    "        \"schedule\": \"Lun–Vie 8:00–16:00\" } ],",
    "   \"draw_route\": true,",
    "   \"destination\": { \"latitude\": -12.0566,",
    "                    \"longitude\": -77.0862 }",
    "}",
  ];
  txt(s, resp.map((t) => ({ text: t, options: { breakLine: true } })), {
    x: 7.15, y: 2.95, w: 5.6, h: 3.2, size: 11, color: C.text, font: FONT, lh: 1.32,
  });
})();

// --- Backend despliegue Render (placeholder) -------------------------------
(function beRender() {
  const s = content("Backend", "Despliegue en Render", C.teal,
    "Infraestructura como código: render.yaml describe el servicio y se despliega solo.", "Backend");
  card(s, { x: MX, y: 2.4, w: 5.6, h: 3.8, accent: C.teal, title: "render.yaml (blueprint)", tsize: 13 });
  bullets(s, [
    { h: "rootDir:", t: "backend/ (monorepo)." },
    { h: "build:", t: "instala core + LLM + pgvector." },
    { h: "start:", t: "uvicorn app.main:app." },
    { h: "healthCheck:", t: "/health." },
    { h: "autoDeploy:", t: "cada push a main redepliega." },
    { h: "secretos:", t: "LLM_API_KEY, SUPABASE_SERVICE_KEY (sync:false)." },
  ], { x: MX + 0.25, y: 3.0, w: 5.15, h: 3.1, accent: C.teal, size: 11.5, lh: 1.45 });
  browserShot(s, { x: 6.9, y: 2.4, w: CW - 6.2, h: 3.8, accent: C.teal, url: "dashboard.render.com · ondesanmarcos-backend",
    label: "CAPTURA · RENDER",
    desc: "Panel del servicio: estado \"Live\", logs del\ndeploy y variables de entorno configuradas." });
})();

// --- Backend seguridad & configuración -------------------------------------
(function beSecurity() {
  const s = content("Backend", "Seguridad y configuración", C.teal,
    "Configuración por variables de entorno; los secretos nunca viven en el repositorio.", "Backend");
  const cols = [
    ["Configuración", C.blue, ["pydantic-settings", "RAG_USE_MOCK (real/mock)", "LLM_PROVIDER / LLM_MODEL", "RAG_TOP_K, score_threshold", "CORS_ORIGINS"]],
    ["Secretos", C.red, [".env en .gitignore", "LLM_API_KEY (Gemini)", "SUPABASE_SERVICE_KEY", "solo en dashboard de Render", "rotación ante exposición"]],
    ["Calidad", C.green, ["tests herméticos (mock)", "sin red en CI", "503 en vez de 500", "esquema reproducible", "fuente única de verdad"]],
  ];
  const cardW = (CW - 0.5 * 2) / 3;
  cols.forEach((c, i) => {
    const cx = MX + i * (cardW + 0.5);
    card(s, { x: cx, y: 2.4, w: cardW, h: 3.75, accent: c[1], title: c[0], tsize: 13.5 });
    bulletBox(s, c[2], { x: cx + 0.25, y: 3.0, w: cardW - 0.45, h: 3.0, size: 11.5, lh: 1.45, psa: 8 });
  });
})();

// ===========================================================================
// DEMO
// ===========================================================================
(function demo() {
  PAGE += 1;
  const s = newSlide(C.bg);
  rect(s, { x: 0, y: 0, w: PAGE_W, h: PAGE_H, fill: false, lineColor: C.amber, lineW: 2 });
  rect(s, { x: 0.25, y: 0.25, w: PAGE_W - 0.5, h: PAGE_H - 0.5, fill: false, lineColor: C.surface2, lineW: 1 });
  txt(s, "▶", { x: 0, y: 2.35, w: PAGE_W, h: 1.2, size: 60, color: C.amber, align: "center" });
  txt(s, "DEMO", { x: 0, y: 3.5, w: PAGE_W, h: 1.2, size: 84, color: C.white, bold: true, align: "center", spacing: 8 });
  txt(s, "OndeSanMarcos en funcionamiento", { x: 0, y: 5.0, w: PAGE_W, h: 0.5, size: 18, color: C.sub, align: "center" });
  const tags = ["Chat en vivo", "Mapa + ruta", "Backend real"];
  const tw = 2.3, gap = 0.4, totalW = tw * 3 + gap * 2, startX = (PAGE_W - totalW) / 2;
  tags.forEach((t, i) => chip(s, startX + i * (tw + gap), 5.6, tw, t, C.amber, { size: 12, h: 0.44, color: C.text }));
  footer(s, "Demo", C.amber);
})();

// ===========================================================================
// CIERRE
// ===========================================================================
(function conclusions() {
  const s = content("Cierre", "Conclusiones", C.green, null, "Conclusiones");
  bullets(s, [
    { h: "Producto funcional:", t: "app móvil + backend RAG desplegado y consumido de extremo a extremo." },
    { h: "Respuestas confiables:", t: "RAG anclado al corpus oficial evita que el asistente invente datos." },
    { h: "Recuperación semántica:", t: "pgvector encuentra por significado, no solo por palabras exactas." },
    { h: "Arquitectura limpia:", t: "interfaces y proveedores permiten crecer sin reescribir el motor." },
    { h: "Reproducible:", t: "infraestructura como código y una única fuente de verdad del conocimiento." },
  ], { x: MX, y: 2.4, w: 7.2, h: 3.7, accent: C.green, size: 13, lh: 1.6 });

  card(s, { x: 8.35, y: 2.35, w: CW - 7.65, h: 3.9, accent: C.green, title: "Logros clave", tsize: 14 });
  const kpis = [["37+", "lugares del campus"], ["768", "dims por embedding"], ["2", "proveedores (mock/real)"], ["1", "endpoint que lo une todo"]];
  kpis.forEach((k, i) => {
    const cy = 2.95 + i * 0.8;
    txt(s, k[0], { x: 8.6, y: cy, w: 1.5, h: 0.6, size: 24, color: C.green, bold: true, valign: "middle" });
    txt(s, k[1], { x: 10.0, y: cy, w: 2.6, h: 0.6, size: 11, color: C.sub, valign: "middle" });
  });
})();

(function future() {
  const s = content("Cierre", "Trabajo futuro", C.green, null, "Conclusiones");
  const items = [
    ["Consumo de rutas del chat", "Usar la entrada peatonal real que ya conoce el frontend.", C.blue],
    ["Afinar umbral de recuperación", "Calibrar score_threshold para embeddings densos.", C.teal],
    ["Guardrail semántico", "No bloquear consultas válidas antes de recuperar.", C.teal],
    ["Escala del LLM", "Habilitar billing de Gemini para uso en producción.", C.amber],
    ["Cobertura del corpus", "Cerrar gaps mapa↔corpus con el pipeline de conocimiento.", C.violet],
    ["Pruebas de frontend", "Ampliar cobertura de la app móvil.", C.green],
  ];
  const cardW = (CW - 0.5) / 2, cardH = 1.1, gx = 0.5, gy = 0.25;
  items.forEach((it, i) => {
    const cx = MX + (i % 2) * (cardW + gx);
    const cy = 2.35 + Math.floor(i / 2) * (cardH + gy);
    card(s, { x: cx, y: cy, w: cardW, h: cardH, accent: it[2], title: it[0], tsize: 13 });
    txt(s, it[1], { x: cx + 0.24, y: cy + 0.52, w: cardW - 0.45, h: 0.5, size: 11, color: C.sub, lh: 1.2 });
  });
})();

(function thanks() {
  PAGE += 1;
  const s = newSlide(C.bg);
  rect(s, { x: 9.7, y: 4.3, w: 4.6, h: 4.6, round: true, radius: 0.4, fill: false, lineColor: C.blueDim, lineW: 1.5 });
  rect(s, { x: 10.9, y: -1.0, w: 3.4, h: 3.4, round: true, radius: 0.4, fill: false, lineColor: C.tealDim, lineW: 1.5 });
  txt(s, "Gracias", { x: MX - 0.03, y: 2.6, w: 11, h: 1.4, size: 76, color: C.white, bold: true });
  txt(s, "¿Preguntas?", { x: MX, y: 4.05, w: 9, h: 0.6, size: 22, color: C.blue });
  line(s, MX, 4.95, MX + 4.6, 4.95, { color: C.border });
  txt(s, "OndeSanMarcos · Equipo anycodef · UNMSM", { x: MX, y: 5.1, w: 9, h: 0.4, size: 13, color: C.sub });
  txt(s, "github.com · monorepo (frontend + backend)   ·   backend en Render", { x: MX, y: 5.5, w: 10, h: 0.4, size: 11, color: C.muted });
  footer(s, null, C.blue);
})();

// ---------------------------------------------------------------------------
// El .pptx se versiona en la raíz de presentation/ (dist/ queda para el PDF
// intermedio de verificación, que está en .gitignore).
const outFile = path.join(__dirname, "OndeSanMarcos.pptx");
pptx.writeFile({ fileName: outFile }).then(() => {
  console.log(`OK · ${PAGE} slides → ${outFile}`);
});
