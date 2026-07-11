#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotaciona o secret MELI_REFRESH_TOKEN do repositório via API do GitHub.

Necessário porque o refresh_token do Mercado Livre é de uso único: a cada
renovação, o anterior é invalidado e um novo é emitido pela API do ML. Sem
regravar o secret, o robô funcionaria só na primeira execução do cron e
falharia (silenciosamente, sem tocar em prices.json) em todas as seguintes.

Requer as variáveis de ambiente:
  GH_PAT             — token do GitHub com permissão "Secrets: Read and write"
                        restrita a ESTE repositório (fine-grained token).
                        NÃO é o GITHUB_TOKEN padrão do Actions — esse não tem
                        permissão para gerenciar secrets do repositório.
  NEW_REFRESH_TOKEN   — valor novo, recebido do passo anterior do workflow.
  REPO                — "owner/repo" (preenchido via github.repository).

Falha aqui não derruba o workflow: a atualização de preços desta rodada já
foi concluída e gravada; só a PRÓXIMA rodada fica comprometida se a rotação
continuar falhando (e o log deste passo avisa exatamente isso).
"""
import base64
import json
import os
import sys
import urllib.request

from nacl import encoding, public


def gh_api(method, path, token, body=None):
    url = f"https://api.github.com{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read()
        return json.loads(raw.decode("utf-8")) if raw else {}


def encrypt_secret(public_key_b64, secret_value):
    public_key = public.PublicKey(public_key_b64.encode("utf-8"), encoding.Base64Encoder())
    sealed_box = public.SealedBox(public_key)
    encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")


def main():
    token = os.environ["GH_PAT"]
    new_value = os.environ["NEW_REFRESH_TOKEN"]
    repo = os.environ["REPO"]

    key_info = gh_api("GET", f"/repos/{repo}/actions/secrets/public-key", token)
    encrypted_value = encrypt_secret(key_info["key"], new_value)

    gh_api("PUT", f"/repos/{repo}/actions/secrets/MELI_REFRESH_TOKEN", token, {
        "encrypted_value": encrypted_value,
        "key_id": key_info["key_id"],
    })
    print("[rotate_secret] MELI_REFRESH_TOKEN atualizado com sucesso.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[rotate_secret] falha ao rotacionar o secret: {e}")
        print("[rotate_secret] a atualização de preços desta rodada foi mantida; "
              "verifique o GH_PAT se isso persistir na próxima execução.")
        sys.exit(0)
