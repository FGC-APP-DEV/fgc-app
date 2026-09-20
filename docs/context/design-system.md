# Design system — FGC Judging Operations

Extraído de `fgc-app-google-ai-studio/` em **19/09/2026**. **Referência visual obrigatória para a versão final do MVP**, conforme orientação do usuário em 19/09/2026.

## 1. Escopo e confiabilidade

Este documento fixa a identidade visual a adaptar em `fgc-app` para web, Android e iOS. A extração do protótipo é a origem dos valores e receitas; fluxos e permissões são definidos por [D01–D74](FGC-MVP-DECISOES.md), [PRD](fgc-mvp/PRD.md) e [T01–T05](fgc-mvp/contratos-tecnicos.md). Foram lidos todos os arquivos de `src/`, as configurações de entrada, o manifesto e o lockfile. A referência Git é `c5eb3ea4ec048314bfd52076a867b040e89b8abb`; na análise, `package-lock.json` estava presente localmente, mas não versionado. Nenhum arquivo do protótipo foi alterado.

Convenções usadas neste documento:

- **Declarado:** token explícito em `src/index.css`.
- **Observado:** padrão presente nas classes ou no comportamento das telas.
- **Recomendado:** orientação para uma implementação posterior; não existe necessariamente no protótipo.

A extração é estática, com verificação local da geração de algumas classes CSS. Não houve inspeção visual em navegador, validação em dispositivos ou execução de testes funcionais. As dimensões em pixels derivadas de `rem` pressupõem raiz de 16 px. Os tokens atuais de `fgc-app/libs/ui` deverão ser adaptados a esta referência. A implementação usa primitivas RN/RN Web e o grafo T04; Tailwind, Vite e Motion descrevem a origem, não impõem dependências no destino.

## 2. Identidade e implementação

Interface operacional clara, orientada a consulta rápida e ações em dispositivos móveis: fundo quase branco, superfícies brancas, azul-marinho para hierarquia e ações, e cores de estado para progresso e urgência. Cards arredondados, bordas discretas e sombras leves se repetem em todas as telas. Rótulos pequenos em caixa alta contrastam com números e títulos em negrito.

| Camada | Implementação encontrada |
| --- | --- |
| Plataforma | React DOM + TypeScript, aplicação Vite; não usa primitivas React Native |
| Estilos | Tailwind CSS 4 via `@tailwindcss/vite`, utilitários no JSX e `@theme` em CSS |
| Ícones | `lucide-react`, predominantemente contornos |
| Movimento | `motion/react` e animações nativas do Tailwind |
| Tema | Somente claro; nenhuma variante `dark:` ou alternância de tema |
| Componentização | Seis componentes de tela e o shell em `App.tsx`; não há biblioteca de primitivas, variantes compartilhadas ou Storybook |
| Conteúdo | Interface em inglês; dados de demonstração em `constants.ts` e nas próprias telas |

O manifesto declara faixas de versões. O lockfile local registra React 19.3.0, Tailwind 4.3.3, Motion 12.43.0, Lucide 0.546.0 e Vite 6.4.3. Esses valores descrevem a cópia analisada, não uma exigência para a futura aplicação.

## 3. Cores

Valores de referência para o MVP nesta tabela; origem: `fgc-app-google-ai-studio/src/index.css`, bloco `@theme`. As 14 cores são tokens reais; os nomes abaixo podem formar classes como `bg-surface`, `text-primary` e `border-border`.

