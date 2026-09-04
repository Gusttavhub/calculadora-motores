/* =============================================================================
   Validacao do site ElektroSys — `npm run check`
   Sem dependencias. Falha com codigo 1 se algum item obrigatorio quebrar.

   Cobre:
     1. Consistencia com content/site.config.json (telefone, CREA, links)
     2. Integridade de links internos, ancoras e arquivos referenciados
     3. Regras de acessibilidade verificaveis estaticamente
     4. Regras de conteudo do design.md (nada inventado, sem promessas absolutas)
     5. Contraste WCAG 2.2 AA dos pares de cor declarados nos tokens
   ============================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.config.json'), 'utf8'));
const PAGES = ['index.html', 'ferramentas.html'];

let fails = 0, warns = 0, passes = 0;
const fail = (m) => { console.log('  FALHA  ' + m); fails++; };
const warn = (m) => { console.log('  AVISO  ' + m); warns++; };
const pass = (m) => { passes++; if (process.env.VERBOSE) console.log('  ok     ' + m); };
const group = (t) => console.log('\n' + t);

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const html = Object.fromEntries(PAGES.map(p => [p, read(p)]));
const css = read('assets/css/styles.css');

/* -----------------------------------------------------------------------------
   1. Dados comerciais — o HTML precisa refletir o site.config.json
   ----------------------------------------------------------------------------- */
group('1. Dados comerciais (content/site.config.json)');
for (const page of PAGES) {
  const h = html[page];
  const required = [
    ['telefone exibido', cfg.contact.whatsappDisplay],
    ['CREA', cfg.professional.creaLabel],
    ['nome do responsavel', cfg.professional.name],
    ['link do WhatsApp', cfg.contact.whatsappUrl],
    ['LinkedIn', cfg.contact.linkedinUrl],
  ];
  for (const [label, value] of required) {
    if (h.includes(value)) pass(`${page}: ${label}`);
    else fail(`${page}: ${label} ausente ou divergente — esperado "${value}"`);
  }
  // nenhum outro numero de telefone pode aparecer
  const nums = [...h.matchAll(/wa\.me\/(\d+)/g)].map(m => m[1]);
  const wrong = nums.filter(n => n !== cfg.contact.whatsappNumber);
  if (wrong.length) fail(`${page}: numero de WhatsApp divergente: ${[...new Set(wrong)].join(', ')}`);
  else pass(`${page}: todos os wa.me apontam para ${cfg.contact.whatsappNumber}`);

  // toda ferramenta declarada precisa continuar acessivel
  for (const t of cfg.tools) {
    if (h.includes(t.url)) pass(`${page}: ferramenta ${t.id}`);
    else if (page === 'index.html') fail(`${page}: link da ferramenta "${t.id}" ausente (${t.url})`);
  }
}

/* -----------------------------------------------------------------------------
   2. Links, ancoras e arquivos
   ----------------------------------------------------------------------------- */
