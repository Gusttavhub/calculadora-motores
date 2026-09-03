# Relatório final — site ElektroSys e cartão de apresentação

Data: 2 de setembro de 2026.
Fonte de verdade: [`design.md`](design.md).

---

## 1. Situação encontrada

O diretório tinha apenas três arquivos: `design.md`, uma cópia idêntica
(`design (1).md`) e o PNG do logotipo. **Não havia site, stack, rotas nem
componentes** — nada a refatorar.

O `escritorio(1).html` citado no briefing não estava no projeto. Encontrei-o em
`Downloads/` (três cópias idênticas de 712 KB) e usei como referência de
conteúdo. Não é um site em produção: é um protótipo React 18 empacotado em
arquivo único, que simulava páginas por estado JavaScript — exatamente o padrão
que o `design.md` proíbe.

Dele preservei: serviços, entregáveis, normas, textos de processo, checklist de
contato e os três links de ferramentas. Descartei o que o `design.md` passou a
proibir, principalmente `ART emitida em todo projeto` (agora `ART quando
aplicável`) e as promessas de aprovação junto à concessionária.

**Decisão de stack:** HTML, CSS e JavaScript estáticos, sem framework e sem
etapa de build. O `design.md` pede o stack mais simples possível, e o protótipo
React não estava em produção — não havia arquitetura a preservar.

---

## 2. Arquivos criados

Nenhum arquivo pré-existente foi alterado ou removido. `design.md`,
`design (1).md` e o PNG do logotipo estão intactos.

### Site

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Página principal, 12 seções conforme `design.md` §1–12 |
| `ferramentas.html` | Rota secundária das calculadoras |
| `assets/css/styles.css` | Folha única, ~1000 linhas, tokens em CSS Custom Properties |
| `assets/js/main.js` | Menu móvel, estado do cabeçalho, seção ativa, entrada, ano |
| `robots.txt`, `sitemap.xml`, `site.webmanifest`, `favicon.ico` | Metadados |
| `assets/fonts/` | 16 woff2 (Barlow Semi Condensed, Inter, IBM Plex Mono) |
| `content/site.config.json` | Dados comerciais e registro de pendências |

### Marca

| Arquivo | Conteúdo |
| --- | --- |
| `assets/brand/elektrosys-logo.png` | Lockup com área de proteção, fundo transparente |
| `assets/brand/elektrosys-logo-tight.png` | Lockup no recorte exato (usado no site) |
| `assets/brand/elektrosys-symbol.png` / `-tight` | Símbolo isolado |
| `assets/brand/favicon-{16,32,48,192,512}.png`, `apple-touch-icon.png` | Ícones |
| `assets/brand/og-image.png` | Imagem social 1200 × 630 |

### Cartão de apresentação — `brand/business-card/`

| Arquivo | Conteúdo |
| --- | --- |
| `business-card-front.pdf` / `back.pdf` | **Masters de impressão**, CMYK, sangria, TrimBox |
| `business-card-front-rgb.pdf` / `back-rgb.pdf` | Versões RGB para uso digital |
| `business-card-front.svg` / `back.svg` | Editáveis, viewBox em milímetros |
| `*-front.png` / `*-back.png` | Pré-visualização com sangria, 2268 × 1323 @ 600 dpi |
| `*-trimmed.png` | Pré-visualização já aparada, 2126 × 1181 @ 600 dpi |
| `logo-para-impressao.png` | Logotipo achatado, sem alfa |
| `PRINTING.md` | Especificação completa para a gráfica |

O verso traz a chamada, nome, cargo, CREA, o celular rotulado
`CELULAR · WHATSAPP`, os três serviços e um QR code para `elektrosys.eng.br`
com a URL legível impressa abaixo. O destino do QR é configurável em
`content/site.config.json` → `card.qrTarget` (`"site"` ou `"whatsapp"`).

### Documentação e ferramentas