| Token CSS | Valor | Papel observado |
| --- | --- | --- |
| `--color-primary` | `#000615` | Títulos, números, progresso, ações de entrevista, botão flutuante |
| `--color-primary-container` | `#0B1F3A` | Ações principais de login/envio, navegação ativa, badge de localização |
| `--color-secondary` | `#4059AA` | Links, reconhecimento de mensagens, ícones e foco do login |
| `--color-background` | `#F8FAFC` | Fundo geral |
| `--color-surface` | `#FFFFFF` | Cards, cabeçalho, navegação e menu |
| `--color-surface-container-low` | `#F5F3F6` | Cabeçalhos de listas, fundos de ícones, campos informativos e hover |
| `--color-surface-container-high` | `#E9E7EA` | Trilho de progresso e segmento inativo |
| `--color-on-surface` | `#1B1B1E` | Texto padrão do corpo |
| `--color-on-surface-variant` | `#44474D` | Descrições, ícones e navegação inativa |
| `--color-outline` | `#75777E` | Metadados, rótulos, estado não iniciado e marcadores neutros |
| `--color-border` | `#E5E7EB` | Bordas e divisórias |
| `--color-success` | `#22C55E` | Concluído, respondido e progresso favorável |
| `--color-warning` | `#F59E0B` | Pendências e espera |
| `--color-danger` | `#EF4444` | Urgência, erro e indisponibilidade |

### Composições de cor observadas

- Badges e fundos de ícones: `bg-success/10`, `bg-warning/10`, `bg-danger/10`, `bg-secondary/10` e `bg-outline/10`, geralmente com texto na cor base.
- Hover discreto: `bg-surface-container-low` ou sua versão `/50`; saída da sessão usa `hover:bg-danger/5`.
- Seleção de texto no shell: `selection:bg-primary/10`; backdrop: `bg-black/5`.
- Branco sobre fundos escuros ou semânticos aparece como `text-white`, sem token `on-primary` ou `on-success`.
- Exceções literais: mapa com `bg-[#f8fafc]`, pontos pretos `#000` e bordas brancas. O fundo literal equivale ao token `background`.

As opacidades são modificadores das cores, não tokens adicionais. **Recomendado:** preservar os nomes semânticos e eliminar literais equivalentes na futura extração para componentes.

## 4. Tipografia

Token declarado: `--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif`. O `body` aplica `font-sans`, `text-on-surface` e `bg-background`.

**Limite importante:** não há importação da Inter, `@font-face`, arquivo de fonte ou link de carregamento em `index.html`. A família efetivamente renderizada depende da disponibilidade local e dos fallbacks do sistema.

| Classe/tamanho | Altura de linha padrão | Uso observado |
| --- | --- | --- |
| `text-[8px]` | Sem altura específica declarada | Estados de equipes, pequenos indicadores, mapa |
| `text-[9px]` | Sem altura específica declarada | Navegação inferior, badges de atividade, “Live” |
| `text-[10px]` | Sem altura específica declarada | Rótulos, metadados, horários e estados |
| `text-xs` — 12 px | 16 px | Descrições compactas, botões de cards e cabeçalhos de listas |
| `text-sm` — 14 px | 20 px | Texto operacional, nomes de equipes, inputs e descrições |
| `text-lg` — 18 px | 28 px | Título do shell e seções |
| `text-xl` — 20 px | 28 px | Marca do login, identificação do painel e formulário de envio |
| `text-2xl` — 24 px | 32 px | Acesso, chamada urgente e classificação |
| `text-3xl` — 30 px | 36 px | Métricas do advisor |
| `text-5xl` — 48 px | 48 px | Percentual principal de progresso |

Pesos observados: `font-medium` 500, `font-semibold` 600, `font-bold` 700 e `font-extrabold` 800. O texto sem peso explícito mantém o padrão herdado. A descrição longa do alerta usa `leading-relaxed` (1,625).

Espaçamento entre letras: `tracking-tight` −0,025 em nos títulos compactos; `tracking-wider` 0,05 em e `tracking-widest` 0,1 em em rótulos; `tracking-[0.2em]` em títulos auxiliares; `tracking-[0.5em]` no código de acesso. Metadados e badges usam frequentemente `uppercase`. Há itálico na mensagem citada e no critério de ordenação das equipes.

**Recomendado:** transformar esses usos em papéis tipográficos explícitos ao criar componentes. Os textos de 8–10 px são uma característica observada, não uma recomendação de legibilidade.

## 5. Espaçamento, dimensões e layout

O tema padrão instalado define `--spacing: 0.25rem`: escala base de 4 px. Não há escala de espaçamento personalizada.

