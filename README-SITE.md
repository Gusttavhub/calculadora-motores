# ElektroSys — site institucional e identidade

Site institucional da **ElektroSys Engenharia Elétrica** e aplicação da marca em
cartão de apresentação.

Responsável técnico: **Gusttavo Gutierry**, Engenheiro Eletricista,
CREA 1023983184D-GO.

Construído conforme [`design.md`](design.md), que é a fonte de verdade para
identidade visual, conteúdo, arquitetura, acessibilidade e critérios de aceite.

---

## Stack

HTML, CSS e JavaScript estáticos. **Sem framework, sem build e sem dependências
em produção.** O que vai para o servidor é exatamente o que está no repositório.

O JavaScript é apenas melhoria progressiva: com ele desligado, todo o conteúdo,
todos os links e o WhatsApp continuam funcionando. Os serviços usam
`<details>/<summary>` nativos, que abrem e fecham sem script.

As dependências em `tools/` servem só para gerar ativos (logotipo, ícones,
cartão, capturas). Elas nunca são carregadas pelo site.

---

## Como executar

```bash
npm run dev
```

Abre em <http://localhost:4173>. É um servidor estático de ~50 linhas, sem
dependências (`tools/serve.mjs`).

Também funciona abrir `index.html` direto no navegador, mas alguns caminhos
absolutos (favicon, manifest) só resolvem servindo a pasta.

---

## Estrutura

```
index.html               Página principal (todas as seções, âncoras reais)
ferramentas.html         Rota secundária das calculadoras
robots.txt  sitemap.xml  site.webmanifest  favicon.ico

assets/
  css/styles.css         Folha única, tokens em CSS Custom Properties
  js/main.js             Menu móvel, estado do cabeçalho, entrada de seções
  fonts/                 Barlow Semi Condensed, Inter, IBM Plex Mono (woff2)
  brand/                 Logotipo normalizado, símbolo, favicons

content/
  site.config.json       Dados comerciais — telefone, CREA, links, pendências

brand/business-card/     Cartão: SVG, PDF, PNG e PRINTING.md

previews/                Capturas do site em 1920, 1440, 768 e 375 px

tools/                   Scripts de geração e validação (não vão ao ar)
```

### Por que duas páginas e não uma SPA

`design.md` pede URLs reais e indexáveis e proíbe simular páginas trocando
conteúdo por estado JavaScript. A página principal usa âncoras semânticas
(`#servicos`, `#pericias`, `#sobre`, `#contato`) e as ferramentas ficam em uma
rota própria, em posição secundária.

---

## Como editar

### Dados comerciais

Telefone, CREA, links e mensagens do WhatsApp estão em
[`content/site.config.json`](content/site.config.json).

Esse arquivo é a referência canônica, mas o HTML é estático — os valores também
aparecem no markup. Depois de alterar qualquer dado, rode:

```bash
npm run check
```

A validação compara o HTML com o config e **falha** se algo divergir. Ela
verifica número do WhatsApp, CREA, nome, LinkedIn e os links das três
ferramentas, em todas as páginas.

### Cores, tipografia e espaçamento

Tudo em `:root` no topo de [`assets/css/styles.css`](assets/css/styles.css),
mapeado a partir de `design.md`. Não usar valores soltos: sempre `var(--token)`.

### Textos

Direto no HTML. As regras de redação estão em `design.md` — em resumo: primeira
pessoa quando Gusttavo assume o atendimento, verbos concretos, nada de
superlativo, e `ART quando aplicável` em vez de prometer ART em todo serviço.

`npm run check` recusa uma lista de termos proibidos (promessa de resultado,
clichês, e-mail, CNPJ e estatísticas inventadas).

---

## Verificação

```bash
npm run verify     # validação do site + teste do QR code
npm run check      # só a validação do site
npm run test:qr    # só o QR do cartão
```

`npm run check` roda **204 verificações** em cinco grupos:

1. **Dados comerciais** — HTML consistente com o `site.config.json`.
2. **Links** — toda âncora existe, todo arquivo referenciado existe, todo link
   externo usa `https`, e nenhuma ferramenta colide com um caminho deste site.
3. **Acessibilidade** — um único `h1`, hierarquia de títulos sem saltos, `lang`,
   link de pular conteúdo, `alt` em toda imagem, `rel="noopener noreferrer"` em
   todo `target="_blank"`, `aria-hidden` em SVG decorativo, estados ARIA do menu.
