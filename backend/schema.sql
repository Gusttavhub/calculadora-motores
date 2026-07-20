-- ElektroSys API — esquema D1 (SQLite)
-- Aplicado automaticamente pelo workflow deploy-backend.yml a cada push
-- (comando idempotente: CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  saved_at INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  contato TEXT NOT NULL,
  cidade TEXT,
  consumo TEXT,
  tipo TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proposals_saved_at ON proposals (saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
