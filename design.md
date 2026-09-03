---
name: ElektroSys
version: "1.0"
language: pt-BR
description: "Sistema visual e especificação de experiência para a ElektroSys Engenharia Elétrica."

brand:
  company: "ElektroSys"
  descriptor: "Engenharia Elétrica"
  professional: "Gusttavo Gutierry"
  role: "Engenheiro Eletricista"
  crea: "1023983184D-GO"
  personality:
    - técnica
    - precisa
    - confiável
    - direta
    - minimalista
    - institucional

colors:
  primary: "#0A1B2E"
  secondary: "#075B91"
  tertiary: "#2C7BE5"
  neutral: "#F7F9FB"
  surface: "#0E2841"
  surfaceElevated: "#133150"
  textPrimary: "#E8F0F8"
  textSecondary: "#8CA3BC"
  border: "#21425F"
  white: "#FFFFFF"
  whatsapp: "#25D366"
  success: "#2FB39A"
  warning: "#E7A740"
  danger: "#E4694F"

typography:
  h1:
    fontFamily: "Barlow Semi Condensed"
    fontSize: "clamp(3rem, 7vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  h2:
    fontFamily: "Barlow Semi Condensed"
    fontSize: "clamp(2.25rem, 4vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.04
  h3:
    fontFamily: "Barlow Semi Condensed"
    fontSize: "clamp(1.5rem, 2.5vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.15
  body-lg:
    fontFamily: "Inter"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.7
  body-md:
    fontFamily: "Inter"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  body-sm:
    fontFamily: "Inter"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label-caps:
    fontFamily: "IBM Plex Mono"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.16em"
    textTransform: "uppercase"

rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "999px"

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  4xl: "96px"

layout:
  maxWidth: "1320px"
  readingWidth: "720px"
  desktopGutter: "40px"
  mobileGutter: "20px"
  gridColumns: 12

shadows:
  sm: "0 8px 24px rgba(0, 0, 0, 0.16)"
  md: "0 20px 60px rgba(0, 0, 0, 0.22)"

motion:
  fast: "150ms"
  normal: "220ms"
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"

breakpoints:
  sm: "640px"
  md: "768px"
  lg: "1024px"
  xl: "1280px"
---

# ElektroSys — direção de design e implementação

## Overview

Minimalismo técnico com autoridade institucional. A experiência deve transmitir a precisão de um memorial de cálculo, a robustez de uma instalação industrial e a clareza de um laudo que pode ser auditado.

O resultado deve parecer uma empresa de engenharia especializada — nunca uma empresa genérica de manutenção, uma loja de materiais elétricos ou um site jurídico. A composição é sóbria, escura e precisa, com o azul do logotipo conduzindo hierarquia, navegação e chamadas para ação.

Esta especificação orienta o Claude Code na criação ou refatoração do site da ElektroSys e nas aplicações da mesma identidade em cartão de apresentação. Antes de implementar, inspecionar a estrutura e o stack existentes. Reaproveitar componentes e conteúdo válidos; não trocar framework nem adicionar dependências sem necessidade.

## Objetivos

1. Gerar confiança imediata em escritórios de engenharia, indústrias, empresas e consultórios/escritórios de advocacia.
2. Apresentar Gusttavo Gutierry como o engenheiro que atende, analisa, calcula e assume a responsabilidade técnica quando aplicável.
3. Tornar perícias judiciais e assistência técnica fáceis de identificar para o público jurídico.
4. Explicar projetos, laudos, inspeções, SPDA e sistemas fotovoltaicos sem jargão desnecessário.
5. Converter visitas qualificadas em conversas pelo WhatsApp.
6. Preservar as calculadoras e ferramentas técnicas como prova de conhecimento, sem permitir que elas desviem a página principal da conversão.
7. Manter uma identidade coerente entre site, logotipo, cartão de apresentação e futuras peças institucionais.

## Públicos prioritários

### Escritórios e consultórios de advocacia

Precisam identificar rapidamente serviços de perícia judicial e assistência técnica, clareza documental, rastreabilidade do raciocínio técnico, disponibilidade para análise de documentos e produção de pareceres/laudos. A comunicação deve ser técnica e compreensível, sem prometer resultados processuais e sem prestar aconselhamento jurídico.