4. **Conteúdo** — sem termos proibidos, com o aviso das ferramentas, e as
   ferramentas em posição secundária em relação a serviços e perícias.
5. **Contraste** — 15 pares de cor conferidos contra WCAG 2.2 AA, lendo os
   tokens direto do CSS.

---

## Regenerar ativos

```bash
npm run brand:logo   # logotipo normalizado, símbolo e favicons
npm run brand        # cartão (SVG + PDF) e teste do QR
npm run brand:png    # pré-visualizações PNG do cartão (abrir localhost:4199)
npm run previews     # capturas do site (precisa do npm run dev em outro terminal)
```

`npm run brand:png` e `npm run previews` dependem de um navegador: o primeiro
usa a página local de rasterização, o segundo usa o Chrome ou o Edge já
instalado, em modo headless.

### Sobre o logotipo

O arquivo oficial recebido é `855058ec-ab39-4ab7-b3da-bff39cc7e410.png`, na raiz.
Ele **não foi redesenhado, recolorido, vetorizado automaticamente nem
substituído**.

`npm run brand:logo` faz apenas duas operações não destrutivas: recorta o
enquadramento e separa o fundo em canal alfa. As cores originais são preservadas
exatamente (`#025797` no símbolo e no wordmark, `#0C243F` no descritor e no
filete) e a proporção 2,251:1 é mantida.

Sobre fundo escuro o logotipo é aplicado **sobre uma placa clara**, nunca
invertido — a versão azul sobre o azul-marinho institucional não atinge
contraste suficiente, e `design.md` proíbe inverter o bitmap.

---

## Publicação

O site é estático: publique o conteúdo da raiz do projeto.

**Não precisa ir para o servidor:** `tools/`, `previews/`, `content/`,
`brand/`, `design.md`, `package.json` e o PNG original do logotipo.

**Precisa ir:** `index.html`, `ferramentas.html`, `assets/`, `favicon.ico`,
`robots.txt`, `sitemap.xml`, `site.webmanifest`.

Antes de publicar:

1. Rode `npm run verify` e confirme que passa.
2. Resolva as pendências da seção abaixo.
3. Confirme que o domínio em `sitemap.xml`, nos `canonical` e nas tags
   Open Graph é `https://elektrosys.eng.br` — trocar se for outro.
4. Confirme a imagem social `assets/brand/og-image.png` (1200 × 630, já gerada).

### Onde o site é publicado

