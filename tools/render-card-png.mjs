/* =============================================================================
   Gera os PNG de pre-visualizacao do cartao a partir dos SVG entregues.

   O rasterizador do sharp (librsvg) usa apenas fontes instaladas no sistema, e
   Barlow Semi Condensed / Inter / IBM Plex Mono nao estao. Entao a rasterizacao
   e feita no navegador: esta ferramenta sobe uma pagina que desenha cada SVG —
   com as fontes embutidas como data URI — em um <canvas> na resolucao pedida e
   devolve o PNG por POST.

   Uso: node tools/render-card-png.mjs [dpi]
        depois abrir http://localhost:4199 no navegador (a pagina se encerra sozinha)
   ============================================================================= */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARD = path.join(ROOT, 'brand/business-card');
const FONTS = path.join(ROOT, 'assets/fonts');
const DPI = Number(process.argv[2] || 600);
const PORT = 4199;

const MM_W = 96, MM_H = 56;
const PX_W = Math.round(MM_W / 25.4 * DPI);
const PX_H = Math.round(MM_H / 25.4 * DPI);

const b64 = (f) => fs.readFileSync(path.join(FONTS, f)).toString('base64');
const face = (family, weight, file) =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};` +
  `src:url(data:font/woff2;base64,${b64(file)}) format('woff2');}`;

const FONT_CSS = [
  face('Barlow Semi Condensed', 700, 'barlow-semi-condensed-latin-700-normal.woff2'),
  face('Barlow Semi Condensed', 700, 'barlow-semi-condensed-latin-ext-700-normal.woff2'),
  face('Inter', 400, 'inter-latin-400-normal.woff2'),
  face('Inter', 400, 'inter-latin-ext-400-normal.woff2'),
  face('Inter', 500, 'inter-latin-500-normal.woff2'),
  face('Inter', 500, 'inter-latin-ext-500-normal.woff2'),
  face('IBM Plex Mono', 400, 'ibm-plex-mono-latin-400-normal.woff2'),
  face('IBM Plex Mono', 400, 'ibm-plex-mono-latin-ext-400-normal.woff2'),
  face('IBM Plex Mono', 500, 'ibm-plex-mono-latin-500-normal.woff2'),
  face('IBM Plex Mono', 500, 'ibm-plex-mono-latin-ext-500-normal.woff2'),
].join('\n');

/** injeta as fontes embutidas no SVG para que ele seja auto-contido no canvas */
function selfContained(file) {
  const svg = fs.readFileSync(path.join(CARD, file), 'utf8');
  return svg.replace(/(<svg[^>]*>)/, `$1\n  <style>${FONT_CSS}</style>`);
}

const SIDES = [
  { id: 'front', file: 'business-card-front.svg', out: 'business-card-front.png' },
  { id: 'back',  file: 'business-card-back.svg',  out: 'business-card-back.png' },
];

const page = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Rasterizando o cartao ElektroSys</title>
<style>${FONT_CSS}
body{font:14px/1.6 system-ui;background:#0A1B2E;color:#E8F0F8;padding:24px}
code{font-family:ui-monospace,monospace;color:#5AA9F0}</style></head><body>
<h1>Rasterizando o cartao</h1><p id="log">iniciando…</p>
<script type="module">
const DPI=${DPI}, W=${PX_W}, H=${PX_H};
const SIDES=${JSON.stringify(SIDES.map(s => s.id))};
const SVGS=${JSON.stringify(Object.fromEntries(SIDES.map(s => [s.id, selfContained(s.file)])))};
const log=document.getElementById('log');
const say=(m)=>{log.innerHTML+='<br>'+m;};

// garantir que as fontes estejam prontas antes de desenhar
await document.fonts.ready;
say('fontes carregadas: '+document.fonts.size);

async function raster(id){
  const blob=new Blob([SVGS[id]],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const img=new Image();
  img.width=W; img.height=H;
  await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error('falha ao carregar o SVG '+id));img.src=url;});
  const c=document.createElement('canvas');
  c.width=W; c.height=H;
  const ctx=c.getContext('2d');
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  ctx.drawImage(img,0,0,W,H);
  URL.revokeObjectURL(url);
  const dataUrl=c.toDataURL('image/png');
  const r=await fetch('/save',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id,dataUrl})});
  say(id+': '+(await r.text()));
}

try{
  for(const id of SIDES) await raster(id);
  await fetch('/done',{method:'POST'});
  say('<strong>concluido — pode fechar esta aba.</strong>');
}catch(e){ say('<strong>ERRO: '+e.message+'</strong>'); await fetch('/done',{method:'POST'}); }
</script></body></html>`;

let saved = 0;
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const { id, dataUrl } = JSON.parse(body);
      const side = SIDES.find((s) => s.id === id);
      const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
      fs.writeFileSync(path.join(CARD, side.out), buf);
      // versao aparada: o cartao como fica depois do corte (sem sangria)
      const bleedPx = Math.round(3 / 25.4 * DPI);
      sharp(buf)
        .extract({ left: bleedPx, top: bleedPx, width: PX_W - bleedPx * 2, height: PX_H - bleedPx * 2 })
        .png()
        .toFile(path.join(CARD, side.out.replace('.png', '-trimmed.png')))
        .then(() => {
          saved++;
          const msg = `${side.out} — ${PX_W}x${PX_H}px @ ${DPI} dpi (com sangria) + versao aparada`;
          console.log('  gravado ' + msg);
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end(msg);
        });
    });
    return;
  }
  if (req.method === 'POST' && req.url === '/done') {
    res.writeHead(200).end('ok');
    setTimeout(() => {
      server.close();
      console.log(saved === SIDES.length
        ? `\nOK — ${saved} imagem(ns) gerada(s) em brand/business-card/.`
        : `\nATENCAO — apenas ${saved} de ${SIDES.length} imagens foram gravadas.`);
      process.exit(saved === SIDES.length ? 0 : 1);
    }, 150);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page);
});

server.listen(PORT, () => {
  console.log(`Rasterizando ${PX_W}x${PX_H}px @ ${DPI} dpi`);
  console.log(`Abra http://localhost:${PORT} para gerar os PNG.`);
});
