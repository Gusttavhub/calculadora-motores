/* Gera assets/brand/og-image.png (1200x630) a partir de tools/og-image.html.
   Requer o servidor no ar (npm run dev). Uso: node tools/capture-og.mjs */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const DEST = path.join(ROOT, 'assets/brand/og-image.png');

const BROWSER = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
if (!BROWSER) { console.error('Nenhum Chromium encontrado.'); process.exit(1); }

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'elektro-og-'));
try {
  execFileSync(BROWSER, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--disable-extensions', `--user-data-dir=${profile}`,
    '--window-size=1200,630', '--virtual-time-budget=6000',
    `--screenshot=${DEST}`, `${BASE}/tools/og-image.html`,
  ], { stdio: 'pipe', timeout: 60000 });
} catch { /* o Chrome sai com codigo != 0 mesmo gravando o arquivo */ }
fs.rmSync(profile, { recursive: true, force: true });

if (!fs.existsSync(DEST)) { console.error('FALHOU — o servidor esta no ar? (npm run dev)'); process.exit(1); }
console.log(`og-image.png gerada — ${(fs.statSync(DEST).size / 1024).toFixed(0)} KB`);