O domínio `elektrosys.eng.br` é servido pelo **GitHub Pages** a partir da branch
`main` do repositório [`Gusttavhub/calculadora-motores`](https://github.com/Gusttavhub/calculadora-motores)
(o `CNAME` está lá). Esse mesmo repositório hospeda as três calculadoras, um
backend em Cloudflare Worker e workflows de atualização de preços.

O site institucional foi enviado para a branch **`site-institucional`**, que:

- renomeia `index.html` (calculadora de motores) para `motores.html`;
- coloca o site institucional na raiz;
- preserva `solar.html`, `memorial.html`, `backend/`, `.github/` e o `CNAME`;
- unifica `sitemap.xml` e `robots.txt` cobrindo o site e as calculadoras.

**Nada foi mesclado em `main`.** Enquanto a branch não for mesclada, o ar
continua exatamente como está hoje.

#### O que vai ao ar e o que não vai

O GitHub Pages serviria tudo o que está no repositório, então a branch inclui um
`_config.yml`. O que estiver em `exclude` continua versionado, mas **não é
publicado** — diferente do `robots.txt`, que só pediria para não indexar sem
restringir acesso.

Ficam fora do ar: `tools/`, `content/`, `previews/`, `brand/`, `design.md`,
`RELATORIO.md`, `README-SITE.md`, `package.json`, o PNG original do logotipo,
e também `backend/` e `scripts/`, que não fazem parte do site.

Continuam publicados, porque o site e as calculadoras dependem deles em runtime:
`assets/`, `styles.css`, `prices.json`, `robot-status.json`, `og-image.png`,
`CNAME` e `favicon.ico`.

#### Sobre a URL antiga da calculadora

Não há redirecionamento a fazer, e nem seria possível: `/index.html` e `/` são
a mesma página em qualquer hospedagem estática, então esse caminho passa a servir
a home institucional. Ninguém cai em 404 — quem tinha o link antigo chega à home,
que traz "Ferramentas" na navegação e um link direto para `/motores.html`.

Para busca, o `sitemap.xml` já declara `/motores.html`, então o Google reindexa
a calculadora no endereço novo na próxima varredura.

---

## Pendências para validação humana

Registradas em `content/site.config.json` → `pendingValidation`.

| Item | Situação |
| --- | --- |
| **Colisão de URL** | Resolvida na branch `site-institucional`: a calculadora virou `motores.html` e a raiz ficou para o site. Falta mesclar — e conferir se há links externos apontando para `/index.html` que precisem de redirecionamento. |
| `Orçamento sem custo` | Herdado do site atual. Manter só enquanto for verdadeiro. |
| `resposta em até 48 h úteis` | Herdado do site atual. Manter só enquanto for verdadeiro. |
| E-mail institucional | Não fornecido. Não publicado. |
| Endereço / cidade-sede | Não fornecido. O hero cita apenas "Goiás". Não incluído nos dados estruturados. |
| CNPJ | Não fornecido. Não publicado. |
| Logotipo vetorial | Só existe o PNG. Vetorizar profissionalmente antes de registro de marca e de aplicações maiores. |

Nada foi inventado para preencher esses campos: não há e-mail, endereço, CNPJ,
depoimento, cliente, avaliação, certificação ou estatística fictícia no site.

---

## Desvios conscientes de `design.md`

Três pontos em que a especificação entra em conflito consigo mesma. Em todos
prevaleceu a regra de acessibilidade, que `design.md` declara obrigatória
("Atender WCAG 2.2 nível AA") e lista nos critérios de aceite.

| Onde | `design.md` pede | Implementado | Motivo |
| --- | --- | --- | --- |
| Botão primário | fundo `#2C7BE5`, texto branco | fundo `#1F6FD8` | Branco sobre `#2C7BE5` dá 4,14:1, abaixo do mínimo de 4,5:1. `#1F6FD8` dá 4,86:1 e mantém a mesma família de azul. `#2C7BE5` segue como cor de foco, indicador e hover. |
| Borda de botão secundário | `#21425F` | `#486E96` | `#21425F` sobre o fundo institucional dá 1,66:1; componentes de interface exigem 3:1. `#486E96` dá 3,26:1. `#21425F` continua nas bordas decorativas de cards e divisórias. |
| Links em texto sobre fundo escuro | `#2C7BE5` | `#5AA9F0` | 4,20:1 contra 6,92:1. |

Um quarto ponto é geométrico, não de acessibilidade:

| Onde | `design.md` pede | Implementado | Motivo |
| --- | --- | --- | --- |
| Largura do logotipo no cabeçalho | 180 a 230 px no desktop | 152 px | O lockup oficial tem proporção 2,251:1. A 190 px de largura ele teria 84 px de altura, e o mesmo `design.md` limita o cabeçalho a 80 px no desktop. As duas regras não são satisfazíveis juntas sem alterar a proporção da marca, o que é proibido. Prevaleceu o limite de altura. No rodapé, sem essa restrição, o logotipo aparece a 196 px. |

Os três primeiros desvios estão verificados automaticamente: `npm run check`
recalcula todos os contrastes a partir dos tokens do CSS.

---

## Compatibilidade e comportamento

- Testado de **320 px a 1920 px**, sem rolagem horizontal em nenhuma largura.
- Menu móvel com `aria-expanded`, foco preso enquanto aberto, fecha com `Esc` e
  devolve o foco ao botão.
- `prefers-reduced-motion` desliga transições, animações de entrada e a rolagem
  suave.
- Fontes self-hosted em woff2 com `font-display: swap` e `unicode-range`, para
  não depender de CDN e não vazar visitantes para terceiros.
- Ano do rodapé calculado por JavaScript, com valor de fallback no HTML.

---

## Licenças

- **Logotipo ElektroSys** — propriedade da ElektroSys. Não redistribuir.
- **Barlow Semi Condensed, Inter, IBM Plex Mono** — SIL Open Font License 1.1,
  uso comercial e incorporação permitidos.
- Ícones da interface são SVG inline desenhados para este projeto.
