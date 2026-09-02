# Cartão de apresentação ElektroSys — especificação para a gráfica

Documento de referência para produção. Gerado por `tools/build-card.mjs` a partir
dos tokens de `design.md` e dos dados de `content/site.config.json`.

---

## 1. Arquivos entregues

| Arquivo | Uso | Observação |
| --- | --- | --- |
| `business-card-front.pdf` | **Master de impressão — frente** | CMYK, com sangria, TrimBox marcada |
| `business-card-back.pdf` | **Master de impressão — verso** | CMYK, fontes incorporadas, com sangria |
| `business-card-front-rgb.pdf` | Compartilhamento digital — frente | RGB |
| `business-card-back-rgb.pdf` | Compartilhamento digital — verso | RGB |
| `business-card-front.svg` | Arquivo editável — frente | RGB, unidade do `viewBox` = 1 mm |
| `business-card-back.svg` | Arquivo editável — verso | RGB, texto vivo (fontes não convertidas) |
| `business-card-front.png` | Pré-visualização com sangria | 2268 × 1323 px @ 600 dpi |
| `business-card-back.png` | Pré-visualização com sangria | 2268 × 1323 px @ 600 dpi |
| `business-card-front-trimmed.png` | Pré-visualização já aparada | 2126 × 1181 px @ 600 dpi |
| `business-card-back-trimmed.png` | Pré-visualização já aparada | 2126 × 1181 px @ 600 dpi |
| `logo-para-impressao.png` | Logotipo achatado sobre `#F7F9FB` | Sem canal alfa, evita transparência no RIP |

**Envie para a gráfica os dois primeiros arquivos.** Os demais são apoio.

---

## 2. Formato e medidas

| Item | Medida |
| --- | --- |
| Formato final (corte) | **90 × 50 mm** (paisagem) |
| Sangria | **3 mm** em todos os lados |
| Área total do arquivo | **96 × 56 mm** |
| Área segura | **4 mm** para dentro do corte |
| Área segura em coordenadas do arquivo | x de 7 a 89 mm, y de 7 a 49 mm (**82 × 42 mm**) |

Os PDFs trazem `MediaBox` de 96 × 56 mm e `TrimBox` marcando o corte final de
90 × 50 mm. Não redimensionar, não aplicar "ajustar à página" e não adicionar
margem: isso desloca a linha de corte.

Nenhum texto, o QR code ou o logotipo encosta na área de sangria — tudo está
dentro dos 82 × 42 mm seguros, com folga verificada automaticamente pelo gerador.

---

## 3. Cor

Os PDFs de impressão estão em **DeviceCMYK**. A conversão a partir do RGB da
marca foi feita sem perfil ICC, portanto **confira contra prova antes de rodar a
tiragem**. Se o fluxo da gráfica tiver perfil próprio (por exemplo Coated
FOGRA39 ou SWOP), prefira converter a partir dos valores RGB da tabela.

| Uso | RGB | CMYK do arquivo | Tinta total |
| --- | --- | --- | --- |
| Fundo do verso | `#0A1B2E` | C78 M41 Y0 K82 | 201% |
| Fundo da frente | `#F7F9FB` | C2 M1 Y0 K2 | 5% |
| Nome, WhatsApp e placa do QR | `#FFFFFF` | C0 M0 Y0 K0 | 0% |
| Cargo | `#E8F0F8` | C6 M3 Y0 K3 | 12% |
| CREA, serviços e legenda | `#8CA3BC` | C26 M13 Y0 K26 | 65% |
| Chamada de atendimento | `#5AA9F0` | C62 M30 Y0 K6 | 98% |
| Filete divisor | `#21425F` | C65 M31 Y0 K63 | 159% |

Notas:

- A cobertura máxima de tinta é **201%**, bem abaixo do limite usual de 300%.
- O azul-marinho do verso é uma **chapada escura em área grande**. Peça prova
  física: em offset ele pode marmorizar, e em digital pode "quebrar" na dobra do
  corte. Se a gráfica recomendar um preto de reforço, avalie antes de aprovar.
- A frente é quase branca (`#F7F9FB`). Se a gráfica preferir, pode ser impressa
  como **branco do papel**, sem chapada — o resultado visual é equivalente e
  reduz risco de mancha. Confirme antes.

---

## 4. Fontes

O verso usa três famílias, todas **incorporadas no PDF** como subconjuntos:

| Família | Peso | Onde aparece |
| --- | --- | --- |
| Barlow Semi Condensed | 700 | Nome |
| Inter | 500 / 400 | Cargo e lista de serviços |
| IBM Plex Mono | 500 / 400 | Chamada, CREA, WhatsApp e legenda do QR |

O PDF do verso contém 5 subconjuntos `FontFile2` — não é necessário instalar
nada na gráfica.

**Atenção ao SVG:** os arquivos `.svg` têm **texto vivo**, não convertido em
curvas. Eles só renderizam corretamente em máquinas com essas fontes
instaladas. Para produção, use sempre o PDF.

Todas as três famílias são licenciadas em SIL Open Font License 1.1, que permite
uso comercial e incorporação.

---

## 5. QR code

