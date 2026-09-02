import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = (p) => path.join(ROOT, p);


const SYM = R('assets/brand/elektrosys-symbol-tight.png');   // 174x239, sem respiro
const OUT = R('assets/brand');
const PLATE = '#F7F9FB';   // superficie clara oficial — o simbolo nunca e invertido

// O simbolo e mais alto que largo; encaixa-lo numa area segura quadrada.
async function icon(size, file, { round = false, inset = 0.66 } = {}) {
  const box = Math.round(size * inset);
  const sym = await sharp(SYM).resize({ height: box, fit: 'inside' }).toBuffer();
  const m = await sharp(sym).metadata();
  let img = sharp({ create: { width: size, height: size, channels: 4, background: PLATE } })
    .composite([{ input: sym, left: Math.round((size - m.width) / 2), top: Math.round((size - m.height) / 2) }]);
  let buf = await img.png().toBuffer();
  if (round) {
    const r = Math.round(size * 0.18);
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);
    buf = await sharp(buf).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  }
  fs.writeFileSync(`${OUT}/${file}`, buf);
  return buf;
}

const b16 = await icon(16, 'favicon-16.png', { inset: 0.78 });
const b32 = await icon(32, 'favicon-32.png', { inset: 0.74 });
const b48 = await icon(48, 'favicon-48.png', { inset: 0.72 });
await icon(192, 'favicon-192.png');
await icon(512, 'favicon-512.png');
await icon(180, 'apple-touch-icon.png', { inset: 0.62 });

// favicon.ico multi-resolucao (PNG embutido, aceito por todos os navegadores atuais)
function buildIco(entries) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o);
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1);
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(e.data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.data.length;
  });
  return Buffer.concat([head, dir, ...entries.map(e => e.data)]);
}

fs.writeFileSync(R('favicon.ico'), buildIco([
  { size: 16, data: b16 }, { size: 32, data: b32 }, { size: 48, data: b48 },
]));

for (const f of ['favicon-16.png','favicon-32.png','favicon-48.png','favicon-192.png','favicon-512.png','apple-touch-icon.png']) {
  const m = await sharp(`${OUT}/${f}`).metadata();
  console.log(f.padEnd(24), m.width + 'x' + m.height);
}
console.log('favicon.ico'.padEnd(24), fs.statSync(R('favicon.ico')).size + ' bytes (16/32/48)');
