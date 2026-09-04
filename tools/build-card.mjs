/* =============================================================================
   Cartao de apresentacao ElektroSys — gera SVG (RGB) e PDF (CMYK) da frente
   e do verso a partir de um unico modelo geometrico em milimetros.

   Formato (design.md > "Aplicacao em cartao de apresentacao"):
     corte final 90 x 50 mm | sangria 3 mm | area segura 4 mm dentro do corte

   Uso: node tools/build-card.mjs
   ============================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'brand/business-card');
fs.mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.config.json'), 'utf8'));

/* -------------------------------------------------------------------------- */
/* Geometria                                                                   */
/* -------------------------------------------------------------------------- */
const TRIM_W = 90, TRIM_H = 50;
const BLEED = 3;
const SAFE = 4;                                   // dentro do corte
const W = TRIM_W + BLEED * 2;                     // 96
const H = TRIM_H + BLEED * 2;                     // 56
const SAFE_L = BLEED + SAFE;                      // 7
const SAFE_T = BLEED + SAFE;                      // 7
const SAFE_R = W - BLEED - SAFE;                  // 89
const SAFE_B = H - BLEED - SAFE;                  // 49

const MM_TO_PT = 72 / 25.4;
const mm = (v) => v * MM_TO_PT;

/* -------------------------------------------------------------------------- */
/* Cores — RGB conforme design.md, CMYK derivado para producao grafica         */
/* -------------------------------------------------------------------------- */
const RGB = {
  navy:      '#0A1B2E',
  neutral:   '#F7F9FB',
  white:     '#FFFFFF',
  textHi:    '#E8F0F8',
  textLo:    '#8CA3BC',
  accent:    '#5AA9F0',
  border:    '#21425F',
};
// Conversao naive (sem perfil ICC). A grafica deve confirmar contra prova —
// ver PRINTING.md > "Cor".
function toCmyk(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return [0, 0, 0, 100];
  const c = (1 - r - k) / (1 - k), m = (1 - g - k) / (1 - k), y = (1 - b - k) / (1 - k);
  return [c, m, y, k].map(v => Math.round(v * 100));
}
const CMYK = Object.fromEntries(Object.entries(RGB).map(([k, v]) => [k, toCmyk(v)]));

/* -------------------------------------------------------------------------- */
/* Fontes (TTF estaticas, incorporadas no PDF)                                 */
/* -------------------------------------------------------------------------- */
const F = {
  displayBold: 'node_modules/@expo-google-fonts/barlow-semi-condensed/700Bold/BarlowSemiCondensed_700Bold.ttf',
  bodyMedium:  'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
  bodyRegular: 'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
  // build oficial do repositorio google/fonts — o pacote @expo-google-fonts
  // do IBM Plex Mono nao e decodificado pelo fontkit usado pelo PDFKit
  monoRegular: 'fonts-ttf/IBMPlexMono-Regular.ttf',
  monoMedium:  'fonts-ttf/IBMPlexMono-Medium.ttf',
};
const FONT_PATH = Object.fromEntries(
  Object.entries(F).map(([k, v]) => [k, path.join(path.dirname(fileURLToPath(import.meta.url)), v)])
);
for (const [k, p] of Object.entries(FONT_PATH)) {
  if (!fs.existsSync(p)) throw new Error(`fonte ausente (${k}): ${p}`);
}
// Familias equivalentes para o SVG
const SVG_FAMILY = {
  displayBold: "'Barlow Semi Condensed', 'Arial Narrow', Arial, sans-serif",
  bodyMedium:  "'Inter', system-ui, sans-serif",
  bodyRegular: "'Inter', system-ui, sans-serif",
  monoRegular: "'IBM Plex Mono', ui-monospace, monospace",
  monoMedium:  "'IBM Plex Mono', ui-monospace, monospace",
};
const SVG_WEIGHT = { displayBold: 700, bodyMedium: 500, bodyRegular: 400, monoRegular: 400, monoMedium: 500 };