group('2. Links, ancoras e arquivos referenciados');
for (const page of PAGES) {
  const h = html[page];
  const ids = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const hrefs = [...h.matchAll(/href="([^"]+)"/g)].map(m => m[1]);

  for (const href of hrefs) {
    if (href.startsWith('#')) {
      const id = href.slice(1);
      if (ids.has(id)) pass(`${page}: ancora ${href}`);
      else fail(`${page}: ancora ${href} nao existe nesta pagina`);
    } else if (href.startsWith('http') || href.startsWith('mailto:')) {
      // externo — checar apenas a forma
      if (!/^https:\/\//.test(href)) fail(`${page}: link externo sem https — ${href}`);
    } else if (href.includes('#')) {
      const [file, id] = href.split('#');
      const target = file || page;
      if (!fs.existsSync(path.join(ROOT, target))) { fail(`${page}: arquivo inexistente — ${target}`); continue; }
      const targetIds = new Set([...read(target).matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
      if (targetIds.has(id)) pass(`${page}: ${href}`);
      else fail(`${page}: ancora #${id} nao existe em ${target}`);
    } else {
      const rel = href.replace(/^\//, '');
      if (rel === '' || fs.existsSync(path.join(ROOT, rel))) pass(`${page}: ${href}`);
      else fail(`${page}: arquivo inexistente — ${href}`);
    }
  }

  // src de imagens e scripts
  for (const m of h.matchAll(/(?:src)="([^"]+)"/g)) {
    const s = m[1];
    if (s.startsWith('http') || s.startsWith('data:')) continue;
    if (fs.existsSync(path.join(ROOT, s.replace(/^\//, '')))) pass(`${page}: src ${s}`);
    else fail(`${page}: src inexistente — ${s}`);
  }
}
// fontes referenciadas pelo CSS
for (const m of css.matchAll(/url\('\.\.\/([^']+)'\)/g)) {
  const f = path.join('assets', m[1]);
  if (fs.existsSync(path.join(ROOT, f))) pass(`css: ${f}`);
  else fail(`css: fonte inexistente — ${f}`);
}

/* -----------------------------------------------------------------------------
   3. Acessibilidade estatica
   ----------------------------------------------------------------------------- */
group('3. Acessibilidade');
for (const page of PAGES) {
  const h = html[page];

  const h1s = [...h.matchAll(/<h1[\s>]/g)].length;
  if (h1s === 1) pass(`${page}: exatamente um <h1>`);
  else fail(`${page}: ${h1s} elementos <h1> (deve haver exatamente 1)`);

  if (/<html lang="pt-BR"/.test(h)) pass(`${page}: lang="pt-BR"`);
  else fail(`${page}: atributo lang ausente ou incorreto`);

  if (/class="skip-link"/.test(h)) pass(`${page}: link "pular para o conteudo"`);
  else fail(`${page}: falta o link de pular para o conteudo`);

  if (/<main id="conteudo">/.test(h)) pass(`${page}: <main id="conteudo">`);
  else fail(`${page}: <main id="conteudo"> ausente`);

  // toda imagem precisa de alt
  for (const m of h.matchAll(/<img\b[^>]*>/g)) {
    if (/\balt="/.test(m[0])) pass(`${page}: img com alt`);
    else fail(`${page}: <img> sem alt — ${m[0].slice(0, 80)}`);
  }

  // o logotipo precisa do texto alternativo definido em design.md
  const logoAlts = [...h.matchAll(/<img[^>]*elektrosys-logo[^>]*alt="([^"]*)"/g)].map(m => m[1]);
  for (const a of logoAlts) {
    if (a === cfg.brand.logoAlt) pass(`${page}: alt do logotipo`);
    else fail(`${page}: alt do logotipo deveria ser "${cfg.brand.logoAlt}", veio "${a}"`);
  }

  // link externo em nova aba precisa de rel e de aviso textual
  for (const m of h.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (/rel="noopener noreferrer"/.test(m[0])) pass(`${page}: target=_blank com rel`);
    else fail(`${page}: target="_blank" sem rel="noopener noreferrer" — ${m[0].slice(0, 90)}`);
  }

  // svg decorativo precisa estar escondido da arvore de acessibilidade
  for (const m of h.matchAll(/<svg\b[^>]*>/g)) {
    if (/aria-hidden="true"/.test(m[0])) pass(`${page}: svg decorativo oculto`);
    else fail(`${page}: <svg> sem aria-hidden — ${m[0].slice(0, 80)}`);
  }

  // o botao do menu precisa dos estados ARIA
  if (page && /data-nav-toggle[^>]*aria-expanded="false"[^>]*aria-controls="menu-principal"/.test(h)) {
    pass(`${page}: botao de menu com aria-expanded e aria-controls`);
  } else fail(`${page}: botao do menu movel sem aria-expanded/aria-controls`);

  // hierarquia de titulos sem saltos
  const levels = [...h.matchAll(/<h([1-6])[\s>]/g)].map(m => Number(m[1]));
  let prev = levels[0], ok = true;
  for (const l of levels.slice(1)) { if (l > prev + 1) { ok = false; break; } prev = l; }
  if (ok) pass(`${page}: hierarquia de titulos sem saltos`);
  else fail(`${page}: salto na hierarquia de titulos`);
}

// reduced motion precisa estar tratado
if (/@media \(prefers-reduced-motion: reduce\)/.test(css)) pass('css: prefers-reduced-motion tratado');
else fail('css: falta o bloco prefers-reduced-motion');
if (/:focus-visible\s*\{[^}]*outline:\s*2px/.test(css)) pass('css: foco visivel de 2px');
else fail('css: falta o anel de foco visivel');

/* -----------------------------------------------------------------------------
   4. Regras de conteudo do design.md
   ----------------------------------------------------------------------------- */
group('4. Conteudo (regras do design.md)');
const BANNED = [
  [/\bgarantia de resultado\b/i, 'promessa de resultado'],
  [/\bgarantimos\b/i, 'promessa absoluta'],
  [/\bsolu[cç][oõ]es inovadoras\b/i, 'clichê proibido'],
  [/\bexcel[eê]ncia\b/i, 'clichê proibido'],
  [/\brevolucion[aá]ri/i, 'clichê proibido'],
  [/\bl[ií]der de mercado\b/i, 'clichê proibido'],
  [/ART emitida em todo projeto/i, 'ART deve ser "quando aplicável"'],
  [/\bclientes? satisfeitos?\b/i, 'depoimento/estatistica inventada'],
  [/\b\d+\+? (?:clientes|obras|projetos entregues)\b/i, 'estatistica inventada'],
  [/\bCNPJ\b/i, 'CNPJ nao foi fornecido'],
  [/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/, 'CNPJ nao foi fornecido'],
  // e-mail tem regra propria abaixo: o do config e permitido, qualquer outro nao
];
for (const page of PAGES) {
  const h = html[page];
  const text = h.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const [re, why] of BANNED) {
    const m = text.match(re);
    if (m) fail(`${page}: conteudo proibido (${why}) — "${m[0]}"`);
  }
  pass(`${page}: sem conteudo proibido`);

  // Só o e-mail declarado no config pode aparecer. Qualquer outro endereço e
  // invencao ou erro de digitacao.
  const emails = [...new Set((text.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []))];
  const intrusos = emails.filter((e) => e !== cfg.contact.email);
  if (intrusos.length) fail(`${page}: e-mail nao declarado em site.config.json — ${intrusos.join(', ')}`);
  else pass(`${page}: sem e-mail fora do config`);

  if (/ART quando aplic[aá]vel/i.test(h) || page === 'ferramentas.html') pass(`${page}: ART condicionada`);
  else fail(`${page}: falta a ressalva "ART quando aplicável"`);
}
// aviso obrigatorio das ferramentas
const disclaimerCore = 'finalidade educacional e de estimativa';
for (const page of PAGES) {
  if (html[page].includes(disclaimerCore)) pass(`${page}: aviso das ferramentas`);
  else fail(`${page}: falta o aviso obrigatorio das ferramentas`);
}
// ferramentas nao podem aparecer antes de servicos e pericias
const idx = html['index.html'];
const posServ = idx.indexOf('id="servicos"');
const posPer = idx.indexOf('id="pericias"');
const posFer = idx.indexOf('id="ferramentas"');
if (posServ < posFer && posPer < posFer) pass('index: ferramentas em posicao secundaria');
else fail('index: a secao de ferramentas aparece antes de servicos/pericias');

// Colisao de URL: uma ferramenta publicada no mesmo caminho de uma pagina deste
// site faria o link apontar para a propria pagina depois da publicacao.
{
  const own = new Set([cfg.site.canonicalHome, cfg.site.domain + '/', cfg.site.domain + '/index.html']);
  PAGES.forEach(p => own.add(cfg.site.domain + '/' + p));
  const declared = cfg.pendingValidation.items.map(i => i.text + ' ' + i.status).join(' ');
  for (const t of cfg.tools) {
    const normalized = t.url.replace(/\/index\.html$/, '/');
    if (!own.has(t.url) && !own.has(normalized)) { pass(`ferramenta "${t.id}" sem colisao de caminho`); continue; }
    // Colisao ja registrada como pendencia: avisa, mas nao reprova o restante.
    // Uma colisao nao declarada e erro — nao pode passar despercebida.
    if (declared.includes(t.url)) {
      warn(`ferramenta "${t.id}" (${t.url}) ocupa o mesmo caminho da home deste site.`);
      warn(`       Pendencia registrada em site.config.json. RESOLVER ANTES DE PUBLICAR.`);
    } else {
      fail(`ferramenta "${t.id}" (${t.url}) colide com uma pagina deste site e nao esta declarada em pendingValidation`);
    }
  }
}

// pendencias declaradas: o texto precisa realmente existir na pagina indicada
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, "").toLowerCase();
for (const item of cfg.pendingValidation.items) {
  if (item.where === 'nao publicado' || !item.where.startsWith('index.html')) continue;
  if (fold(idx).includes(fold(item.text))) pass(`pendencia "${item.id}" localizada no HTML`);
  else warn(`pendencia "${item.id}" declarada no config mas nao encontrada no HTML`);
}
console.log(`  nota   ${cfg.pendingValidation.items.length} itens aguardam validacao humana (ver README)`);

/* -----------------------------------------------------------------------------
   5. Contraste WCAG 2.2 AA
   ----------------------------------------------------------------------------- */
group('5. Contraste (WCAG 2.2 AA)');
const hex = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const ratio = (a, b) => { const [l1, l2] = [lum(hex(a)), lum(hex(b))].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };

// le os tokens direto do CSS para nao duplicar valores
const token = (name) => {
  const m = css.match(new RegExp('--' + name + ':\\s*(#[0-9A-Fa-f]{6})'));
  if (!m) throw new Error('token nao encontrado: ' + name);
  return m[1];
};
const T = Object.fromEntries(['color-primary','color-surface','color-surface-elevated','color-neutral','color-text-primary',
  'color-text-secondary','color-tertiary','color-secondary','color-link-on-dark','color-cta-primary','color-whatsapp',
  'color-whatsapp-ink','color-white','color-border-interactive','color-ink-on-light','color-ink-on-light-muted']
  .map(n => [n, token(n)]));

const CHECKS = [
  ['texto principal sobre fundo institucional', T['color-text-primary'], T['color-primary'], 4.5],
  ['texto secundario sobre fundo institucional', T['color-text-secondary'], T['color-primary'], 4.5],
  ['texto secundario sobre superficie', T['color-text-secondary'], T['color-surface'], 4.5],
  ['texto secundario sobre superficie elevada', T['color-text-secondary'], T['color-surface-elevated'], 4.5],
  ['texto principal sobre superficie', T['color-text-primary'], T['color-surface'], 4.5],
  ['link sobre fundo institucional', T['color-link-on-dark'], T['color-primary'], 4.5],
  ['link sobre superficie', T['color-link-on-dark'], T['color-surface'], 4.5],
  ['botao primario: branco sobre azul', T['color-white'], T['color-cta-primary'], 4.5],
  ['botao WhatsApp: tinta sobre verde', T['color-whatsapp-ink'], T['color-whatsapp'], 4.5],
  ['tinta sobre superficie clara', T['color-ink-on-light'], T['color-neutral'], 4.5],
  ['tinta secundaria sobre superficie clara', T['color-ink-on-light-muted'], T['color-neutral'], 4.5],
  ['link sobre superficie clara', T['color-secondary'], T['color-neutral'], 4.5],
  // componentes de interface: 3:1
  ['anel de foco sobre fundo institucional', T['color-tertiary'], T['color-primary'], 3],
  ['anel de foco sobre superficie clara', T['color-tertiary'], T['color-neutral'], 3],
  ['borda de botao secundario', T['color-border-interactive'], T['color-primary'], 3],
];
for (const [label, fg, bg, min] of CHECKS) {
  const r = ratio(fg, bg);
  const line = `${label}: ${r.toFixed(2)}:1 (min ${min}) ${fg} sobre ${bg}`;
  if (r >= min) pass(line);
  else fail(line);
}

/* -----------------------------------------------------------------------------
   Resumo
   ----------------------------------------------------------------------------- */
console.log('\n' + '-'.repeat(64));
console.log(`Resultado: ${passes} verificacoes OK, ${warns} avisos, ${fails} falhas`);
if (fails) { console.log('VALIDACAO REPROVADA\n'); process.exit(1); }
console.log('VALIDACAO APROVADA\n');
