# ElektroSys — elektrosys.eng.br

Ferramentas de engenharia elétrica: calculadora de dimensionamento de cabos
para motores trifásicos (NBR 5410) e simulador de sistema fotovoltaico com
orçamento itemizado e proposta em PDF.

Site estático hospedado no GitHub Pages (branch `main`, domínio via `CNAME`).

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Calculadora de motores (NBR 5410) |
| `solar.html` | Simulador fotovoltaico + orçamento + PDF |
| `styles.css` | CSS estático gerado (Tailwind — ver "Rebuild do CSS") |
| `prices.json` | Referência de preços por classe (alimentado pelo robô ou semente estática) |
| `scripts/update_prices.py` | Robô: consulta a API do Mercado Livre e regrava `prices.json` |
| `scripts/rotate_secret.py` | Rotaciona o `MELI_REFRESH_TOKEN` (é de uso único) |
| `.github/workflows/update-prices.yml` | Cron semanal do robô (segunda, 12:00 UTC) + disparo manual |

## Rebuild do CSS (obrigatório ao adicionar classes Tailwind novas)

O site **não** usa o Tailwind Play CDN — o `styles.css` é gerado offline.
Se editar `index.html`/`solar.html` acrescentando classes que ainda não
existem no CSS, é preciso regerar:

1. Baixe o binário standalone: `tailwindcss-windows-x64.exe` v3.4.x
   (releases do repositório tailwindlabs/tailwindcss). Não precisa de Node.
2. Crie `tailwind.config.js` apontando `content` para os dois HTML e com o
   theme usado pelo site:

```js
module.exports = {
  content: ['./index.html', './solar.html'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Semi Condensed"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      colors: {
        ink: '#06121E', navy: '#0A1B2E', panel: '#0E2841', 'panel-2': '#133150',
        line: '#21425F', primary: '#2C7BE5', 'primary-700': '#1E5FB8',
        sky: '#5AA9F0', fg: '#E8F0F8', muted: '#8CA3BC',
        signal: '#2FB39A', alert: '#E4694F'
      }
    }
  }
};
```

3. `input.css` com as três diretivas `@tailwind base; @tailwind components; @tailwind utilities;`
4. Rode: `tailwindcss.exe -c tailwind.config.js -i input.css -o styles.css --minify`

## Equipamento real via IA (Gemini)

O `solar.html` tem o card "Equipamento real (IA)": digitando o modelo do
módulo/inversor, o Gemini (`gemini-flash-latest`) devolve os dados de
catálogo (Wp, dimensões, eficiência, kW, classe de qualidade) e aplica no
simulador. Funciona no modelo **traga sua chave**: o usuário salva a própria
chave (grátis em aistudio.google.com/apikey) e ela fica **só no localStorage
do navegador** — nunca no repositório. Dados de IA são sugestão: a interface
manda conferir o datasheet. O orçamento aceita cobrar módulos/inversores por
potência (R$/Wp, R$/kW) ou **por unidade** (R$/un).

## Robô de preços — como funciona

Toda segunda-feira o GitHub Actions roda `scripts/update_prices.py`, que:

1. Renova o token OAuth do Mercado Livre (o `refresh_token` é **de uso
   único** — o workflow regrava o secret novo via `scripts/rotate_secret.py`).
2. Busca anúncios públicos por marca/classe:
   módulos **Tier 1/2/3** (bancabilidade BNEF) e inversores
   **Linha A/B/C** (rede de assistência no Brasil).
3. Filtra anúncios plausíveis (novos, sem palavras de kit/acessório/usado,
   faixas de sanidade R$/Wp e R$/kW) e grava p10/mediana/p90 por classe em
   `prices.json`.
4. Classes com menos de 3 amostras mantêm o valor anterior, marcadas `stale`.

O `solar.html` carrega o `prices.json` sem bloquear o render; se os dados
tiverem mais de ~35 dias ou poucas amostras, cai na referência estática.
Valores editados manualmente pelo usuário **nunca** são sobrescritos.

Enquanto os secrets abaixo não estiverem configurados, o workflow termina
verde sem fazer nada — o site funciona normalmente com a referência estática.

## Robô de preços — configuração (fazer uma única vez)

