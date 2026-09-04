/* =============================================================================
   Copia os arquivos entregues para um clone do repositorio calculadora-motores,
   preservando o que ja existe la (calculadoras, backend, workflows).

   NAO faz commit nem push — so prepara a arvore de trabalho.
   Uso: node tools/sync-to-repo.mjs <caminho-do-clone>
   ============================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = process.argv[2];
if (!DEST || !fs.existsSync(path.join(DEST, '.git'))) {
  console.error('Informe o caminho de um clone git valido.');
  process.exit(1);
}

/* Arquivos e pastas do projeto que vao para o repositorio. -------------------- */
const COPY = [
  'index.html',
  'ferramentas.html',
  'favicon.ico',
  'site.webmanifest',
  'package.json',
  'RELATORIO.md',
  'design.md',
  '855058ec-ab39-4ab7-b3da-bff39cc7e410.png',
  'assets',
  'brand',
  'content',
  'previews',
  'tools',
  '.claude',
];

/* Nunca copiar. ------------------------------------------------------------- */
const SKIP = new Set(['node_modules', '.git', 'package-lock.json']);

let files = 0, bytes = 0;
function copy(rel) {
  const src = path.join(ROOT, rel);
  const dst = path.join(DEST, rel);
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (SKIP.has(entry)) continue;
      copy(path.join(rel, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    files++; bytes += st.size;
  }
}
for (const item of COPY) {
  if (!fs.existsSync(path.join(ROOT, item))) { console.log('  ausente, ignorado: ' + item); continue; }
  copy(item);
}

/* O README do repositorio documenta as calculadoras e o backend — nao sobrescrever. */
fs.copyFileSync(path.join(ROOT, 'README.md'), path.join(DEST, 'README-SITE.md'));
files++;

/* .gitignore: acrescentar o que falta, preservando as regras existentes. ------ */
const giPath = path.join(DEST, '.gitignore');
let gi = fs.existsSync(giPath) ? fs.readFileSync(giPath, 'utf8') : '';
const NEEDED = ['node_modules/', 'tools/node_modules/', '.DS_Store', 'Thumbs.db'];
const missing = NEEDED.filter((r) => !gi.split(/\r?\n/).includes(r));
if (missing.length) {
  gi = gi.trimEnd() + '\n\n# Dependencias das ferramentas de build do site institucional\n' + missing.join('\n') + '\n';
  fs.writeFileSync(giPath, gi);
}

/* sitemap.xml: uma unica lista cobrindo o site novo e as calculadoras.
   O lastmod de uma URL ja publicada e preservado — so recebe a data de hoje
   quem entra agora. Regerar a data a cada sincronizacao daria aos buscadores
   um sinal falso de que a pagina mudou. --------------------------------------- */
const today = new Date().toISOString().slice(0, 10);
const sitemapPath = path.join(DEST, 'sitemap.xml');
const previous = new Map();
if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) {
    previous.set(m[1], m[2]);
  }
}
const since = (loc, fallback) => previous.get(loc) || fallback;
const urls = [
  ['https://elektrosys.eng.br/', '1.0', since('https://elektrosys.eng.br/', today)],
  ['https://elektrosys.eng.br/ferramentas.html', '0.7', since('https://elektrosys.eng.br/ferramentas.html', today)],
  ['https://elektrosys.eng.br/motores.html', '0.8', since('https://elektrosys.eng.br/motores.html', today)],
  ['https://elektrosys.eng.br/solar.html', '0.8', since('https://elektrosys.eng.br/solar.html', '2026-07-14')],
  ['https://elektrosys.eng.br/memorial.html', '0.6', since('https://elektrosys.eng.br/memorial.html', '2026-07-14')],
];
fs.writeFileSync(path.join(DEST, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(([loc, pri, mod]) =>
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${pri}</priority>\n  </url>`
  ).join('\n') + '\n</urlset>\n');

/* robots.txt: o material de trabalho nao chega a ser publicado (ver _config.yml),
   entao nao ha o que bloquear aqui. ---------------------------------------- */
fs.writeFileSync(path.join(DEST, 'robots.txt'),
  `User-agent: *
Allow: /

Sitemap: https://elektrosys.eng.br/sitemap.xml
`);

/* _config.yml: o GitHub Pages roda Jekyll, e o que estiver em `exclude` fica no
   repositorio mas NAO e publicado. E assim que o material de trabalho sai do ar
   de verdade — robots.txt so pediria para nao indexar, sem restringir acesso.

   Nao excluir: assets/ (CSS, JS, fontes e imagens do site), styles.css e
   prices.json (as calculadoras carregam os dois em runtime). ---------------- */
fs.writeFileSync(path.join(DEST, '_config.yml'),
  `# Publicacao do GitHub Pages.
# Tudo listado em "exclude" continua versionado no repositorio, mas nao vai ao ar.
#
# NAO acrescente aqui: assets/, styles.css, prices.json, robot-status.json,
# og-image.png, CNAME, favicon.ico — o site e as calculadoras dependem deles.

exclude:
  # Material de trabalho do site institucional
  - tools/
  - content/
  - previews/
  - brand/
  - design.md
  - RELATORIO.md
  - README-SITE.md
  - package.json
  - 855058ec-ab39-4ab7-b3da-bff39cc7e410.png
  - .claude/

  # Codigo que nao faz parte do site publicado
  - backend/
  - scripts/

  # Padroes do Jekyll, repetidos porque "exclude" substitui a lista default
  - node_modules/
  - vendor/
  - Gemfile
  - Gemfile.lock
`);

console.log(`${files} arquivos copiados (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
console.log('.gitignore, sitemap.xml e robots.txt reconciliados.');