### Escritórios de engenharia, construtoras e projetistas

Buscam apoio especializado, compatibilização, projetos de baixa e média tensão, SPDA, memoriais, inspeções e laudos. A interface deve demonstrar rigor normativo e capacidade de execução.

### Indústrias, comércios e proprietários de instalações

Precisam de segurança, continuidade operacional, aprovação, documentação e contato direto com o responsável técnico. Destacar a vivência industrial e a preocupação com operação real, não apenas aprovação documental.

## Identidade visual

### Logotipo oficial

- Usar exatamente o logotipo escolhido: símbolo hexagonal aberto com raio azul, wordmark “ElektroSys” e assinatura “ENGENHARIA ELÉTRICA”.
- Arquivo-fonte recebido: `855058ec-ab39-4ab7-b3da-bff39cc7e410.png`.
- No projeto web, normalizar os ativos como `/public/brand/elektrosys-logo.png` e, se houver versão isolada legítima, `/public/brand/elektrosys-symbol.png`.
- Não redesenhar, reinterpretar, inclinar, esticar, aplicar gradiente, sombra, contorno ou efeitos 3D.
- Não alterar a proporção entre símbolo, nome e descritor.
- Não recriar o wordmark com uma fonte aproximada.
- Não gerar um novo logotipo por IA. Se o ativo não estiver disponível, solicitar o arquivo em vez de inventá-lo.
- Manter área de proteção mínima equivalente à largura do traço principal do raio em todos os lados.
- Sobre fundo escuro, usar somente uma versão branca/azul oficialmente preparada. Não inverter automaticamente uma imagem raster se isso comprometer a marca.
- Para registro de marca e gráfica, o logotipo deverá ser vetorizado profissionalmente e validado separadamente; o site não deve apresentar uma versão improvisada como arquivo-mestre.

### Paleta

- `#0A1B2E` é a base institucional: cabeçalho, hero, rodapé e áreas de alta autoridade.
- `#075B91` é o azul original do logotipo e deve preservar reconhecimento da marca.
- `#2C7BE5` é o azul elétrico para links, foco, indicadores e CTAs secundários.
- `#F7F9FB` é a superfície clara de documentos, explicações e áreas que pedem leitura longa.
- `#0E2841` e `#133150` criam profundidade discreta em superfícies escuras.
- `#25D366` é reservado ao botão oficial do WhatsApp. Não usar como cor geral da marca.
- `#2FB39A`, `#E7A740` e `#E4694F` são cores semânticas de status, gráficos, alertas ou validação. Não competir com o azul principal.
- Evitar preto puro e branco puro em grandes áreas. Usar contraste alto sem aparência agressiva.
- Gradientes só são permitidos como iluminação de fundo muito sutil, com opacidade baixa. Nunca aplicar gradiente no logotipo ou nos botões principais.

### Tipografia

- `Barlow Semi Condensed`: títulos técnicos, números e chamadas. Deve produzir presença com largura controlada.
- `Inter`: texto corrido, navegação, botões e formulários.
- `IBM Plex Mono`: normas, CREA, fórmulas, metadados, pequenos rótulos e numeração de etapas.
- Carregar somente pesos efetivamente utilizados: Barlow 600/700, Inter 400/500/600/700 e IBM Plex Mono 400/500.
- Em falha de carregamento usar: `Arial Narrow, Arial, sans-serif` para títulos; `system-ui, sans-serif` para corpo; `ui-monospace, monospace` para rótulos.
- Não escrever parágrafos inteiros em caixa alta ou fonte monoespaçada.

### Forma, grid e superfícies

- Construir a página sobre grid de 8 px, largura máxima de 1320 px e alinhamentos rigorosos.
- Usar linhas finas, divisórias, números de seção e acentos verticais para evocar desenho técnico e documentação.
- Raios de borda discretos, entre 2 e 8 px. Evitar cartões excessivamente arredondados e “pill UI”.
- Cartões devem parecer módulos de um painel técnico: borda definida, pouco relevo e hierarquia por tipografia/espaço.
- Reservar sombras apenas para menus móveis, diálogos e elementos realmente elevados.
- Ícones devem ser lineares, simples, com espessura consistente. Evitar raios decorativos repetidos em toda a interface.
- Preferir diagramas, linhas técnicas, detalhes de plantas e texturas geométricas sutis a fotografias genéricas de eletricistas.
- Não usar martelo de juiz, balança da justiça, aperto de mãos, capacete solto, lâmpada ou banco de imagens corporativo como atalho visual.

