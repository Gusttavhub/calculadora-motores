/* =============================================================================
   Pre-visualizacoes do site — captura de pagina inteira com o Chromium headless
   ja instalado no sistema (Chrome ou Edge). Sem dependencias adicionais.

   Uso: node tools/capture-site.mjs          (o servidor precisa estar no ar)
        npm run dev  em outro terminal
   ============================================================================= */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'previews');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:4173';

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
const BROWSER = CANDIDATES.find((p) => fs.existsSync(p));
if (!BROWSER) { console.error('Nenhum Chromium encontrado.'); process.exit(1); }
console.log('Navegador: ' + BROWSER + '\n');

// pagina, largura, altura total, arquivo
// Alturas medidas na propria pagina (rodape ate o topo do documento).
const SHOTS = [
  { url: '/index.html',       w: 1920, h: 8449,  file: 'site-desktop-1920.png',        scale: 1 },
  { url: '/index.html',       w: 1440, h: 8396,  file: 'site-desktop-1440.png',        scale: 1 },
  { url: '/index.html',       w: 768,  h: 10673, file: 'site-tablet-768.png',          scale: 1 },
  { url: '/index.html',       w: 375,  h: 13996, file: 'site-mobile-375.png',          scale: 2 },
  { url: '/ferramentas.html', w: 1440, h: 2590,  file: 'ferramentas-desktop-1440.png', scale: 1 },
  { url: '/ferramentas.html', w: 375,  h: 3814,  file: 'ferramentas-mobile-375.png',   scale: 2 },
];

/* -----------------------------------------------------------------------------
   O Windows impoe uma largura minima de janela. Pedir --window-size menor que
   isso NAO estreita o viewport: o Chrome renderiza mais largo e depois recorta a
   captura, o que corta o conteudo pela direita e simula um layout que nao existe.

   Para larguras estreitas, entao, a pagina e carregada dentro de um iframe com a
   largura exata, numa janela larga o suficiente, e a captura e recortada na
   regiao do iframe. O iframe da um viewport de layout real de s.w px.
   ----------------------------------------------------------------------------- */
const MIN_WINDOW = 520;
const WRAP = path.join(OUT, '_viewport.html');

function writeWrapper(url, w, h) {
  fs.writeFileSync(WRAP,
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>viewport ${w}</title>
<style>html,body{margin:0;padding:0;background:#0A1B2E}
iframe{display:block;border:0;width:${w}px;height:${h}px}</style></head>
<body><iframe src="${url}" scrolling="no"></iframe></body></html>`);
}

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'elektro-shot-'));
let failures = 0;

for (const s of SHOTS) {
  const dest = path.join(OUT, s.file);
  const narrow = s.w < MIN_WINDOW;
  const shotPath = narrow ? dest + '.raw.png' : dest;
  if (narrow) writeWrapper(BASE + s.url, s.w, s.h);
  const target = narrow ? `${BASE}/previews/_viewport.html` : BASE + s.url;
  const winW = narrow ? s.w + 300 : s.w;
  try {
    execFileSync(BROWSER, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      `--user-data-dir=${profile}`,
      `--force-device-scale-factor=${s.scale}`,
      `--window-size=${winW},${s.h}`,
      '--virtual-time-budget=8000',
      `--screenshot=${shotPath}`,
      target,
    ], { stdio: 'pipe', timeout: 90000 });
  } catch (e) {
    // o Chrome devolve codigo != 0 mesmo escrevendo o arquivo; so o arquivo importa
  }

  // Recortar a regiao do iframe, descartando a folga da janela
  if (narrow && fs.existsSync(shotPath)) {
    await sharp(shotPath)
      .extract({ left: 0, top: 0, width: s.w * s.scale, height: s.h * s.scale })
      .png()
      .toFile(dest);
    fs.rmSync(shotPath);
  }

  if (fs.existsSync(dest)) {
    const kb = (fs.statSync(dest).size / 1024).toFixed(0);
    console.log(`  ${s.file.padEnd(32)} ${s.w}x${s.h} @${s.scale}x  ${kb} KB${narrow ? '  (via iframe)' : ''}`);
  } else {
    console.log(`  ${s.file.padEnd(32)} FALHOU`);
    failures++;
  }
}
if (fs.existsSync(WRAP)) fs.rmSync(WRAP);

fs.rmSync(profile, { recursive: true, force: true });
console.log(failures ? `\n${failures} captura(s) falharam.` : '\nTodas as capturas foram geradas em previews/.');
process.exit(failures ? 1 : 0);
