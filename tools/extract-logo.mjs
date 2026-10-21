import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = (p) => path.join(ROOT, p);

// Logotipo GG Soluções recebido em raster (1024x765) sobre azul-marinho.
// Este script separa a arte do fundo e gera as variantes usadas no site, no PDF e no cartão.
const SRC = R('brand/source/gg-solucoes-logo-original.png');
const OUT = R('assets/brand');
fs.mkdirSync(OUT, { recursive: true });

const BG = [14, 30, 53];          // #0E1E35 medido nos cantos e entre os elementos
const NAVY = [10, 27, 46];        // #0A1B2E — wordmark da versão para fundo claro

// A arte é toda mais clara que o fundo (branco, azul, ciano, verde). O alfa vem da
// maior diferença positiva por canal: abaixo de NOISE é ruído/compressão do fundo
// (medido: até 9), acima de SOLID é traço cheio. Entre os dois é antisserrilhado e a
// cor é "despremultiplicada" para não carregar o azul-marinho para fundos claros.
const NOISE = 14, SOLID = 84;

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// --- geometria medida no arquivo original ---
const LOCKUP = { x: 162, y: 202, w: 701, h: 337 };   // monograma + wordmark
const SYM    = { x: 343, y: 202, w: 338, h: 201 };   // monograma GG
const WORD_Y = 430;                                  // acima: monograma; abaixo: wordmark
const CLEAR  = 24;                                   // diâmetro do terminal em ponto, na escala original

function build({ lightBg }) {
  const out = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    const q = p * 3, o = p * 4;
    const px = [data[q], data[q + 1], data[q + 2]];
    const d = Math.max(px[0] - BG[0], px[1] - BG[1], px[2] - BG[2]);
    const a = Math.max(0, Math.min(1, (d - NOISE) / (SOLID - NOISE)));
    if (a === 0) continue;
    let rgb = px.map((v, i) => Math.max(0, Math.min(255, Math.round(BG[i] + (v - BG[i]) / a))));
    if (lightBg && Math.floor(p / W) >= WORD_Y) rgb = NAVY;
    out[o] = rgb[0]; out[o + 1] = rgb[1]; out[o + 2] = rgb[2]; out[o + 3] = Math.round(a * 255);
  }
  return out;
}

async function crop(buf, box, pad, file) {
  await sharp(buf, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: box.x - pad, top: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, file));
  const m = await sharp(path.join(OUT, file)).metadata();
  console.log(file.padEnd(30), m.width + 'x' + m.height);
}

const dark = build({ lightBg: false });
const light = build({ lightBg: true });

// Versão principal: wordmark branco, para fundo azul-marinho (site, OG, verso do cartão)
await crop(dark, LOCKUP, CLEAR, 'gg-logo.png');
await crop(dark, LOCKUP, 0, 'gg-logo-tight.png');
// Versão para fundo claro: wordmark azul-marinho (PDF da proposta, frente do cartão)
await crop(light, LOCKUP, CLEAR, 'gg-logo-light.png');
await crop(light, LOCKUP, 0, 'gg-logo-light-tight.png');
// Monograma isolado (favicon, ícones)
await crop(dark, SYM, CLEAR, 'gg-symbol.png');
await crop(dark, SYM, 0, 'gg-symbol-tight.png');

// Verificação: cantos do recorte transparentes e contagem de pixels
{
  const alphaAt = (x, y) => dark[(y * W + x) * 4 + 3];
  const corners = [[LOCKUP.x + 1, LOCKUP.y + 1], [LOCKUP.x + LOCKUP.w - 2, LOCKUP.y + 1],
                   [LOCKUP.x + 1, LOCKUP.y + LOCKUP.h - 2], [LOCKUP.x + LOCKUP.w - 2, LOCKUP.y + LOCKUP.h - 2]];
  const bad = corners.filter(([x, y]) => alphaAt(x, y) !== 0);
  console.log('\ncantos do recorte totalmente transparentes:', bad.length === 0 ? 'sim' : 'NAO ' + JSON.stringify(bad));
  let opaque = 0, partial = 0;
  for (let p = 0; p < W * H; p++) { const a = dark[p * 4 + 3]; if (a === 255) opaque++; else if (a) partial++; }
  console.log('pixels: ' + opaque + ' opacos, ' + partial + ' antisserrilhados');
}