/* -------------------------------------------------------------------------- */
/* Conteudo — sempre a partir do site.config.json                              */
/* -------------------------------------------------------------------------- */
const card = cfg.card;
const SERVICES = card.services;

// O destino do QR e configuravel: 'site' ou 'whatsapp' em content/site.config.json.
if (!['site', 'whatsapp'].includes(card.qrTarget)) {
  throw new Error(`card.qrTarget invalido: "${card.qrTarget}" (use "site" ou "whatsapp")`);
}
const QR_TARGET = card.qrTarget === 'site' ? card.qrUrlSite : card.qrUrlWhatsapp;
const QR_LABEL = card.qrTarget === 'site' ? card.qrCaptionSite : card.qrCaptionWhatsapp;

/* -------------------------------------------------------------------------- */
/* Motor de medicao — PDFKit da a largura exata de cada linha                  */
/* -------------------------------------------------------------------------- */
const gauge = new PDFDocument({ size: [mm(W), mm(H)], margin: 0 });
for (const [k, p] of Object.entries(FONT_PATH)) gauge.registerFont(k, p);
/** largura de um texto, em mm */
function widthMm(text, font, sizeMm, letterSpacingEm = 0) {
  gauge.font(font).fontSize(mm(sizeMm));
  const base = gauge.widthOfString(text) / MM_TO_PT;
  return base + letterSpacingEm * sizeMm * Math.max(0, text.length - 1);
}

/* -------------------------------------------------------------------------- */
/* QR code — matriz vetorial com quiet zone de 4 modulos                       */
/* -------------------------------------------------------------------------- */
const qr = QRCode.create(QR_TARGET, { errorCorrectionLevel: 'M' });
const QR_MARGIN = 4;                                   // modulos de quiet zone
const qrN = qr.modules.size;
const qrTotal = qrN + QR_MARGIN * 2;                   // modulos incluindo quiet zone
const QR_PLATE = 24;                                   // mm — placa branca = extensao do QR
const QR_X = SAFE_R - QR_PLATE;                        // 65
const QR_Y = 15;
const moduleMm = QR_PLATE / qrTotal;

/** retangulos escuros do QR, em mm, ja posicionados na placa */
function qrRects() {
  const out = [];
  for (let row = 0; row < qrN; row++) {
    let runStart = -1;
    for (let col = 0; col <= qrN; col++) {
      const dark = col < qrN && qr.modules.get(row, col);
      if (dark && runStart < 0) runStart = col;
      if (!dark && runStart >= 0) {
        out.push({
          x: QR_X + (QR_MARGIN + runStart) * moduleMm,
          y: QR_Y + (QR_MARGIN + row) * moduleMm,
          w: (col - runStart) * moduleMm,
          h: moduleMm,
        });
        runStart = -1;
      }
    }
  }
  return out;
}
const QR_RECTS = qrRects();

/* -------------------------------------------------------------------------- */
/* Modelo do verso — baselines em mm                                           */
/* -------------------------------------------------------------------------- */
const COL_L = SAFE_L;                 // 7
const COL_W = QR_X - 4 - SAFE_L;      // 54 mm de largura util a esquerda

// Logotipo oficial no verso, pequeno, sobre placa clara — mesma marca do
// cabecalho e do rodape do site. Fica no canto superior esquerdo, ao lado da
// chamada, sem competir com o bloco de identificacao nem com o QR.
const BACK_LOGO_W = 20;                                        // mm
const BACK_LOGO_H = BACK_LOGO_W * (await sharp(path.join(ROOT, 'assets/brand/elektrosys-logo-tight.png')).metadata().then(m => m.height / m.width));
const BACK_LOGO_PAD = 1.4;                                     // respiro da placa ao redor do logotipo
const BACK_LOGO_PLATE = { x: COL_L, y: SAFE_T, w: BACK_LOGO_W + BACK_LOGO_PAD * 2, h: BACK_LOGO_H + BACK_LOGO_PAD * 2 };
const BACK_LOGO_POS = { x: BACK_LOGO_PLATE.x + BACK_LOGO_PAD, y: BACK_LOGO_PLATE.y + BACK_LOGO_PAD };