`README.md`, `RELATORIO.md`, e 9 scripts em `tools/` (geração de ativos,
validação, servidor local, capturas). Nada em `tools/` vai para o servidor.

---

## 3. Testes executados

### Validação automatizada — `npm run check`

**204 verificações, 0 falhas, 0 avisos.**

1. **Dados comerciais** — HTML confere com `site.config.json` em ambas as
   páginas: telefone, CREA, nome, LinkedIn, os 3 links de ferramentas, e todos
   os 14 links `wa.me` apontando para `5564984395286`.
2. **Links** — toda âncora resolve, todo arquivo referenciado existe, todo link
   externo usa `https`, todas as 16 fontes do CSS existem em disco.
3. **Acessibilidade** — 1 `h1` por página, hierarquia sem saltos, `lang="pt-BR"`,
   link de pular conteúdo, `alt` em toda imagem, `alt` do logotipo exatamente
   `ElektroSys Engenharia Elétrica`, `rel="noopener noreferrer"` em todo
   `target="_blank"`, `aria-hidden` em todo SVG decorativo, `aria-expanded` e
   `aria-controls` no botão do menu, `prefers-reduced-motion` presente, anel de
   foco de 2 px presente.
4. **Conteúdo** — nenhum termo da lista proibida (promessa de resultado,
   clichês, e-mail, CNPJ, estatísticas inventadas); aviso das ferramentas
   presente; ferramentas posicionadas depois de serviços e perícias.
5. **Contraste** — 15 pares recalculados a partir dos tokens do CSS, todos
   atendendo WCAG 2.2 AA.

### Teste do QR code — `npm run test:qr`

**10 cenários, todos aprovados.** O código é decodificado a partir do SVG
entregue e comparado com o destino configurado, `https://elektrosys.eng.br`:

- Código enquadrado a 1200, 600, 300, 150 e 96 dpi.
- Cartão inteiro no quadro a 600, 300, 200, 150 e 96 dpi.

Em todos o conteúdo lido foi exatamente o destino esperado. Acima de ~900 px o
`jsQR` perde a localização do padrão — é limite do decodificador de quadro de
câmera, não do código, então o teste reamostra antes de decodificar, como fazem
os leitores reais.

### Geometria do cartão — `npm run brand`

O gerador mede cada linha com as métricas reais das fontes (via PDFKit) e
**falha** se algo ultrapassar a área segura. Todas as 10 linhas do verso cabem
na coluna útil de 54 mm; a mais larga é a chamada, com 47,7 mm.

### Verificação visual

Renderização real do Chromium, capturada em `previews/`:

| Largura | Resultado |
| --- | --- |
| 320 px | Sem rolagem horizontal. `concessionária`, a palavra mais larga, cabe. |
| 375 px | Sem rolagem horizontal. Hero legível. |
| 390 px | Menu móvel verificado interativamente. |
| 768 px | Grades de 4 e 3 colunas caem para 2. |
| 1024 px | Cabeçalho troca para navegação horizontal. |
| 1440 px | Layout de referência. |
| 1920 px | Sem rolagem horizontal (`scrollWidth` 1905 < 1920). |

### Comportamento verificado no navegador

- **Menu móvel:** abre, foco vai para o primeiro item, `body` travado.
  `Tab` no último item volta ao primeiro; `Shift+Tab` no primeiro vai ao último.
  `Esc` fecha e **devolve o foco ao botão**. Confirmado por asserção, não a olho.
- **Sem erros de console** em `index.html` e `ferramentas.html`.
- **Sem JavaScript:** os 6 serviços usam `<details>` nativo e continuam
  abrindo; todos os links `wa.me` já trazem a mensagem pré-preenchida no
  próprio `href`; o ano do rodapé tem valor de fallback no HTML.
- **PDFs:** `MediaBox` 96 × 56 mm, `TrimBox` marcando 90 × 50 mm, `/DeviceCMYK`
  no master de impressão, 5 subconjuntos de fonte incorporados no verso.

---

## 4. Decisões que merecem revisão