## Princípios de experiência

### Direto com o engenheiro

A maior vantagem percebida é o contato sem intermediários. Reforçar isso no hero, na seção de diferenciais e no CTA final. Não fingir estrutura de equipe ampla se o atendimento é pessoal.

### Evidência antes de promessa

Dar prioridade a escopo, processo, normas, entregáveis e credenciais. Evitar superlativos, frases vazias, contadores animados e promessas absolutas.

### Uma ação principal por seção

O WhatsApp é a conversão primária. CTAs secundários podem navegar para serviços, perícias ou checklist de orçamento. Não oferecer quatro botões equivalentes no mesmo bloco.

### Clareza para dois repertórios

O conteúdo deve ser tecnicamente correto para engenheiros e compreensível para advogados ou gestores. Quando usar um termo técnico, explicar sua consequência prática.

## Tom de voz e redação

- Português do Brasil, formal sem burocratês, objetivo e humano.
- Escrever na primeira pessoa quando Gusttavo estiver assumindo atendimento ou responsabilidade: “Você fala comigo”, “Analiso o material”, “Devolvo escopo, prazo e preço”.
- Escrever na voz da marca para capacidades institucionais: “A ElektroSys atua em…”.
- Usar verbos concretos: analisar, dimensionar, inspecionar, documentar, calcular, compatibilizar e entregar.
- Evitar “soluções inovadoras”, “excelência”, “líder”, “revolucionário”, “garantia de resultado” e clichês semelhantes.
- Não prometer aprovação por concessionária, ganho de processo, economia fixa ou prazo sem validar o caso.
- Diferenciar claramente estimativa, projeto, laudo, parecer e responsabilidade técnica.
- Usar “ART quando aplicável”; não sugerir que todo serviço inclui ART automaticamente.

## Dados autorizados

| Campo | Conteúdo |
| --- | --- |
| Marca | ElektroSys |
| Descritor | Engenharia Elétrica |
| Responsável | Gusttavo Gutierry |
| Cargo | Engenheiro Eletricista |
| CREA | 1023983184D-GO |
| Experiência | Mais de 6 anos em ambiente industrial |
| WhatsApp | +55 64 98439-5286 |
| Link WhatsApp | `https://wa.me/5564984395286` |
| LinkedIn | `https://www.linkedin.com/in/gusttavo-gutierry-ferreira-moraes-bb71841a4/` |
| Atendimento | Presencial e remoto |
| Horário informado | Segunda a sexta, das 8h às 18h |

Não inventar e-mail, endereço, CNPJ, clientes, avaliações, depoimentos, certificações, obras, quantidade de projetos, índices de aprovação ou qualquer dado não fornecido. Se um dado ausente for indispensável, criar uma configuração claramente identificada como pendente, nunca publicar texto fictício.

## Arquitetura da informação

### Navegação principal

1. Início
2. Serviços
3. Perícias
4. Sobre
5. Contato

“Ferramentas” é item secundário e pode aparecer após os itens comerciais ou em rota própria. No mobile, o botão “Falar no WhatsApp” deve permanecer visível no menu, sem cobrir o conteúdo.

Preferir URLs reais e indexáveis. Em uma landing page, usar âncoras semânticas (`#servicos`, `#pericias`, `#sobre`, `#contato`). Se houver múltiplas páginas, usar rotas reais. Não simular páginas trocando conteúdo apenas por estado JavaScript, pois isso prejudica navegação, compartilhamento e SEO.

## Especificação da página principal

### 1. Cabeçalho

- Fundo `#0A1B2E`, compacto e estável.
- Logotipo à esquerda com largura aproximada entre 180 e 230 px no desktop.
- Navegação clara ao centro/direita.
- CTA “Falar no WhatsApp” no canto direito.
- Estado ativo indicado por linha azul fina, não por cápsula preenchida.
- Cabeçalho sticky é permitido após o usuário iniciar a rolagem; não ocupar mais de 80 px no desktop ou 64 px no mobile.