| Item | Valor |
| --- | --- |
| Destino | `https://elektrosys.eng.br` |
| Legenda impressa | `ELEKTROSYS.ENG.BR` — serve como URL legível para quem não escaneia |
| Correção de erro | Nível M (~15%) |
| Matriz | 25 × 25 módulos de dados |
| Quiet zone | 4 módulos em todos os lados (mínimo exigido pela norma) |
| Matriz total | 33 × 33 módulos |
| Área ocupada | 24 × 24 mm |
| Tamanho do módulo | **0,727 mm** |
| Quiet zone em milímetros | **2,91 mm** |
| Cores | Módulos `#0A1B2E` sobre placa `#FFFFFF` |

O QR é **vetorial** — desenhado como retângulos no PDF e no SVG, não como
imagem. Não substituir por um bitmap e não reduzir abaixo de 20 mm: com módulos
menores que 0,6 mm a leitura em papel fosco fica instável.

A placa branca **é** a quiet zone. Não recorte a placa, não a preencha com o
azul do fundo e não coloque nenhum elemento sobre ela.

### Trocar o destino do QR

O destino é configurável em `content/site.config.json` → `card.qrTarget`:
`"site"` (atual) ou `"whatsapp"`. Depois de trocar, rode `npm run brand` e
`npm run brand:png`. A legenda e o teste acompanham a mudança automaticamente.

> ⚠️ **Confirme antes de rodar a tiragem.** O QR aponta para a raiz de
> `elektrosys.eng.br`. Esse endereço só passa a servir o site institucional
> depois que a branch `site-institucional` for mesclada em `main` no
> repositório `Gusttavhub/calculadora-motores`. **Enquanto isso não acontecer,
> quem escanear o cartão cai na calculadora de motores.**
>
> Portanto: **mescle a branch e confirme que `elektrosys.eng.br` abre o site
> institucional antes de mandar imprimir.** Se preferir imprimir antes, troque
> `card.qrTarget` para `"whatsapp"` e regere o cartão.

### Verificação já executada

`node tools/test-qr.mjs` decodifica o código a partir do SVG entregue e confere
o destino. O teste passou em 10 cenários: código enquadrado a 1200, 600, 300,
150 e 96 dpi, e cartão inteiro no quadro a 600, 300, 200, 150 e 96 dpi. Em todos
o conteúdo lido foi exatamente `https://elektrosys.eng.br`.

**Ainda assim, teste o código na prova impressa** antes de liberar a tiragem —
papel, verniz e laminação afetam a leitura. Verniz brilho ou laminação brilhante
sobre o QR pode gerar reflexo e atrapalhar a câmera.

---

## 6. Logotipo

- Arquivo aplicado: `logo-para-impressao.png`, gerado a partir do logotipo
  oficial recebido.
- Tamanho no cartão: **40 × 17,77 mm**, centralizado na frente.
- Resolução efetiva: **342 dpi** no tamanho final.
- Proporção original preservada (2,251:1). Não foi redesenhado, recolorido,
  inclinado nem esticado.
- Cores da marca no arquivo: `#025797` (símbolo e wordmark) e `#0C243F`
  (descritor e filete).

> **Pendência conhecida.** O logotipo oficial só foi fornecido em bitmap (PNG).
> A 342 dpi ele imprime bem no tamanho atual, mas **para registro de marca e
> para qualquer aplicação maior é necessário vetorizá-lo profissionalmente**.
> Não gere esse vetor por autotraço: encomende a vetorização e revalide o cartão
> depois. Enquanto isso, não amplie o logotipo além de 40 mm de largura.

---

## 7. Acabamento sugerido

Nada aqui é obrigatório — são recomendações compatíveis com a identidade.

- **Papel:** couché fosco 300 a 350 g/m².
- **Laminação:** fosca nos dois lados. Valoriza o azul-marinho e evita reflexo
  sobre o QR code. Evitar laminação brilhante.
- **Impressão:** frente e verso (4/4).
- **Corte:** reto. Cantos arredondados descaracterizam a leitura sóbria da marca.
- **Não recomendado:** verniz localizado sobre o QR, relevo americano, hot
  stamping ou corte especial. A identidade é técnica e minimalista.

---

## 8. Checklist antes de aprovar a prova

- [ ] Corte final mede 90 × 50 mm.
- [ ] Nenhum texto ficou a menos de 4 mm da borda cortada.
- [ ] O logotipo está nítido, sem serrilhado visível e sem halo ao redor.
- [ ] A proporção do logotipo não foi alterada.
- [ ] O azul-marinho do verso está uniforme, sem manchas.
- [ ] O QR code foi lido pela câmera de pelo menos dois celulares diferentes.
- [ ] O QR abriu `elektrosys.eng.br` **com o site institucional novo**, não a calculadora.
- [ ] O celular `+55 64 98439-5286` está correto e legível.
- [ ] Nome, cargo e `CREA 1023983184D-GO` estão corretos e legíveis.
- [ ] As três linhas de serviços estão completas, sem corte de acentuação.

---

## 9. Regerar os arquivos

Se algum dado mudar, edite `content/site.config.json` na raiz do projeto e rode:

```bash
npm run brand
```

Isso reconstrói SVG e PDF, revalida a área segura e roda o teste do QR code. As
pré-visualizações PNG são geradas separadamente com `npm run brand:png`, que
abre uma página local de rasterização no navegador.
