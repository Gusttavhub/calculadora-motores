// ============================================================================
// ElektroSys API — Cloudflare Worker + D1
// ============================================================================
// Rotas:
//   POST   /api/auth              { passphrase }                  -> { ok }
//   GET    /api/proposals         (auth)                          -> [{id,nome,savedAt}]
//   GET    /api/proposals/:id     (auth)                          -> {id,nome,savedAt,snapshot}
//   PUT    /api/proposals/:id     (auth) { nome, snapshot }        -> { ok, savedAt }
//   DELETE /api/proposals/:id     (auth)                          -> { ok }
//   POST   /api/leads             (público) { nome, contato, ... } -> { ok }
//   GET    /api/leads             (auth)                          -> [{...}]
//   POST   /api/gemini/generate   (auth) { prompt, schema }        -> proxy Gemini (JSON estruturado)
//   POST   /api/gemini/url        (auth) { prompt }                -> proxy Gemini (leitura de URL)
//
// Autenticação: header "Authorization: Bearer <ACCESS_PASSPHRASE>".
// Passphrase única (ferramenta de uso pessoal/pequena equipe) — sem cadastro
// de usuário, sem senha em banco. Definida como secret do Worker (nunca no
// código nem no repositório): `wrangler secret put ACCESS_PASSPHRASE`.
//
// Sem dependências externas — só a API nativa do Workers (fetch, D1).
// ============================================================================

const CORS_ORIGIN = 'https://elektrosys.eng.br';
const GEMINI_MODEL = 'gemini-flash-latest';

const CORS = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}

function checkAuth(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return !!(token && env.ACCESS_PASSPHRASE && token === env.ACCESS_PASSPHRASE);
}

function newId() {
  // ID simples e único o suficiente para este volume (sem dependência de uuid)
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

async function geminiProxy(env, body, useUrlContext) {
  if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY não configurada no servidor (Worker secret).' }, 500);
  const prompt = String(body.prompt || '').slice(0, 4000);
  if (!prompt) return json({ error: 'prompt vazio' }, 400);

  const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } };
  if (useUrlContext) {
    payload.tools = [{ url_context: {} }];
  } else {
    payload.generationConfig.responseMimeType = 'application/json';
    if (body.schema) payload.generationConfig.responseSchema = body.schema;
  }

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
  );
  const data = await r.json();
  if (!r.ok) return json({ error: data.error && data.error.message || `Gemini HTTP ${r.status}` }, r.status);

  const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
  const text = parts ? parts.map(p => p.text || '').join('') : '';
  return json({ text });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // --- Autenticação ---
      if (path === '/api/auth' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        if (body.passphrase && env.ACCESS_PASSPHRASE && body.passphrase === env.ACCESS_PASSPHRASE) return json({ ok: true });
        return json({ ok: false, error: 'Senha incorreta.' }, 401);
      }

      // --- Propostas ---
      if (path === '/api/proposals' && request.method === 'GET') {
        if (!checkAuth(request, env)) return json({ error: 'não autorizado' }, 401);
        const { results } = await env.DB.prepare(
          'SELECT id, nome, saved_at as savedAt FROM proposals ORDER BY saved_at DESC LIMIT 500'
        ).all();
        return json(results);
      }

      const propMatch = path.match(/^\/api\/proposals\/([a-zA-Z0-9_-]+)$/);
      if (propMatch) {
        if (!checkAuth(request, env)) return json({ error: 'não autorizado' }, 401);
        const id = propMatch[1];

        if (request.method === 'GET') {
          const row = await env.DB.prepare('SELECT * FROM proposals WHERE id = ?').bind(id).first();
          if (!row) return json({ error: 'não encontrada' }, 404);
          return json({ id: row.id, nome: row.nome, savedAt: row.saved_at, snapshot: JSON.parse(row.snapshot_json) });
        }

        if (request.method === 'PUT') {
          const body = await request.json().catch(() => ({}));
          const nome = String(body.nome || 'Sem nome').slice(0, 200);
          const now = Date.now();
          await env.DB.prepare(
            `INSERT INTO proposals (id, nome, saved_at, snapshot_json) VALUES (?,?,?,?)
             ON CONFLICT(id) DO UPDATE SET nome=excluded.nome, saved_at=excluded.saved_at, snapshot_json=excluded.snapshot_json`
          ).bind(id, nome, now, JSON.stringify(body.snapshot || {})).run();
          return json({ ok: true, savedAt: now });
        }

        if (request.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM proposals WHERE id = ?').bind(id).run();
          return json({ ok: true });
        }
      }

      // Criar proposta nova (sem id ainda) — POST devolve o id gerado
      if (path === '/api/proposals' && request.method === 'POST') {
        if (!checkAuth(request, env)) return json({ error: 'não autorizado' }, 401);
        const body = await request.json().catch(() => ({}));
        const id = newId();
        const nome = String(body.nome || 'Sem nome').slice(0, 200);
        const now = Date.now();
        await env.DB.prepare('INSERT INTO proposals (id, nome, saved_at, snapshot_json) VALUES (?,?,?,?)')
          .bind(id, nome, now, JSON.stringify(body.snapshot || {})).run();
        return json({ ok: true, id, savedAt: now });
      }

      // --- Leads (captação pública do simulador) ---
      if (path === '/api/leads' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const nome = String(body.nome || '').trim().slice(0, 120);
        const contato = String(body.contato || '').trim().slice(0, 120);
        if (!nome || !contato) return json({ error: 'Preencha nome e contato.' }, 400);
        await env.DB.prepare(
          'INSERT INTO leads (nome, contato, cidade, consumo, tipo, created_at) VALUES (?,?,?,?,?,?)'
        ).bind(
          nome, contato,
          String(body.cidade || '').slice(0, 120),
          String(body.consumo || '').slice(0, 60),
          String(body.tipo || 'solar').slice(0, 40),
          Date.now()
        ).run();
        return json({ ok: true });
      }

      if (path === '/api/leads' && request.method === 'GET') {
        if (!checkAuth(request, env)) return json({ error: 'não autorizado' }, 401);
        const { results } = await env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 300').all();
        return json(results);
      }

      // --- Proxy Gemini (chave fica só no servidor) ---
      if (path === '/api/gemini/generate' && request.method === 'POST') {
        if (!checkAuth(request, env)) return json({ error: 'não autorizado' }, 401);
        const body = await request.json().catch(() => ({}));
        return await geminiProxy(env, body, false);
      }
      if (path === '/api/gemini/url' && request.method === 'POST') {
        if (!checkAuth(request, env)) return json({ error: 'não autorizado' }, 401);
        const body = await request.json().catch(() => ({}));
        return await geminiProxy(env, body, true);
      }

      return json({ error: 'rota não encontrada' }, 404);
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500);
    }
  }
};