### 2. Hero

Rótulo: `ENGENHARIA ELÉTRICA · GOIÁS`

Título principal aprovado:

> Projeto elétrico que passa na concessionária e aguenta a obra.

Texto de apoio:

> Baixa e média tensão, SPDA, fotovoltaico, laudos e perícias judiciais — do memorial de cálculo à ART assinada. Mais de 6 anos em ambiente industrial e você falando direto com o engenheiro responsável.

CTA primário: `Solicitar orçamento`

CTA secundário: `Conhecer os serviços`

Incluir identificação discreta: `Eng. Gusttavo Gutierry · CREA 1023983184D-GO`.

O hero deve ser majoritariamente tipográfico. Pode conter composição abstrata baseada em grid, linhas de circuito ou detalhe técnico, mas nunca um novo símbolo concorrente com o logotipo. Evitar carrossel, vídeo automático e ilustração genérica.

### 3. Faixa de confiança

Apresentar quatro sinais verificáveis, sem contadores inflados:

- Contato direto com o engenheiro responsável.
- Mais de 6 anos de vivência industrial.
- Projetos e documentos com referências técnicas auditáveis.
- Escopo transparente: se não for competência da ElektroSys, isso será informado.

### 4. Serviços

Usar uma grade de módulos com resumo, entregáveis e CTA contextual. Serviços principais:

1. **Projetos elétricos de baixa e média tensão** — dimensionamento, memorial de cálculo, diagramas e documentação para execução/aprovação conforme escopo.
2. **Laudos e inspeções elétricas** — avaliação técnica, registro de não conformidades, evidências e recomendações.
3. **Perícias judiciais e assistência técnica** — análise documental, quesitos técnicos, vistoria, parecer/laudo e suporte técnico ao caso, sem aconselhamento jurídico.
4. **SPDA** — avaliação e projeto de proteção contra descargas atmosféricas conforme condições e normas aplicáveis.
5. **Sistemas fotovoltaicos** — dimensionamento, documentação e análise técnica da geração distribuída.
6. **Consultoria técnica** — apoio em instalações, cargas, proteção, adequações e decisões de engenharia dentro das atribuições profissionais.

Não transformar cada serviço em um card visualmente idêntico com textos longos. No desktop, alternar uma lista técnica numerada com painéis de detalhes. No mobile, usar acordeões acessíveis ou blocos empilhados.

### 5. Bloco dedicado a escritórios de advocacia

Título sugerido:

> Engenharia que transforma evidência técnica em informação clara para o processo.

Subtítulo:

> Atuação como perito e assistente técnico em demandas que envolvam instalações, acidentes, consumo, qualidade de energia, equipamentos e conformidade elétrica, sempre dentro do escopo e das atribuições profissionais.

Mostrar o fluxo:

1. Recebimento e triagem dos documentos.
2. Definição do objeto técnico e dos pontos a esclarecer.
3. Análise, vistoria e cálculos quando necessários.
4. Entrega de parecer ou laudo claro, rastreável e fundamentado.
5. Esclarecimentos técnicos dentro do escopo contratado.

CTA: `Falar sobre um caso`

Não usar linguagem que sugira favorecimento de parte, conclusão predeterminada ou garantia de resultado judicial.

### 6. Processo de contratação

Apresentar em quatro etapas, com números monoespaçados:

1. **Contexto e documentos** — cliente envia objetivo, local, plantas, fotos, contas, cargas ou peças disponíveis.
2. **Escopo e proposta** — devolução de escopo, prazo, preço, premissas e itens não incluídos.
3. **Análise técnica** — cálculos, vistoria, compatibilização e produção documental conforme o serviço.
4. **Entrega e suporte** — arquivos organizados, explicação das conclusões e ART quando aplicável.

### 7. Sobre o responsável técnico

Título sugerido: `Quem calcula é quem atende.`

Pontos de mensagem:

- Gusttavo Gutierry, Engenheiro Eletricista, CREA 1023983184D-GO.
- Mais de 6 anos de experiência em ambiente industrial.
- Vivência com motores, CCM, partidas, proteção, manutenção e operação.
- Decisões técnicas documentadas e referenciadas.
- Comunicação direta, sem terceirização invisível do cálculo.

Se houver fotografia profissional real, usar retrato sóbrio em ambiente neutro ou técnico. Se não houver, manter a seção tipográfica; não gerar um rosto fictício.

### 8. Normas e referências

Exibir como informação de competência, não como selos de certificação. Referências atuais do conteúdo existente:

- ABNT NBR 5410
- ABNT NBR 14039
- ABNT NBR 5419
- NR-10
- ABNT NBR IEC 60947
- Resolução Normativa ANEEL nº 1.059

As versões e a aplicabilidade devem ser confirmadas no conteúdo técnico antes de publicar. Não afirmar conformidade apenas por listar uma norma.

### 9. Ferramentas gratuitas

Manter como rota ou seção secundária, com aviso de caráter educacional e de pré-dimensionamento:

- Motores trifásicos: `https://elektrosys.eng.br/index.html`
- Sistema solar: `https://elektrosys.eng.br/solar.html`
- Memorial de cálculo: `https://elektrosys.eng.br/memorial.html`

Aviso obrigatório:

> As ferramentas têm finalidade educacional e de estimativa. Toda instalação deve ser validada por profissional habilitado e por projeto compatível com as normas aplicáveis.

### 10. Contato e checklist

Título aprovado:

> Manda o que você tem. Devolvo escopo, prazo e preço.

Checklist recomendado:

- Tipo de instalação ou natureza do caso.
- Planta, croqui, peças ou documentos disponíveis.
- Conta de energia recente, quando pertinente.
- Lista de cargas/equipamentos ou fotos de placas.
- Prazo, finalidade e local do serviço.

CTA principal deve abrir o WhatsApp para `5564984395286` com mensagem pré-preenchida e editável:

> Olá, Gusttavo. Gostaria de solicitar uma análise inicial para [serviço].

Exibir `Orçamento sem custo` e `resposta em até 48 h úteis` somente se essas condições continuarem verdadeiras operacionalmente. Caso contrário, remover sem substituir por promessa inventada.

### 11. CTA final

Título:

> Precisa de projeto, laudo, perícia ou ART?

Texto:

> Fale direto com o engenheiro responsável. Envie o que você já tem para receber uma avaliação inicial do escopo.

Botão: `Conversar pelo WhatsApp`

### 12. Rodapé

- Logotipo ou wordmark oficial.
- Resumo: `Projetos, laudos, inspeções, SPDA, fotovoltaico, perícias judiciais e assistência técnica.`
- `Eng. Gusttavo Gutierry · CREA 1023983184D-GO`.
- WhatsApp e LinkedIn.
- Links de navegação e ferramentas.
- Avisos legais e política de privacidade apenas se existirem conteúdos reais.
- Ano deve ser calculado dinamicamente; não fixar um ano que ficará desatualizado.

## Componentes

### Botões

- Altura mínima de 46 px; alvo de toque mínimo de 44 × 44 px.
- Primário institucional: fundo `#2C7BE5`, texto branco.
- WhatsApp: fundo `#25D366`, texto `#06231A`; usar somente em ações que realmente abrem o WhatsApp.
- Secundário: transparente, borda `#21425F`, texto claro.
- Hover: mudança sutil de luminância e deslocamento máximo de 1 px.
- Focus: anel visível de 2 px com offset de 2 px.
- Não usar botão desabilitado como decoração.

### Links

- Links em texto precisam de sublinhado ou outro sinal além de cor.
- Links externos devem comunicar destino quando isso for relevante.
- Não abrir todos os links em nova aba; reservar `target="_blank"` para recursos externos e incluir `rel="noopener noreferrer"`.

### Cards e painéis

- Borda de 1 px `#21425F`.
- Fundo `#0E2841` em áreas escuras ou branco em áreas claras.
- Padding entre 24 e 32 px no desktop e 20 px no mobile.
- Título curto, descrição objetiva, lista de entregáveis e ação opcional.
- Não usar “glassmorphism”, blur intenso ou cartões flutuando sem alinhamento.