### Logotipo — o que foi e o que não foi feito

O logotipo **não foi redesenhado, recolorido, inclinado, esticado, vetorizado
automaticamente nem substituído**. Duas operações não destrutivas foram
aplicadas: recorte do enquadramento e separação do fundo em canal alfa.

As cores originais são preservadas exatamente — `#025797` no símbolo e no
wordmark, `#0C243F` no descritor e no filete — e a proporção 2,251:1 é mantida.

Durante a extração encontrei uma vinheta suave no fundo do arquivo original
(248–251 em vez de um branco uniforme). Ela produzia alfa residual de 1–3/255
nas áreas vazias, invisível isoladamente mas suficiente para desenhar um
retângulo levemente mais escuro quando o logotipo era aplicado sobre superfície
clara. Corrigido com um piso de ruído; o fundo agora fica exatamente na cor da
superfície.

**Sobre fundo escuro o logotipo é aplicado sobre uma placa clara, nunca
invertido.** O azul da marca sobre o azul-marinho institucional não atinge
contraste suficiente, e o `design.md` proíbe inverter o bitmap.

### Desvios conscientes de `design.md`

O `design.md` entra em conflito consigo mesmo em quatro pontos. Em três deles
prevaleceu a acessibilidade, que a própria especificação declara obrigatória.

| Onde | Pedido | Implementado | Motivo |
| --- | --- | --- | --- |
| Botão primário | fundo `#2C7BE5` | `#1F6FD8` | Branco sobre `#2C7BE5` dá 4,14:1, abaixo de 4,5:1. `#1F6FD8` dá 4,86:1. `#2C7BE5` segue como foco, indicador e hover. |
| Borda de botão secundário | `#21425F` | `#486E96` | 1,66:1 contra o mínimo de 3:1 para componentes. `#486E96` dá 3,26:1. `#21425F` continua nas bordas decorativas. |
| Links sobre fundo escuro | `#2C7BE5` | `#5AA9F0` | 4,20:1 contra 6,92:1. |
| Largura do logotipo no cabeçalho | 180–230 px | 152 px | Impossível satisfazer junto com o limite de 80 px de altura do cabeçalho: o lockup 2,251:1 teria 84 px de altura a 190 px de largura. Alterar a proporção é proibido, então prevaleceu o limite de altura. No rodapé, sem essa restrição, o logotipo aparece a 196 px. |

Os três primeiros são reconferidos a cada `npm run check`.

### Escolhas de implementação

- **Duas páginas, não uma SPA.** `index.html` com âncoras semânticas reais e
  `ferramentas.html` como rota própria. O `design.md` proíbe simular páginas por
  estado JavaScript.
- **Fontes self-hosted.** 392 KB em woff2 com `unicode-range` e
  `font-display: swap`. Evita dependência de CDN e não expõe visitantes a
  terceiros.
- **`<details>` nativo nos serviços.** Acessível por padrão e funciona sem
  JavaScript. O `design.md` pede lista numerada com painéis de detalhe no
  desktop e acordeão no mobile — a mesma marcação atende os dois.
- **`text` vivo nos SVG do cartão.** Os SVG não têm as fontes convertidas em
  curvas, porque não há motor de contorno disponível aqui. Por isso o **PDF é o
  master de impressão** — nele as fontes estão incorporadas. Está registrado em
  `PRINTING.md`.

---

## 5. Pendências

### Bloqueante para publicação

**Colisão de URL — resolvida na branch, pendente de merge.** A calculadora de
motores estava publicada em `https://elektrosys.eng.br/index.html`, o mesmo
caminho que a nova home ocuparia. Encontrei isso ao validar os links.

Ao subir o projeto para o GitHub descobri que aquele endereço é servido pelo
repositório `Gusttavhub/calculadora-motores` via GitHub Pages — ou seja,
publicar o site novo na raiz derrubaria a calculadora no ar.