| Utilitário numérico | Valor a 16 px/rem | Aplicações |
| --- | --- | --- |
| `0.5`, `1`, `1.5` | 2, 4, 6 px | Padding de badges, pequenos gaps e marcadores |
| `2`, `2.5`, `3` | 8, 10, 12 px | Grupos compactos, botões de ícone e navegação |
| `4`, `5`, `6` | 16, 20, 24 px | Espaço entre cards e padding de conteúdos |
| `8` | 32 px | Separação entre grandes seções |
| `10`, `12`, `14`, `16` | 40, 48, 56, 64 px | Controles, avatares e barras |
| `20`, `24` | 80, 96 px | Reservas inferiores ou posição do botão flutuante |
| `32` | 128 px | Altura das respostas rápidas do mentor |

### Estrutura da aplicação

- Shell: `min-h-screen flex flex-col`; cabeçalho `sticky top-0`, altura de 64 px, padding horizontal de 16 px, borda inferior e `shadow-sm`.
- Conteúdo: `w-full max-w-4xl mx-auto`, limite de 56 rem / 896 px; `p-4 md:p-6 pb-24`.
- Navegação inferior: fixa, largura total da viewport, altura de 64 px, borda superior, distribuição `justify-around`; permanece inferior também em desktop.
- Item de navegação: altura de 48 px, largura mínima de 72 px, ícone sobre legenda e raio de 12 px.
- Login: coluna central `max-w-sm` (24 rem / 384 px), padding externo horizontal de 16 px e vertical de 32 px, fotografia 16:9.
- Cards: padding de 20 ou 24 px; linhas menores usam 16 px; separação interna usual de 8–16 px e entre seções de 24–32 px.
- Mapa: proporção 4:3. Fotografia do login: 16:9. Ambas usam `object-cover`.

**Ressalvas verificadas:** `pb-safe` aparece na navegação, mas não possui definição e não gera CSS na configuração instalada. Além disso, em `md` a regra `md:p-6` aplica padding nos quatro lados, substituindo o `pb-24` do conteúdo por 24 px. Algumas telas adicionam `pb-12` ou `pb-20`, mas não há uma solução uniforme de afastamento da barra fixa.

### Responsividade observada

O único prefixo responsivo usado nas telas é `md:`, com breakpoint de **48 rem / 768 px** no tema instalado. Abaixo dele, prevalecem os estilos sem prefixo.

| Região | Abaixo de `md` | A partir de `md` |
| --- | --- | --- |
| Métricas do advisor | 1 coluna | 3 colunas |
| Alertas operacionais | 1 coluna | 2 colunas |
| Mensagens predefinidas | 1 coluna | 2 colunas |
| Histórico do pager | Card em coluna | Linha com alinhamento central |
| Título do shell | Truncado, máximo de 200 px | Sem limite de largura específico |

Respostas do mentor permanecem em duas colunas; resumo do painel mantém quatro colunas; agenda mantém três colunas. Não há variantes específicas `sm:`, `lg:` ou `xl:` nas telas analisadas. Textos longos, ampliação de fonte e larguras reduzidas ainda precisam de validação visual.

## 6. Forma, bordas e elevação

| Padrão | Valor | Uso |
| --- | --- | --- |
| `rounded` | 4 px | Badges retangulares compactos |
| `rounded-lg` | 8 px | Identificador de equipe e miniestatísticas |
| `rounded-xl` | 12 px | Inputs, botões, item de navegação e blocos de ícone |
| `rounded-2xl` | 16 px | Cards, imagem do login e menu do usuário |
| `rounded-full` | Circular/pílula | Avatares, marcadores, badges do pager, progresso e botão flutuante |
| `border` | 1 px | Contorno de superfícies e campos |
| `border-2` / `ring-2` | 2 px | Urgência, foco, estado em andamento e respostas contornadas |
| `border-l-4` / `w-1` | 4 px | Faixa lateral de estado ou destaque |

Sombras herdadas do Tailwind instalado; não existem tokens próprios de elevação:

| Classe | Valor CSS | Uso |
| --- | --- | --- |
| `shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1)` | Cards e cabeçalho |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1)` | Navegação ativa |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1)` | Marcadores do mapa |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / .1), 0 8px 10px -6px rgb(0 0 0 / .1)` | Menu, marcador ativo e botão flutuante |

Camadas: backdrop e botão flutuante usam `z-40`; cabeçalho e navegação usam `z-50`; menu usa `z-[60]` dentro do cabeçalho. Esses números não constituem uma escala centralizada de overlays; o contexto de empilhamento do cabeçalho também se aplica ao menu.

## 7. Catálogo de padrões de componentes

Os nomes desta seção organizam a documentação; **não são exports ou APIs existentes**. As receitas são classes observadas e precisam de comportamento e semântica adequados ao serem transformadas em componentes.

| Padrão | Receita visual / variantes | Referência |
| --- | --- | --- |
| Card de superfície | `bg-surface rounded-2xl border border-border shadow-sm`, `p-5` ou `p-6` | Todas as telas |
| Card com cabeçalho | Superfície com `overflow-hidden`, cabeçalho `bg-surface-container-low`, separador `border-b` | Submissões, mapa, agenda |
| Ação principal de formulário | `w-full h-14 bg-primary-container text-white rounded-xl`, ícone + texto | Login e pager |
| Ação de entrevista | `h-10 bg-primary text-white rounded-xl text-xs font-bold` | Painel do juiz |
| Ação secundária | Borda neutra, fundo herdado, hover `bg-surface-container-low`, altura de 40 px | Ação secundária autorizada |
| Ação textual | `text-secondary`, peso 600/700, tamanho 10–14 px | Ajuda, “View All”, “View Logs” |
| Botão de ícone | `p-2.5 rounded-full`, ícone de 20 px e hover suave | Cabeçalho |
| Campo de busca | `h-12 border border-border rounded-xl pl-12 pr-4 text-sm`, ícone à esquerda | Painel, agenda e pager |
| Campo de acesso | `h-14 rounded-xl text-center text-2xl tracking-[0.5em]`, entrada visual; formato/limites do código seguem T02/T03 | Login |
| Badge compacto | Cor de estado a 10% no fundo, texto semântico, negrito, raio de 4 px | Equipes, métricas e submissões |
| Badge com ponto | `px-3 py-1 rounded-full text-[10px] font-bold gap-1.5`, ponto de 6 px | Histórico do pager |
| Indicador de progresso | Trilho `h-4 bg-surface-container-high rounded-full`, preenchimento `bg-primary` | Advisor |
| Card de equipe | Card com faixa lateral de 4 px, bloco de identificação de 48 px, badge e ações | Painel do juiz |
| Card de alerta operacional | Botão de largura disponível, ícone em bloco 48 × 48 px, título, descrição e chevron | Advisor |
| Alerta urgente | `border-2 border-danger rounded-2xl p-6`, ícone pulsante, mensagem citada com faixa lateral | Mentor |
| Resposta rápida | Grade de 2 colunas; `h-32 p-6 rounded-2xl`; ícone 28 px acima do texto | Mentor |
| Lista/tabela operacional | Contêiner arredondado, divisórias; agenda com `grid-cols-3` e texto alinhado por coluna | Agenda e submissões |
| Menu do usuário | 192 px de largura, ancorado à direita, `rounded-2xl shadow-xl`, identificação e logout | Shell |

### Estados de componentes

- **Hover:** fundo neutro suave, borda secundária nos presets, opacidade de 90% no envio, escala de 1,05 no botão flutuante.
- **Pressionado:** escala de 0,95 em ações principais/respostas; 0,98 nos presets; 0,90 na navegação inativa.
- **Selecionado:** navegação com `bg-primary-container text-white shadow-md`; traço do ícone muda de 2 para 2,5. Presets não guardam estado selecionado.
- **Foco:** login com `ring-2` e borda em `secondary`; buscas do painel/agenda usam `primary/10` e pager usa `secondary/20`. Não há padrão compartilhado de `focus-visible`.
- **Erro:** login exibe mensagem `text-xs text-danger text-center font-medium`; alterar o código limpa a mensagem.
- **Desabilitado:** aplicar semântica disabled e bloquear a interação; aparência sozinha não basta.
- **Loading, vazio, sucesso de envio e falha de rede:** sem estados implementados. Listas exibem dados fixos.

## 8. Estados do MVP

A aparência reflete o estado retornado pelo servidor; não cria estados de domínio.

| Contexto | Estado/ação aprovada | Aplicação visual |
| --- | --- | --- |
| Judging | Pendente / avaliada | Rótulo explícito, badge neutro / sucesso; conclusão somente pelo líder, reabertura por líder/JA |
| Participação | Ativa / retirada | Estado separado; retirada com motivo e indicação de bloqueio |
| Sinalizações | Ausente / entrevista online / outro impedimento | Badges simultâneos, motivo quando obrigatório; sem alterar avaliação |
| Pager | Disponível / respondido e situação de envio | Histórico e rótulos derivados do contrato; não confundir aceitação pelo provedor com leitura |
| Resposta mentor | “On our way”, “ETA ~10 min”, “Can't come now” | Três ações com ícone/texto e contraste adequado; primeira resposta conforme T03 |
| Filming | Pending / captured / skipped | Preservar F01–F05 e aplicar tokens semânticos |

Estados de loading, vazio, erro, conflito, sem rede e sem permissão precisam de apresentação explícita. Preservar texto não salvo e confirmações conforme PRD.

## 9. Ícones e imagens

Lucide é usado para navegação, identificação de ações e contexto operacional. Tamanhos observados: 14 px em ações compactas; 16 px no logout; 18 px em buscas e alertas; 20 px em navegação/cabeçalhos; 24 px em marca e alertas operacionais; 28 px nas respostas do mentor. A navegação declara explicitamente `strokeWidth` 2 ou 2,5.

Exemplos: `ShieldCheck` para identidade, `LayoutDashboard`/`Calendar`/`MessageSquare`/`Map` para abas, `Search` para buscas, `AlertTriangle`/`AlertCircle` para alertas, `Send`/`Megaphone` para mensagens e `History` para atividade. Não há logotipo vetorial próprio ou pacote local de imagens em `src/`.

- Login: fotografia remota de evento em `i0.wp.com/first.global/`, crop 16:9, raio de 16 px; o texto alternativo atual é “Security Terminal”.
- Mapa: imagem remota de `lh3.googleusercontent.com`, proporção 4:3, `grayscale opacity-30`; grade de pontos pretos de 1 px a cada 15 px, com opacidade de 10%.
- Marcadores: círculos de 32 px, ativo de 40 px, borda branca de 2 px e sombra; posições percentuais fixas.

Os endereços completos estão nos componentes de origem. A disponibilidade remota e os direitos de reutilização não foram verificados. Não há fallback visual para falha dessas imagens.

## 10. Movimento

| Interação | Implementação efetiva |
| --- | --- |
| Troca de aba/perfil | `AnimatePresence mode="wait"`; entrada `opacity: 0 → 1`, `x: 5 → 0`; saída `opacity: 0`, `x: -5`; duração 0,2 s |
| Menu do usuário | Entrada de opacidade 0, escala 0,95 e `y: -10` para 1/1/0; saída reversa; sem duração explícita |
| Imagem do login | Entrada `opacity: 0 → 1`, `y: 20 → 0`; sem duração explícita |
| Progresso geral | Largura 0 → 79% em 1 s, `easeOut`; valor de demonstração |
| Cards de equipe | Entrada `opacity: 0 → 1`, `x: -10 → 0`; atraso `índice × 0,1 s` |
| Resposta “On the way” | Ícone oscila `x: [0, 5, 0]`, repetição infinita, duração 1,5 s |
| Alertas e mapa ativo | `animate-pulse`, padrão instalado de 2 s, repetição infinita |
| Hover e pressão | `transition-colors`, `transition-transform` ou `transition-all`; padrão CSS de 150 ms, navegação com 200 ms |

As classes `animate-in`, `fade-in` e `slide-in-from-bottom-4` aparecem nas telas, junto de `duration-500`, mas não têm definição/importação no projeto e **não geraram regras** na compilação isolada com o Tailwind instalado. Elas não comprovam uma animação de entrada de 500 ms. As animações via Motion e `animate-pulse`/`animate-ping` são mecanismos distintos.

Não há tratamento explícito de movimento reduzido. **Recomendado:** fornecer variantes com `prefers-reduced-motion` e revisar repetições contínuas antes de reutilizar esses efeitos.

## 11. Composição das telas do MVP

| Superfície | Composição a adaptar | Contrato funcional |
| --- | --- | --- |
| Acesso staff | Marca, card, campos e ajuda | Magic link/código T02; sem seletor local de privilégios |
| Acesso mentor | Card de código e feedback | Sessão por equipe T03/D71 |
| Administração | Cards, formulários, listas e prévia | Roles, importação e códigos de mentor; sem acesso a Judging |
| JA | Métricas, painéis, listas e confirmações | Gestão, progresso, retirada e encerramento conforme PRD |
| Juiz/líder | Busca, resumo, cards de equipe e observações | Painel atual, autoria e conclusão/reabertura conforme permissões |
| Filming | Filtros, mapa, tracker e shot list | Paridade F01–F05 com a identidade visual deste documento |
| Pager/mentor | Presets, envio, histórico e respostas | M15–M21; três respostas legadas aprovadas |
| Programação | Card informativo e link | URL configurada ou “Schedule coming soon” sem link |

Shells compõem somente superfícies autorizadas. Tokens, tipografia, espaçamento, formas e padrões desta referência são obrigatórios; adaptar navegação e primitivas à plataforma. Dados fixos e ações do protótipo não definem comportamento do MVP.

## 12. Acessibilidade e lacunas para reutilização

Os seguintes pontos são achados de código, não uma auditoria completa de conformidade:

1. Botões de sino e usuário não têm nome acessível explícito. O menu não declara estado expandido nem implementa gestão de foco ou fechamento por Escape.
2. Labels dos formulários não usam associação `htmlFor`/`id`; buscas do painel e agenda não têm label explícito. A mensagem de erro não está associada ao campo por `aria-describedby` nem usa anúncio de erro.
3. A navegação ativa é visual; falta indicação como `aria-current`. O progresso não possui semântica de progressbar. A tabela da agenda é composta por `div`s, sem semântica tabular.
4. O protótipo contém ação com aparência desabilitada sem bloqueio semântico. `MoreVertical` tem `cursor-pointer`, mas é um SVG sem botão, handler ou interação de teclado.
5. Os campos removem outline e usam anéis de foco com cores/opacidades variadas. Botões não têm tratamento de foco consistente. Há controles de 40 px e textos de 8–10 px a revisar para toque e legibilidade.
6. Estados frequentemente combinam texto com cor, o que ajuda a identificação. Ainda assim, segmentos de progresso, notificações e pulsos carecem de descrição semântica própria.
7. Não há estratégia de safe area, redução de movimento, carregamento de fontes, imagens indisponíveis ou estados assíncronos documentada no código.

### Contraste calculado das cores sólidas

Foi calculada localmente a razão de luminância relativa sRGB entre cada cor e branco opaco, sem navegador. O resultado também vale para branco sobre o mesmo fundo sólido. Não representa os badges translúcidos, overlays ou todas as combinações renderizadas.

| Cor versus branco | Razão aproximada |
| --- | --- |
| `success` | 2,28:1 |
| `warning` | 2,15:1 |
| `danger` | 3,76:1 |
| `outline` | 4,47:1 |
| `secondary` | 6,51:1 |

Como critério de revisão futuro, adotar pelo menos 4,5:1 para texto normal: os verdes, âmbar, vermelho e cinza `outline` acima não atingem esse alvo sobre branco. **Recomendado:** criar combinações acessíveis de texto/fundo por estado e validar os valores finais, em vez de reutilizar automaticamente as cores de preenchimento como texto pequeno. Os valores desta seção não alteram os tokens extraídos.

## 13. Aplicação obrigatória no destino

Implementar os padrões via @fgc/ui, reutilizando e adaptando exports existentes conforme T04. Os nomes abaixo não afirmam componentes já disponíveis.

1. **Base:** transportar os 14 tokens de cor, a pilha de fonte e a escala visual documentada. Resolver o carregamento real da fonte e os pares de contraste antes de fixar a aparência final.
2. **Primitivas:** extrair Card, Button, IconButton, TextField, StatusBadge e ProgressBar; concentrar dimensões, variantes, foco e estados nessas peças.
3. **Composições:** estruturar AppShell, BottomNavigation, MetricCard, TeamCard, PageHistoryItem, UrgentAlert e QuickResponse a partir das receitas observadas.
4. **Estados:** conectar variantes aos tipos de domínio validados; tratar os estados aprovados da seção 8, loading, vazio, erro e disabled explicitamente.
5. **Layout:** preservar limite de 896 px e mudanças em 768 px como referência inicial; corrigir reserva inferior e safe area; validar texto longo e ampliação de fonte.
6. **Verificação:** validar todas as superfícies da seção 11 em larguras móveis e desktop, com teclado, foco, contraste, movimento reduzido e dados sintéticos representativos. Essa validação não foi realizada nesta extração.

Não existe um arquivo de tokens JSON, catálogo de variantes, tema escuro ou API compartilhada para importar diretamente. Também não foram definidos aqui novos valores de marca ou regras de produto.

## 14. Fontes e rastreabilidade

Caminhos relativos à raiz `FGC APP/`; as referências apontam para a cópia analisada. O tema em `node_modules` é evidência da dependência local, não um arquivo a editar ou um contrato próprio do projeto.

| Arquivo | Evidências |
| --- | --- |
| `fgc-app-google-ai-studio/src/index.css` | Todos os tokens de cor, fonte e estilo global |
| `fgc-app-google-ai-studio/src/App.tsx` | Shell, navegação, menu, camadas, perfil e transições |
| `fgc-app-google-ai-studio/src/components/screens/LoginScreen.tsx` | Acesso, formulário, erro, fotografia, ações principais |
| `fgc-app-google-ai-studio/src/components/screens/JudgeAdvisorDashboard.tsx` | Cards, métricas, progresso, alertas e lista de submissões |
| `fgc-app-google-ai-studio/src/components/screens/JudgePanelScreen.tsx` | Busca, estados de equipe, ações, mapa e marcadores |
| `fgc-app-google-ai-studio/src/components/screens/MentorPager.tsx` | Urgência, respostas rápidas e atividade |
| `fgc-app-google-ai-studio/src/components/screens/PagerScreen.tsx` | Presets, campos, envio e badges com ponto |
| `fgc-app-google-ai-studio/src/components/screens/ScheduleScreen.tsx` | Agenda, classificação e botão flutuante |
| `fgc-app-google-ai-studio/src/types.ts` | Perfis e uniões de estados |
| `fgc-app-google-ai-studio/src/constants.ts` | Dados de demonstração |
| `fgc-app-google-ai-studio/src/main.tsx` e `index.html` | Entrada DOM, CSS global, idioma e ausência de carregamento de fonte |
| `fgc-app-google-ai-studio/package.json`, `package-lock.json` e `vite.config.ts` | Dependências, versões e integração Tailwind/Vite |
| `fgc-app-google-ai-studio/node_modules/tailwindcss/theme.css` | Valores herdados de tipografia, breakpoint, dimensões, sombras e movimento |

Verificações executadas: leitura integral do código de interface; conferência dos 14 tokens; inspeção do tema instalado; compilação isolada das classes de animação/safe area e da combinação de paddings; cálculo de contraste; revisão de estados, semântica e referências. Não foi necessário modificar ou compilar a aplicação inteira para produzir este documento.