### Formulários

- O WhatsApp é o caminho principal. Só criar formulário se houver backend real, validação, consentimento e tratamento de erro.
- Rótulos sempre visíveis; placeholder não substitui label.
- Mensagens de erro devem explicar como corrigir.
- Não coletar dados sensíveis do processo judicial em formulário público sem necessidade e proteção adequadas.

## Aplicação em cartão de apresentação

O cartão deve usar a mesma identidade, ser apropriado para deixar em escritórios de engenharia e advocacia e ter leitura rápida.

### Formato

- Tamanho final preferencial: 90 × 50 mm.
- Sangria: 3 mm em todos os lados.
- Área segura: pelo menos 4 mm dentro do corte.
- Cor: CMYK para produção gráfica; preparar também versão RGB para compartilhamento digital.
- Exportar frente e verso separadamente em SVG/PDF vetorial quando os ativos oficiais permitirem.

### Frente

- Fundo branco ou `#F7F9FB`.
- Logotipo oficial centralizado, com ampla área de respiro.
- Nenhum slogan adicional, textura pesada, QR code ou lista de serviços.

### Verso

- Fundo `#0A1B2E`.
- Nome: `Gusttavo Gutierry`.
- Cargo: `Engenheiro Eletricista`.
- Registro: `CREA 1023983184D-GO`.
- WhatsApp: `+55 64 98439-5286`.
- Serviços em três linhas:
  - `Perícias judiciais e assistência técnica`
  - `Projetos, laudos e inspeções elétricas`
  - `SPDA e sistemas fotovoltaicos`
- Chamada: `ATENDIMENTO DIRETO COM O ENGENHEIRO`.
- QR code, se utilizado, deve apontar diretamente para o WhatsApp real, possuir contraste alto, quiet zone adequada e ser testado impresso em tamanho final.
- Não incluir dados fictícios para “equilibrar” o layout.

## Responsividade

- Começar pelo mobile e ampliar progressivamente.
- Nenhum texto, tabela, fórmula ou botão pode causar rolagem horizontal a 320 px.
- Hero mobile deve caber com título legível, um CTA principal e identificação profissional antes de excesso de conteúdo.
- Grids de 3 colunas viram 2 em tablet e 1 no mobile.
- Navegação mobile deve ter foco preso enquanto aberta, fechar com `Esc` e restaurar foco ao botão.
- Não esconder informação essencial apenas para simplificar o mobile.
- Em telas largas, evitar linhas de texto maiores que 70–80 caracteres.

## Acessibilidade