// A chamada "ATENDIMENTO DIRETO COM O ENGENHEIRO", que design.md lista como
// item do verso, foi removida a pedido do responsavel tecnico. O espaco que ela
// ocupava ao lado do logotipo virou respiro, e o bloco de identificacao ganhou
// corpo maior.
const BACK_TEXT = [
  { id: 'name',       text: cfg.professional.name,       font: 'displayBold', size: 5,   ls: 0,    color: 'white',  y: 24.8, x: COL_L },
  { id: 'role',       text: cfg.professional.role,       font: 'bodyMedium',  size: 2.7, ls: 0,    color: 'textHi', y: 28.6, x: COL_L },
  { id: 'crea',       text: cfg.professional.creaLabel,  font: 'monoRegular', size: 2.2, ls: 0,    color: 'textLo', y: 31.8, x: COL_L },
  { id: 'phoneLabel', text: card.phoneLabel,             font: 'monoMedium',  size: 1.7, ls: 0.12, color: 'textLo', y: 36.6, x: COL_L },
  { id: 'phone',      text: cfg.contact.whatsappDisplay, font: 'monoMedium',  size: 3.2, ls: 0,    color: 'white',  y: 40.6, x: COL_L },
  { id: 'svc1',       text: SERVICES[0],                 font: 'bodyRegular', size: 2.1, ls: 0,    color: 'textLo', y: 43.6, x: COL_L },
  { id: 'svc2',       text: SERVICES[1],                 font: 'bodyRegular', size: 2.1, ls: 0,    color: 'textLo', y: 46,   x: COL_L },
  { id: 'svc3',       text: SERVICES[2],                 font: 'bodyRegular', size: 2.1, ls: 0,    color: 'textLo', y: 48.4, x: COL_L },
];
const DIVIDER = { x: COL_L, y: 33.6, w: 34, h: 0.25 };
// A legenda do QR tambem serve como URL legivel para quem nao vai escanear.
const QR_CAPTION = { text: QR_LABEL, font: 'monoMedium', size: 1.8, ls: 0.08, color: 'textLo', y: 43 };

/* -------------------------------------------------------------------------- */
/* Verificacao de area segura                                                  */
/* -------------------------------------------------------------------------- */
const problems = [];
for (const t of BACK_TEXT) {
  const w = widthMm(t.text, t.font, t.size, t.ls);
  const left = t.x ?? COL_L;
  const right = left + w;
  // Enquanto a linha estiver na faixa vertical do QR, ela nao pode invadir a placa.
  // Abaixo dela, a coluna pode ir ate a margem segura.
  const besideQr = t.y <= QR_Y + QR_PLATE + 1;
  const limit = besideQr ? QR_X - 2 : SAFE_R;
  if (right > limit) problems.push(`verso/${t.id}: ${w.toFixed(1)}mm termina em ${right.toFixed(1)}mm (limite ${limit}mm)`);
  if (left < SAFE_L) problems.push(`verso/${t.id}: comeca em ${left.toFixed(1)}mm, antes da area segura (${SAFE_L}mm)`);
  if (t.y > SAFE_B) problems.push(`verso/${t.id}: baseline ${t.y}mm abaixo da area segura (${SAFE_B}mm)`);
  if (t.y - t.size < SAFE_T) problems.push(`verso/${t.id}: topo em ${(t.y - t.size).toFixed(1)}mm, acima da area segura (${SAFE_T}mm)`);
  t._w = w;
}
const capW = widthMm(QR_CAPTION.text, QR_CAPTION.font, QR_CAPTION.size, QR_CAPTION.ls);
if (QR_CAPTION.y > SAFE_B) problems.push('verso/caption fora da area segura');
if (QR_Y < SAFE_T) problems.push('verso/qr acima da area segura');
if (QR_Y + QR_PLATE > SAFE_B) problems.push(`verso/qr termina em ${QR_Y + QR_PLATE}mm (area segura ate ${SAFE_B}mm)`);

