#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ElektroSys — robô de preços (Fase 2)

Consulta a API pública do Mercado Livre por marca/classe de equipamento
(módulos: Tier 1/2/3 · inversores: Linha A/B/C), filtra anúncios plausíveis
e grava prices.json com p10/mediana/p90 por classe.

Projetado para rodar sem intervenção via GitHub Actions (ver
.github/workflows/update-prices.yml). Nunca deve corromper o prices.json
existente: se faltar credencial, se a API falhar, ou se uma classe não
tiver amostras suficientes, essa classe herda o último valor bom conhecido
e é marcada como "stale".

Credenciais (variáveis de ambiente, injetadas via GitHub Secrets):
  MELI_CLIENT_ID, MELI_CLIENT_SECRET, MELI_REFRESH_TOKEN
Se qualquer uma faltar, o script sai com código 0 (sucesso) sem alterar
prices.json — isso evita que o cron do GitHub Actions fique gerando
"falhas" semanais só por falta de configuração.
"""

import json
import os
import re
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PRICES_PATH = os.path.join(os.path.dirname(__file__), "..", "prices.json")
STATUS_PATH = os.path.join(os.path.dirname(__file__), "..", "robot-status.json")
API_BASE = "https://api.mercadolibre.com"
MIN_SAMPLES = 3          # abaixo disso, não confiamos no dado — mantém o anterior
REQUEST_DELAY_S = 0.35   # educado com a API pública
RESULTS_PER_QUERY = 20

# Marcas curadas por classe. Não é uma lista oficial — é referência de mercado
# (Tier 1 aproxima a lista de bancabilidade BloombergNEF; "Linha" de inversor
# é corte por rede de assistência técnica no Brasil). Ajustável com o tempo.
MODULE_BRANDS = {
    "tier1": ["Jinko Solar", "Trina Solar", "Canadian Solar", "LONGi", "JA Solar", "Risen Energy", "BYD", "Astronergy"],
    "tier2": ["Znshine", "DAH Solar", "Boviet", "AE Solar", "Sunport Power"],
    "tier3": [],  # sem filtro de marca — captura o segmento genérico/importado
}
INVERTER_BRANDS = {
    "linhaA": ["Growatt", "Fronius", "SMA", "Sungrow", "Huawei", "Solis", "Deye", "Goodwe"],
    "linhaB": ["Sofar Solar", "Solplanet", "Foxess"],
    "linhaC": [],  # sem filtro de marca — captura o segmento genérico/importado
}

EXCLUDE_WORDS = ["kit", "acessorio", "acessório", "cabo", "conector", "estrutura",
                 "suporte", "usado", "peça", "peca", "reparo", "capa", "protetor"]

W_RE = re.compile(r"(\d{3,4})\s?w(?:p)?\b", re.IGNORECASE)
KW_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s?kw\b", re.IGNORECASE)


def log(msg):
    print(f"[update_prices] {msg}", flush=True)


def describe_error(e):
    """Extrai a mensagem útil de um erro — incluindo o corpo da resposta HTTP do ML."""
    if isinstance(e, urllib.error.HTTPError):
        try:
            body = e.read().decode("utf-8", "replace")
        except Exception:
            body = ""
        return f"HTTP {e.code}: {body[:500]}"
    return f"{type(e).__name__}: {e}"


def write_status(state, detail):
    """Grava robot-status.json (commitado) para diagnóstico sem depender dos logs do Actions.
    Nunca contém segredo: só estado e a mensagem de erro pública do Mercado Livre."""
    try:
        with open(STATUS_PATH, "w", encoding="utf-8") as f:
            json.dump({
                "checkedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "state": state,
                "detail": detail,
            }, f, ensure_ascii=False, indent=2)
            f.write("\n")
    except Exception:
        pass


def http_json(url, data=None, headers=None):
    headers = headers or {}
    if data is not None:
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    else:
        req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def refresh_access_token(client_id, client_secret, refresh_token):
    """Troca o refresh_token (uso único!) por um access_token novo + refresh_token novo."""
    body = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
    }).encode("utf-8")
    resp = http_json(
        f"{API_BASE}/oauth/token",
        data=body,
        headers={"accept": "application/json", "content-type": "application/x-www-form-urlencoded"},
    )
    return resp["access_token"], resp["refresh_token"]


# Diagnóstico agregado da coleta (vai para robot-status.json)
DIAG = {"queries": 0, "raw_results": 0, "http_errors": {}, "sample_titles": []}


def search(query, access_token):
    params = urllib.parse.urlencode({"q": query, "limit": RESULTS_PER_QUERY})
    url = f"{API_BASE}/sites/MLB/search?{params}"
    headers = {"Authorization": f"Bearer {access_token}"}
    DIAG["queries"] += 1
    try:
        results = http_json(url, headers=headers).get("results", [])
        DIAG["raw_results"] += len(results)
        for it in results[:2]:
            if len(DIAG["sample_titles"]) < 6:
                DIAG["sample_titles"].append(it.get("title", "")[:60])
        return results
    except urllib.error.HTTPError as e:
        DIAG["http_errors"][str(e.code)] = DIAG["http_errors"].get(str(e.code), 0) + 1
        log(f"  aviso: busca '{query}' falhou ({e.code}) — pulando")
        return []
    except Exception as e:
        DIAG["http_errors"]["outro"] = DIAG["http_errors"].get("outro", 0) + 1
        log(f"  aviso: busca '{query}' falhou ({e}) — pulando")
        return []


def is_clean_title(title):
    low = title.lower()
    return not any(w in low for w in EXCLUDE_WORDS)


def extract_module_ratio(item):
    """Retorna R$/Wp do anúncio, ou None se não conseguir extrair com confiança."""
    if item.get("condition") != "new":
        return None
    title = item.get("title", "")
    if not is_clean_title(title):
        return None
    m = W_RE.search(title)
    if not m:
        return None
    watts = int(m.group(1))
    if not (300 <= watts <= 700):
        return None
    price = item.get("price")
    if not price or price <= 0:
        return None
    ratio = price / watts
    if not (0.30 <= ratio <= 3.00):  # sanidade física — fora disso é kit/erro/acessório
        return None
    return ratio


def extract_inverter_ratio(item):
    """Retorna R$/kW do anúncio, ou None se não conseguir extrair com confiança."""
    if item.get("condition") != "new":
        return None
    title = item.get("title", "")
    if not is_clean_title(title):
        return None
    kw = None
    mk = KW_RE.search(title)
    if mk:
        kw = float(mk.group(1).replace(",", "."))
    else:
        mw = re.search(r"(\d{3,5})\s?w\b", title, re.IGNORECASE)
        if mw:
            watts = int(mw.group(1))
            if watts >= 800:
                kw = watts / 1000.0
    if kw is None or not (1.0 <= kw <= 30.0):
        return None
    price = item.get("price")
    if not price or price <= 0:
        return None
    ratio = price / kw
    if not (150 <= ratio <= 2500):
        return None
    return ratio


def collect_ratios(brands, base_query, extractor, access_token):
    ratios = []
    queries = [f"{b} {base_query}" for b in brands] if brands else [base_query]
    for q in queries:
        for item in search(q, access_token):
            r = extractor(item)
            if r is not None:
                ratios.append(r)
        time.sleep(REQUEST_DELAY_S)
    return ratios


def percentile(sorted_vals, pct):
    if not sorted_vals:
        return None
    k = (len(sorted_vals) - 1) * pct
    f, c = int(k), min(int(k) + 1, len(sorted_vals) - 1)
    if f == c:
        return sorted_vals[f]
    return sorted_vals[f] + (sorted_vals[c] - sorted_vals[f]) * (k - f)


def summarize(ratios, previous):
    """Compõe {p10, median, p90, n, stale} — mantém o valor anterior se houver poucas amostras."""
    if len(ratios) < MIN_SAMPLES:
        if previous:
            return {**previous, "stale": True}
        return {"p10": None, "median": None, "p90": None, "n": len(ratios), "stale": True}
    s = sorted(ratios)
    return {
        "p10": round(percentile(s, 0.10), 4),
        "median": round(statistics.median(s), 4),
        "p90": round(percentile(s, 0.90), 4),
        "n": len(s),
        "stale": False,
    }


def load_previous():
    try:
        with open(PRICES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"modulo": {}, "inversor": {}}


def main():
    client_id = os.environ.get("MELI_CLIENT_ID", "").strip()
    client_secret = os.environ.get("MELI_CLIENT_SECRET", "").strip()
    refresh_token = os.environ.get("MELI_REFRESH_TOKEN", "").strip()

    if not (client_id and client_secret and refresh_token):
        which = [n for n, v in [("MELI_CLIENT_ID", client_id), ("MELI_CLIENT_SECRET", client_secret),
                                 ("MELI_REFRESH_TOKEN", refresh_token)] if not v]
        log(f"credenciais ausentes/vazias: {', '.join(which)} — nada a fazer ainda.")
        write_status("sem_credenciais", f"secrets ausentes ou vazios: {', '.join(which)}")
        sys.exit(0)

    try:
        access_token, new_refresh_token = refresh_access_token(client_id, client_secret, refresh_token)
    except Exception as e:
        detail = describe_error(e)
        log(f"erro ao renovar o token do Mercado Livre: {detail}")
        log("prices.json NÃO foi alterado. Verifique se o refresh_token ainda é válido "
            "(ele é de uso único — se algo o consumiu fora deste robô, é preciso gerar um novo).")
        write_status("erro_token", detail)
        sys.exit(0)

    # Publica o refresh_token novo via GitHub Actions output — o workflow o grava
    # de volta como secret (o token do ML é de uso único e precisa ser rotacionado).
    gh_output = os.environ.get("GITHUB_OUTPUT")
    if gh_output:
        with open(gh_output, "a", encoding="utf-8") as f:
            f.write(f"new_refresh_token={new_refresh_token}\n")

    previous = load_previous()

    log("consultando módulos...")
    modulo = {}
    for tier, brands in MODULE_BRANDS.items():
        ratios = collect_ratios(brands, "painel solar fotovoltaico", extract_module_ratio, access_token)
        modulo[tier] = summarize(ratios, previous.get("modulo", {}).get(tier))
        log(f"  {tier}: {len(ratios)} amostra(s) válida(s)")

    log("consultando inversores...")
    inversor = {}
    for linha, brands in INVERTER_BRANDS.items():
        ratios = collect_ratios(brands, "inversor solar grid tie", extract_inverter_ratio, access_token)
        inversor[linha] = summarize(ratios, previous.get("inversor", {}).get(linha))
        log(f"  {linha}: {len(ratios)} amostra(s) válida(s)")

    out = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": "mercadolivre_api",
        "modulo": modulo,
        "inversor": inversor,
    }
    with open(PRICES_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    log(f"prices.json atualizado: {PRICES_PATH}")

    counts = {**{f"modulo.{k}": v.get("n", 0) for k, v in modulo.items()},
              **{f"inversor.{k}": v.get("n", 0) for k, v in inversor.items()}}
    write_status("ok", {
        "amostras": counts,
        "diagnostico_coleta": {
            "buscas_feitas": DIAG["queries"],
            "anuncios_brutos_recebidos": DIAG["raw_results"],
            "erros_http": DIAG["http_errors"],
            "titulos_exemplo": DIAG["sample_titles"],
        }
    })


if __name__ == "__main__":
    main()
