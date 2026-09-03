import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = (p) => path.join(ROOT, p);


const SRC = R('855058ec-ab39-4ab7-b3da-bff39cc7e410.png');
const OUT = R('assets/brand');
fs.mkdirSync(OUT, { recursive: true });

const BG   = [251, 251, 251];
const INKS = [[2, 87, 151], [12, 36, 63]]; // #025797 simbolo+wordmark, #0C243F descritor+regua

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// Pre-compute bg->ink vectors
const U = INKS.map(ink => {
  const u = [BG[0]-ink[0], BG[1]-ink[1], BG[2]-ink[2]];
  return { ink, u, uu: u[0]*u[0] + u[1]*u[1] + u[2]*u[2] };
});

// O fundo do arquivo original tem uma vinheta muito suave (~248-251), enquanto o
// keying assume um valor unico. A diferenca gera alfa residual de 1-3/255 nas
// areas vazias — invisivel isolada, mas suficiente para desenhar um retangulo
// levemente mais escuro quando o logotipo e aplicado sobre uma superficie clara.
// Este piso descarta esse ruido e reescala o restante, preservando o antisserrilhado.
const NOISE_FLOOR = 0.035;

// RGBA output buffer: exact alpha map, exact source ink colors
const out = Buffer.alloc(W * H * 4);
for (let p = 0, q = 0; p < W * H; p++, q += C) {
  const d = [BG[0]-data[q], BG[1]-data[q+1], BG[2]-data[q+2]];
  let best = null;
  for (const { ink, u, uu } of U) {
    const t = (d[0]*u[0] + d[1]*u[1] + d[2]*u[2]) / uu;
    const rx = d[0]-t*u[0], ry = d[1]-t*u[1], rz = d[2]-t*u[2];
    const resid = rx*rx + ry*ry + rz*rz;
    if (!best || resid < best.resid) best = { ink, t, resid };
  }
  const raw = Math.max(0, Math.min(1, best.t));
  const a = raw <= NOISE_FLOOR ? 0 : (raw - NOISE_FLOOR) / (1 - NOISE_FLOOR);
  const o = p * 4;
  out[o] = best.ink[0]; out[o+1] = best.ink[1]; out[o+2] = best.ink[2];
  out[o+3] = Math.round(a * 255);
}

const rgba = sharp(out, { raw: { width: W, height: H, channels: 4 } });

// --- geometry measured from the source (see probe scripts) ---
const INK   = { x: 243, y: 160, w: 538, h: 239 };            // full lockup
const SYM   = { x: 243, y: 160, w: 174, h: 239 };            // hexagon + bolt
const CLEAR = 38;                                            // main bolt stroke width @ source scale

async function crop(box, pad, file) {
  const left = box.x - pad, top = box.y - pad;
  const width = box.w + pad*2, height = box.h + pad*2;
  await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left, top, width, height })
    .png({ compressionLevel: 9, palette: false })
    .toFile(path.join(OUT, file));
  const m = await sharp(path.join(OUT, file)).metadata();
  console.log(file.padEnd(30), m.width + 'x' + m.height);
}

await crop(INK, CLEAR, 'elektrosys-logo.png');
await crop(SYM, CLEAR, 'elektrosys-symbol.png');

// Tight variants (no built-in clear space) for layouts that manage their own padding
await crop(INK, 0, 'elektrosys-logo-tight.png');
await crop(SYM, 0, 'elektrosys-symbol-tight.png');

// Verificacao: as areas vazias precisam ficar totalmente transparentes,
// e a tinta precisa manter as cores exatas do arquivo original.
{
  const alphaAt = (x, y) => out[(y * W + x) * 4 + 3];
  const corners = [[INK.x + 1, INK.y + 1], [INK.x + INK.w - 2, INK.y + 1],
                   [INK.x + 1, INK.y + INK.h - 2], [INK.x + INK.w - 2, INK.y + INK.h - 2]];
  const bad = corners.filter(([x, y]) => alphaAt(x, y) !== 0);
  console.log("\ncantos do recorte totalmente transparentes:", bad.length === 0 ? "sim" : "NAO " + JSON.stringify(bad));

  let opaque = 0, partial = 0, clear = 0;
  for (let p = 0; p < W * H; p++) { const a = out[p * 4 + 3]; if (a === 0) clear++; else if (a === 255) opaque++; else partial++; }
  console.log("pixels: " + opaque + " opacos, " + partial + " antisserrilhados, " + clear + " transparentes");
}