// Placa do logotipo no verso
if (BACK_LOGO_PLATE.x < SAFE_L) problems.push('verso/logo: placa comeca antes da area segura');
if (BACK_LOGO_PLATE.y < SAFE_T) problems.push('verso/logo: placa comeca acima da area segura');
if (BACK_LOGO_PLATE.x + BACK_LOGO_PLATE.w > QR_X - 3) problems.push('verso/logo: placa encosta na placa do QR');
if (BACK_LOGO_PLATE.y + BACK_LOGO_PLATE.h > SAFE_B) problems.push('verso/logo: placa ultrapassa a area segura');

/* -------------------------------------------------------------------------- */
/* Frente — logotipo oficial, sem qualquer outro elemento                      */
/* -------------------------------------------------------------------------- */
const LOGO_SRC = path.join(ROOT, 'assets/brand/elektrosys-logo-tight.png');
const logoMeta = await sharp(LOGO_SRC).metadata();
const LOGO_W = 40;                                            // mm
const LOGO_H = LOGO_W * (logoMeta.height / logoMeta.width);
const LOGO_X = (W - LOGO_W) / 2;
const LOGO_Y = (H - LOGO_H) / 2;
const logoDpi = logoMeta.width / (LOGO_W / 25.4);
if (LOGO_X < SAFE_L || LOGO_X + LOGO_W > SAFE_R) problems.push('frente/logo fora da area segura');
if (logoDpi < 300) problems.push(`frente/logo a ${logoDpi.toFixed(0)} dpi (minimo 300 dpi)`);

// Versao opaca sobre o fundo do cartao: evita transparencia no fluxo de impressao
const LOGO_PRINT = path.join(OUT, 'logo-para-impressao.png');
await sharp({ create: { width: logoMeta.width, height: logoMeta.height, channels: 4, background: RGB.neutral } })
  .composite([{ input: LOGO_SRC }])
  .png({ compressionLevel: 9 })
  .toFile(LOGO_PRINT);

/* -------------------------------------------------------------------------- */
/* Saida SVG (RGB, para uso digital e edicao)                                  */
/* -------------------------------------------------------------------------- */
const logoB64 = fs.readFileSync(LOGO_PRINT).toString('base64');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svgOpen(title, desc) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}"
     role="img" aria-labelledby="t d">
  <title id="t">${esc(title)}</title>
  <desc id="d">${esc(desc)}</desc>
  <!-- Unidade do viewBox = 1 mm. Corte final ${TRIM_W}x${TRIM_H} mm, sangria ${BLEED} mm,
       area segura ${SAFE} mm dentro do corte. Guias em #guias nao devem ser impressas. -->
`;
}
function svgGuides() {
  return `  <g id="guias" style="display:none" fill="none" stroke="#FF00FF" stroke-width="0.1">
    <rect x="${BLEED}" y="${BLEED}" width="${TRIM_W}" height="${TRIM_H}"/>
    <rect x="${SAFE_L}" y="${SAFE_T}" width="${SAFE_R - SAFE_L}" height="${SAFE_B - SAFE_T}"/>
  </g>