- Atender WCAG 2.2 nível AA.
- Usar HTML semântico: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`.
- Apenas um `h1` por página; hierarquia de títulos sem saltos arbitrários.
- Contraste mínimo de 4.5:1 para texto normal e 3:1 para texto grande e componentes.
- Todos os controles operáveis por teclado, com foco visível.
- Incluir link “Pular para o conteúdo”.
- Logo deve ter texto alternativo `ElektroSys Engenharia Elétrica`; elementos decorativos usam `alt=""`.
- Ícones acionáveis precisam de nome acessível.
- Respeitar `prefers-reduced-motion` e desativar transições não essenciais.
- Não depender apenas de cor para estados, categorias ou erros.

## Movimento

- Animações discretas entre 150 e 220 ms.
- Permitido: fade/translate de 8 a 12 px em entrada, underline de navegação e feedback de botão.
- Proibido: parallax, scroll-jacking, partículas, raio pulsando, texto digitado, números contando, transições 3D e animações contínuas sem função.
- Conteúdo deve permanecer visível e utilizável se JavaScript falhar.

## SEO e conteúdo compartilhável

- Título sugerido: `ElektroSys | Engenharia Elétrica, Laudos e Perícias em Goiás`.
- Descrição sugerida: `Projetos elétricos, laudos, inspeções, SPDA, sistemas fotovoltaicos, perícias judiciais e assistência técnica com atendimento direto do engenheiro responsável.`
- URLs, títulos, descrições e Open Graph exclusivos por página.
- Incluir dados estruturados `ProfessionalService` ou tipo Schema.org mais específico somente com informações reais e verificadas.
- Não inserir estrelas, avaliações, área atendida, endereço ou horário em dados estruturados se não estiverem publicados e confirmados.
- Imagens sociais devem usar o logotipo oficial, alto contraste e texto curto.
- Criar `sitemap.xml`, `robots.txt`, canonical URLs e favicon derivado do símbolo oficial quando o projeto for publicado em domínio real.

## Performance

- Meta de Lighthouse em produção: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95 e SEO ≥ 95.
- Priorizar HTML e CSS; JavaScript apenas onde cria valor real.
- Converter logo e imagens para formatos adequados sem degradar bordas ou tipografia.
- Definir dimensões de mídia para evitar layout shift.
- Carregar fontes com `font-display: swap` e fazer preload apenas do recurso crítico.
- Lazy-load de imagens abaixo da dobra.
- Evitar bibliotecas pesadas para ícones ou animações simples.

## Regras de implementação para Claude Code

1. Ler o projeto atual antes de alterar arquivos.
2. Identificar stack, rotas, componentes, estilos e ativos existentes.
3. Preservar funcionalidades e calculadoras atuais, corrigindo apenas o necessário para integrá-las à nova arquitetura.
4. Mapear os tokens deste arquivo para CSS Custom Properties, tema do Tailwind ou sistema equivalente já usado no projeto.
5. Criar componentes reutilizáveis, mas evitar abstrações prematuras para blocos usados uma única vez.
6. Manter conteúdo comercial em um objeto/configuração central para facilitar revisão de telefone, CREA, links e textos.
7. Usar o logotipo fornecido; não gerar substituto.
8. Implementar links reais, estados de hover/focus/active e comportamento responsivo.
9. Validar HTML, TypeScript/JavaScript, lint, build e testes disponíveis antes de concluir.
10. Testar visualmente nos tamanhos 320, 375, 768, 1024, 1440 e 1920 px.
11. Testar o QR code do cartão e o link do WhatsApp antes de considerar a entrega concluída.
12. Não adicionar depoimentos, números, endereços ou imagens fictícias.
13. Se houver dúvida jurídica, normativa ou comercial, deixar o conteúdo como pendência explícita para validação humana.

## Restrições visuais

- Não mudar o logotipo escolhido.
- Não usar paleta vermelha/terracota do exemplo “Heritage”.
- Não usar estética de escritório de advocacia tradicional.
- Não usar amarelo e preto como paleta principal de “alta tensão”.
- Não usar neon, cyberpunk, glow intenso ou excesso de circuitos decorativos.
- Não usar gradientes chamativos, glassmorphism ou skeuomorphism.
- Não usar fotos ou depoimentos gerados por IA como se fossem reais.
- Não criar selos de “certificado”, “aprovado” ou “garantido”.
- Não misturar mais de três famílias tipográficas.
- Não repetir a marca em toda seção.
- Não permitir que ferramentas gratuitas apareçam antes dos serviços e da perícia.

## Critérios de aceite

- [ ] O logotipo oficial aparece sem distorção e com respiro adequado.
- [ ] A paleta principal é azul-marinho, azul do logotipo e azul elétrico.
- [ ] Em até cinco segundos é possível entender quem atende, o que a ElektroSys faz e como entrar em contato.
- [ ] Perícias e assistência técnica são encontradas facilmente pelo público jurídico.
- [ ] Projetos, laudos, inspeções, SPDA e fotovoltaico estão descritos com clareza.
- [ ] O WhatsApp correto funciona com mensagem pré-preenchida e editável.
- [ ] Nome, cargo e CREA estão consistentes em todas as páginas e no cartão.
- [ ] Não há conteúdo, depoimento, cliente, número ou credencial inventada.
- [ ] Navegação funciona com teclado, foco visível e leitor de tela.
- [ ] Layout não quebra entre 320 e 1920 px.
- [ ] Motion reduzido é respeitado.
- [ ] Build, lint e testes existentes passam sem erros.
- [ ] Ferramentas técnicas continuam acessíveis, mas não desviam a conversão principal.
- [ ] O cartão mantém leitura, contraste, sangria, área segura e QR code testado.

