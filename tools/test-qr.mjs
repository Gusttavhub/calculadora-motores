/* =============================================================================
   Teste do QR code do cartao — decodifica o codigo a partir do SVG realmente
   gerado e confere se ele aponta para o WhatsApp correto.

   Uso: node tools/test-qr.mjs
   ============================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.config.json'), 'utf8'));
const SVG = path.join(ROOT, 'brand/business-card/business-card-back.svg');
// O destino vem de card.qrTarget — o teste acompanha a configuracao automaticamente.
const EXPECTED = cfg.card.qrTarget === 'site' ? cfg.card.qrUrlSite : cfg.card.qrUrlWhatsapp;

// Geometria do verso, em mm (ver tools/build-card.mjs)
const CARD_W = 96, CARD_H = 56, QR_X = 65, QR_Y = 15, QR_PLATE = 24, QR_MODULES = 33;

let failures = 0;

// O jsQR e um decodificador de quadro de camera: acima de ~1000 px ele perde a
// localizacao do padrao. Leitores reais reamostram o quadro antes de decodificar,
// entao fazemos o mesmo — o que esta sob teste e a geometria impressa, nao o limite
// do decodificador.
const CAMERA_MAX = 900;

/** Rasteriza o cartao com a largura exata pedida, em pixels. */
async function render(widthPx) {
  // A densidade que o sharp aplica a um SVG dimensionado em mm nao e linear,
  // entao renderizamos generosamente e reamostramos para a largura exata.
  return sharp(SVG, { density: 300, limitInputPixels: false, unlimited: true })
    .resize({ width: widthPx })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

/** Reamostra um buffer RGBA para no maximo CAMERA_MAX px no lado maior. */
async function toCameraFrame(buf, w, h) {
  const longSide = Math.max(w, h);
  if (longSide <= CAMERA_MAX) return { data: buf, info: { width: w, height: h } };
  const scale = CAMERA_MAX / longSide;
  const out = await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .resize({ width: Math.round(w * scale), height: Math.round(h * scale) })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return out;
}

async function decode(label, { dpi, crop }) {
  const widthPx = Math.round(CARD_W / 25.4 * dpi);
  const { data, info } = await render(widthPx);
  const pxPerMm = info.width / CARD_W;

  let buf = data, w = info.width, h = info.height;
  if (crop) {
    const x0 = Math.round(QR_X * pxPerMm), y0 = Math.round(QR_Y * pxPerMm);
    const side = Math.round(QR_PLATE * pxPerMm);
    const out = Buffer.alloc(side * side * 4);
    for (let y = 0; y < side; y++) {
      data.copy(out, y * side * 4, ((y0 + y) * info.width + x0) * 4, ((y0 + y) * info.width + x0 + side) * 4);
    }
    buf = out; w = side; h = side;
  }

  const frame = await toCameraFrame(buf, w, h);
  const res = jsQR(new Uint8ClampedArray(frame.data), frame.info.width, frame.info.height);
  const ok = !!res && res.data === EXPECTED;
  if (!ok) failures++;
  const shown = frame.info.width === w ? `${w}x${h}` : `${w}x${h} -> ${frame.info.width}x${frame.info.height}`;
  console.log(
    label.padEnd(46) + shown.padEnd(24) +
    (res ? (ok ? 'OK' : 'CONTEUDO ERRADO: ' + JSON.stringify(res.data)) : 'NAO DECODIFICOU')
  );
}

console.log('QR do verso — destino esperado: ' + EXPECTED);
console.log(`Placa ${QR_PLATE} mm, ${QR_MODULES} modulos (25 de dados + 4+4 de quiet zone)\n`);

console.log('A. Codigo enquadrado, como a camera ve ao aproximar:');
for (const dpi of [1200, 600, 300, 150, 96]) {
  const modPx = (QR_PLATE / QR_MODULES) * dpi / 25.4;
  await decode(`   ${String(dpi).padStart(4)} dpi — modulo ${modPx.toFixed(1)} px`, { dpi, crop: true });
}

console.log('\nB. Cartao inteiro no quadro, leitura a distancia:');
for (const dpi of [600, 300, 200, 150, 96]) {
  await decode(`   ${String(dpi).padStart(4)} dpi — cartao ${Math.round(CARD_W / 25.4 * dpi)} px`, { dpi, crop: false });
}

console.log('\n' + '-'.repeat(72));
if (failures) {
  console.log(`TESTE DO QR REPROVADO — ${failures} leitura(s) falharam.`);
  process.exit(1);
}
console.log('TESTE DO QR APROVADO — todas as leituras retornaram o destino correto.');