`;
}
function svgText(t, x, anchor = 'start') {
  const ls = t.ls ? ` letter-spacing="${(t.ls * t.size).toFixed(3)}"` : '';
  return `  <text x="${x}" y="${t.y}" fill="${RGB[t.color]}" font-family="${SVG_FAMILY[t.font]}" font-weight="${SVG_WEIGHT[t.font]}" font-size="${t.size}"${ls} text-anchor="${anchor}" xml:space="preserve">${esc(t.text)}</text>\n`;
}

let front = svgOpen(
  'ElektroSys — cartao de apresentacao, frente',
  'Logotipo oficial da ElektroSys Engenharia Eletrica centralizado sobre fundo claro.'
);
front += `  <rect width="${W}" height="${H}" fill="${RGB.neutral}"/>\n`;
front += `  <image x="${LOGO_X.toFixed(3)}" y="${LOGO_Y.toFixed(3)}" width="${LOGO_W}" height="${LOGO_H.toFixed(3)}" xlink:href="data:image/png;base64,${logoB64}" preserveAspectRatio="xMidYMid meet"/>\n`;
front += svgGuides() + '</svg>\n';
fs.writeFileSync(path.join(OUT, 'business-card-front.svg'), front);

let back = svgOpen(
  'ElektroSys — cartao de apresentacao, verso',
  `Dados de contato de ${cfg.professional.name}, ${cfg.professional.role}, ${cfg.professional.creaLabel}. QR code para ${QR_TARGET}.`
);
back += `  <rect width="${W}" height="${H}" fill="${RGB.navy}"/>\n`;
back += `  <rect x="${BACK_LOGO_PLATE.x}" y="${BACK_LOGO_PLATE.y}" width="${BACK_LOGO_PLATE.w}" height="${BACK_LOGO_PLATE.h}" rx="1" fill="${RGB.neutral}"/>\n`;
back += `  <image x="${BACK_LOGO_POS.x}" y="${BACK_LOGO_POS.y}" width="${BACK_LOGO_W}" height="${BACK_LOGO_H.toFixed(3)}" xlink:href="data:image/png;base64,${logoB64}" preserveAspectRatio="xMidYMid meet"/>\n`;
for (const t of BACK_TEXT) back += svgText(t, t.x ?? COL_L);
back += `  <rect x="${DIVIDER.x}" y="${DIVIDER.y}" width="${DIVIDER.w}" height="${DIVIDER.h}" fill="${RGB.border}"/>\n`;
back += `  <g id="qr">\n    <rect x="${QR_X}" y="${QR_Y}" width="${QR_PLATE}" height="${QR_PLATE}" fill="${RGB.white}"/>\n`;
for (const r of QR_RECTS) {
  back += `    <rect x="${r.x.toFixed(4)}" y="${r.y.toFixed(4)}" width="${r.w.toFixed(4)}" height="${r.h.toFixed(4)}" fill="${RGB.navy}"/>\n`;
}
back += `  </g>\n`;
back += svgText({ ...QR_CAPTION }, QR_X + QR_PLATE / 2, 'middle');
back += svgGuides() + '</svg>\n';
fs.writeFileSync(path.join(OUT, 'business-card-back.svg'), back);

/* -------------------------------------------------------------------------- */
/* Saida PDF (CMYK, master de impressao) e PDF RGB (digital)                   */
/* -------------------------------------------------------------------------- */
async function writePdf(file, side, mode) {
  const useCmyk = mode === 'cmyk';
  const col = (name) => (useCmyk ? CMYK[name] : RGB[name]);
  const doc = new PDFDocument({ size: [mm(W), mm(H)], margin: 0, info: {
    Title: `ElektroSys — cartao de apresentacao (${side === 'front' ? 'frente' : 'verso'})`,
    Author: cfg.professional.name,
    Subject: `${TRIM_W}x${TRIM_H} mm, sangria ${BLEED} mm, ${mode.toUpperCase()}`,
    Creator: 'ElektroSys build-card.mjs',
  }});
  for (const [k, p] of Object.entries(FONT_PATH)) doc.registerFont(k, p);

  // TrimBox/BleedBox para a grafica
  const trim = [mm(BLEED), mm(BLEED), mm(BLEED + TRIM_W), mm(BLEED + TRIM_H)];
  doc.page.dictionary.data.TrimBox = trim;
  doc.page.dictionary.data.BleedBox = [0, 0, mm(W), mm(H)];

  const stream = fs.createWriteStream(path.join(OUT, file));
  const done = new Promise((res, rej) => { stream.on('finish', res); stream.on('error', rej); });
  doc.pipe(stream);

  if (side === 'front') {
    doc.rect(0, 0, mm(W), mm(H)).fill(col('neutral'));
    doc.image(LOGO_PRINT, mm(LOGO_X), mm(LOGO_Y), { width: mm(LOGO_W), height: mm(LOGO_H) });
  } else {
    doc.rect(0, 0, mm(W), mm(H)).fill(col('navy'));
    doc.rect(mm(BACK_LOGO_PLATE.x), mm(BACK_LOGO_PLATE.y), mm(BACK_LOGO_PLATE.w), mm(BACK_LOGO_PLATE.h)).fill(col('neutral'));
    doc.image(LOGO_PRINT, mm(BACK_LOGO_POS.x), mm(BACK_LOGO_POS.y), { width: mm(BACK_LOGO_W), height: mm(BACK_LOGO_H) });
    for (const t of BACK_TEXT) {
      doc.font(t.font).fontSize(mm(t.size)).fillColor(col(t.color));
      const opts = t.ls ? { characterSpacing: mm(t.ls * t.size), lineBreak: false } : { lineBreak: false };
      // PDFKit posiciona pelo topo da caixa; converter da baseline
      const ascender = doc._font.ascender / 1000 * mm(t.size);
      doc.text(t.text, mm(t.x ?? COL_L), mm(t.y) - ascender, opts);
    }
    doc.rect(mm(DIVIDER.x), mm(DIVIDER.y), mm(DIVIDER.w), mm(DIVIDER.h)).fill(col('border'));
    doc.rect(mm(QR_X), mm(QR_Y), mm(QR_PLATE), mm(QR_PLATE)).fill(col('white'));
    doc.fillColor(col('navy'));
    for (const r of QR_RECTS) doc.rect(mm(r.x), mm(r.y), mm(r.w), mm(r.h)).fill();
    doc.font(QR_CAPTION.font).fontSize(mm(QR_CAPTION.size)).fillColor(col(QR_CAPTION.color));
    const capAsc = doc._font.ascender / 1000 * mm(QR_CAPTION.size);
    doc.text(QR_CAPTION.text, mm(QR_X + QR_PLATE / 2) - mm(capW) / 2, mm(QR_CAPTION.y) - capAsc,
      { characterSpacing: mm(QR_CAPTION.ls * QR_CAPTION.size), lineBreak: false });
  }

  doc.end();
  await done;
}

await writePdf('business-card-front.pdf', 'front', 'cmyk');
await writePdf('business-card-back.pdf', 'back', 'cmyk');
await writePdf('business-card-front-rgb.pdf', 'front', 'rgb');
await writePdf('business-card-back-rgb.pdf', 'back', 'rgb');

/* -------------------------------------------------------------------------- */
/* Relatorio                                                                   */
/* -------------------------------------------------------------------------- */
console.log('Cartao de apresentacao ElektroSys');
console.log('---------------------------------');
console.log(`Area total (com sangria) : ${W} x ${H} mm`);
console.log(`Corte final              : ${TRIM_W} x ${TRIM_H} mm`);
console.log(`Area segura              : ${SAFE_R - SAFE_L} x ${SAFE_B - SAFE_T} mm  (x ${SAFE_L}-${SAFE_R}, y ${SAFE_T}-${SAFE_B})`);
console.log(`Logotipo (frente)        : ${LOGO_W} x ${LOGO_H.toFixed(2)} mm  @ ${logoDpi.toFixed(0)} dpi`);
console.log(`QR                       : ${qrN}x${qrN} modulos + ${QR_MARGIN} de quiet zone`);
console.log(`                           placa ${QR_PLATE} mm, modulo ${moduleMm.toFixed(3)} mm, quiet zone ${(QR_MARGIN * moduleMm).toFixed(2)} mm`);
console.log(`QR aponta para           : ${QR_TARGET}`);
console.log('\nLarguras medidas no verso (coluna util = ' + COL_W + ' mm):');
for (const t of BACK_TEXT) console.log(`  ${t.id.padEnd(9)} ${t._w.toFixed(1).padStart(5)} mm  "${t.text}"`);
console.log(`  ${'caption'.padEnd(9)} ${capW.toFixed(1).padStart(5)} mm  "${QR_CAPTION.text}"`);

if (problems.length) {
  console.log('\nPROBLEMAS:');
  problems.forEach(p => console.log('  ! ' + p));
  process.exit(1);
}
console.log('\nGeometria OK: todo o conteudo cabe na area segura.');