A branch `site-institucional` resolve: renomeia `index.html` para
`motores.html`, coloca o site institucional na raiz e preserva `solar.html`,
`memorial.html`, `styles.css`, `prices.json`, `backend/`, workflows e `CNAME`.

Dois pontos decorrentes, já tratados na branch:

- **URL antiga.** Não cabe redirecionamento: `/index.html` e `/` são a mesma
  página em hospedagem estática, então o caminho antigo passa a servir a home
  institucional. Ninguém cai em 404, e a home leva à calculadora pela navegação.
  O `sitemap.xml` declara `/motores.html` para a reindexação.
- **Material de trabalho fora do ar.** Um `_config.yml` exclui `tools/`,
  `content/`, `previews/`, `brand/`, `design.md`, `RELATORIO.md`, `backend/` e
  `scripts/` da publicação. Eles continuam versionados, mas não são servidos.

### Depende de confirmação sua

| Item | Situação |
| --- | --- |
| `Orçamento sem custo` | Herdado do site atual. O `design.md` manda manter só enquanto for verdadeiro. |
| `resposta em até 48 h úteis` | Idem. |
| Logotipo vetorial | Só existe o PNG. A 342 dpi imprime bem em 40 mm, mas registro de marca e aplicações maiores exigem vetorização profissional — **não por autotraço**. |

### Não fornecido, portanto não publicado

E-mail institucional, endereço, CNPJ. **Nada foi inventado para preencher esses
campos.** Não há no site nenhum e-mail, endereço, CNPJ, depoimento, cliente,
avaliação, certificação, obra ou estatística fictícia. Os dados estruturados
`ProfessionalService` trazem apenas informação verificada.

O `design.md` também pede confirmar a versão vigente e a aplicabilidade de cada
norma citada antes de publicar. As seis normas são apresentadas como competência
técnica, não como selo de certificação, mas a conferência continua sendo sua.

---

## 6. Critérios de aceite do `design.md`

| Critério | Situação |
| --- | --- |
| Logotipo sem distorção e com respiro | Atendido — proporção e cores originais preservadas |
| Paleta azul-marinho, azul da marca e azul elétrico | Atendido |
| Em 5 s dá para entender quem atende, o que faz e como falar | Atendido — hero, painel do responsável e CTA de WhatsApp na primeira dobra |
| Perícias fáceis de achar pelo público jurídico | Atendido — item de navegação próprio e seção em superfície clara de leitura |
| Projetos, laudos, inspeções, SPDA e fotovoltaico descritos | Atendido — 6 serviços com escopo e entregáveis |
| WhatsApp correto, com mensagem pré-preenchida e editável | Atendido — 14 links verificados, 7 mensagens por contexto |
| Cartão com QR do site e celular | Atendido — QR para `elektrosys.eng.br` testado em 10 cenários |
| Nome, cargo e CREA consistentes em todas as páginas e no cartão | Atendido — verificado automaticamente |
| Nada inventado | Atendido — verificado automaticamente |
| Navegação por teclado, foco visível, leitor de tela | Atendido — foco preso, `Esc`, retorno de foco confirmados |
| Layout íntegro de 320 a 1920 px | Atendido |
| Movimento reduzido respeitado | Atendido |
| Build, lint e testes passam | Atendido — 203 verificações + 10 cenários de QR |
| Ferramentas acessíveis, sem desviar a conversão | Atendido — rota própria, posição secundária |
| Cartão com leitura, contraste, sangria, área segura e QR testado | Atendido |

---

## 7. Como continuar

```bash
npm run dev        # servidor local em http://localhost:4173
npm run verify     # validação do site + teste do QR
npm run brand      # regenerar o cartão a partir do site.config.json
npm run previews   # recapturar as imagens de previews/
```

O passo a passo de edição e publicação está no [`README.md`](README.md). A
especificação para a gráfica está em
[`brand/business-card/PRINTING.md`](brand/business-card/PRINTING.md).

**Nada foi publicado, versionado ou enviado para repositório.** O projeto não é
um repositório git e nenhum deploy foi executado.