> As credenciais são pessoais: gere e cole você mesmo, nunca as compartilhe
> (nem em chat com IA). O app do ML usado é o Client ID `1833248322066884`
> ("Gusttavo Gutierry"), **com PKCE habilitado** — por isso o fluxo abaixo
> gera `code_verifier`/`code_challenge`; sem eles a API responde
> `code_verifier is a required parameter`.

### 1. Obter o `refresh_token` (PowerShell, sessão única, sem pausas longas)

Cole o bloco inteiro no PowerShell; ele mostra a URL de autorização, espera
você colar o `code` e a Chave secreta (ocultada na digitação) e faz a troca:

```powershell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$codeVerifier = [Convert]::ToBase64String($bytes) -replace '\+','-' -replace '/','_' -replace '='
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$hash = $sha256.ComputeHash([System.Text.Encoding]::ASCII.GetBytes($codeVerifier))
$codeChallenge = [Convert]::ToBase64String($hash) -replace '\+','-' -replace '/','_' -replace '='

$clientId    = "1833248322066884"
$redirectUri = "https://elektrosys.eng.br"
$authUrl = "https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=$clientId&redirect_uri=$redirectUri&code_challenge=$codeChallenge&code_challenge_method=S256"

Write-Host "`n1) Abra esta URL no navegador, autorize, e copie o code da URL de retorno:"
Write-Host $authUrl -ForegroundColor Cyan

$code = Read-Host "`n2) Cole aqui SO o code (a parte depois de 'code=')"
$secureSecret = Read-Host "3) Cole aqui a Chave secreta" -AsSecureString
$clientSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret))

$resp = curl.exe -s -X POST https://api.mercadolibre.com/oauth/token -H "accept: application/json" -H "content-type: application/x-www-form-urlencoded" -d "grant_type=authorization_code" -d "client_id=$clientId" -d "client_secret=$clientSecret" -d "code=$code" -d "redirect_uri=$redirectUri" -d "code_verifier=$codeVerifier" | ConvertFrom-Json

if ($resp.refresh_token) {
    Write-Host "`nSUCESSO -- copie este refresh_token:" -ForegroundColor Green
    Write-Host $resp.refresh_token
} else {
    Write-Host "`nERRO:" -ForegroundColor Red
    $resp
}
```

Armadilhas conhecidas (todas já aconteceram):
- O `code` expira em minutos e é de uso único — gere um novo a cada tentativa.
- O `code` é **só** o trecho depois de `code=` (começa com `TG-`), nunca a URL inteira.
- O final do code (`-341445640`) é o ID do usuário e não muda; o miolo muda a cada autorização.
- Todo o bloco precisa rodar na **mesma janela** do PowerShell, sem fechar no meio
  (o `code_verifier` gerado no início precisa casar com o `code` autorizado).

### 2. Criar o token do GitHub (para o robô rotacionar o refresh_token)

github.com/settings/personal-access-tokens/new → Fine-grained →
*Only select repositories* → `calculadora-motores` →
Permissions → **Secrets: Read and write**. Copie o token (só aparece uma vez).

### 3. Cadastrar os 4 secrets do repositório

github.com/Gusttavhub/calculadora-motores/settings/secrets/actions →
*New repository secret*, um por um:

| Secret | Valor |
|---|---|
| `MELI_CLIENT_ID` | `1833248322066884` |
| `MELI_CLIENT_SECRET` | Chave secreta do app (tela "Configuração da aplicação") |
| `MELI_REFRESH_TOKEN` | O `refresh_token` obtido no passo 1 |
| `GH_PAT` | O token fine-grained do passo 2 |

### 4. Testar

Aba **Actions** → "Atualizar preços de referência (Solar)" → *Run workflow*.
Verde + commit automático em `prices.json` = funcionando. O simulador passa a
exibir "Preço de mercado ao vivo" nas classes com amostras suficientes.

> Higiene de credencial: se a Chave secreta do app já apareceu em algum chat
> ou print, regenere-a na tela do app **depois** de concluir a configuração
> (regenerar invalida a antiga — atualize também o secret `MELI_CLIENT_SECRET`).

---
Estimativas educacionais — não substituem projeto elétrico assinado.
© Gusttavo Gutierry · Engenharia Elétrica
