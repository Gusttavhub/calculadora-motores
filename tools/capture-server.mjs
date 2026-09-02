/* =============================================================================
   Recebe imagens PNG enviadas pelo navegador e grava em previews/.
   Usado para gerar as pre-visualizacoes do site em resolucao real.

   Uso: node tools/capture-server.mjs
   ============================================================================= */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'previews');
fs.mkdirSync(OUT, { recursive: true });
const PORT = 4198;

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  if (req.method !== 'POST') { res.writeHead(200).end('capture-server pronto'); return; }

  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    try {
      const { name, dataUrl } = JSON.parse(body);
      const safe = String(name).replace(/[^a-z0-9._-]/gi, '_');
      const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
      fs.writeFileSync(path.join(OUT, safe), buf);
      const msg = `${safe} — ${(buf.length / 1024).toFixed(0)} KB`;
      console.log('  gravado ' + msg);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end(msg);
    } catch (e) {
      console.log('  ERRO ' + e.message);
      res.writeHead(500).end(e.message);
    }
  });
}).listen(PORT, () => console.log(`capture-server em http://localhost:${PORT} — grava em previews/`));
