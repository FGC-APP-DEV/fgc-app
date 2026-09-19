# Inventário inicial e diferenças do legado

Inspeção estática em 17/09/2026; nenhum servidor ou banco iniciado.
Base `firstglobal-ops`: commit `70d3355014ffa27963455a589a24ff48ad151900`.
Base `fgc-app`: commit `963ba4fd7b3df58e296f5d08f4e8412222a7df7e`, com alterações
preexistentes em `AGENTS.md` e `package-lock.json`, não modificadas nesta tarefa.

## Documentos e precedência

| Fonte | Uso |
| --- | --- |
| `contexts/FGC-MVP-DECISOES.md` | Regras atuais aprovadas; precedência sobre as demais fontes. |
| `contexts/APP-FGC-TODOS-AND-CONCEPTS.md` | Origem do card, restrições e backlog. |
| `contexts/FGC_Operations_App_Meeting_Summary_Aug31.md` | Contexto do MVP e responsabilidades históricas. |
| `contexts/JUDGES-MODULE.md` | Visão ampla histórica; funcionalidades excluídas não entram automaticamente. |
| `fgc-app/README.md`, `package.json`, `nx.json`, `tsconfig.base.json` | Estrutura real de destino, stack e aliases. |
| `firstglobal-ops/README.md`, `docs/OVERVIEW.md` | Visão funcional do legado, confrontada com código. Há diferenças históricas: README diz sem deploy, overview diz publicado; estado remoto não verificado. |
| `firstglobal-ops/CLAUDE.md`, `LEARNING.md` | Referências adicionais identificadas; não tratadas como requisitos aprovados e ainda não revisadas integralmente nesta consolidação. |
| `docs/codex-setup.md` | Referência de configuração de agentes identificada, não fonte de regras de produto. |

Não havia brief/PRD/arquitetura formal nos arquivos Markdown visíveis da busca
em `contexts/`, `fgc-app/` e `firstglobal-ops/`. Os artefatos desta pasta são a
primeira consolidação desta tarefa; isso não afirma inexistência de materiais externos.

## Filming — escopo de paridade identificado

Caminhos abaixo relativos a `firstglobal-ops/`.

| ID | Comportamento | Evidência | Destino proposto |
| --- | --- | --- | --- |
| F01 | Step & Repeat: pendente/capturada/pulada, notas, limpar marcação e contagem de capturadas | `src/app/filming/page.tsx`, `src/lib/filming/mark-shot.ts`, `src/components/filming/mark-shot-dialog.tsx` | Nova biblioteca de Filming e API; preservar fluxo nas três plataformas. |
| F02 | Busca, filtros de status/continente e visualização por mapa | `src/components/filming/step-and-repeat-tracker.tsx`, `src/components/locator/team-map.tsx` | UI compartilhada com adaptação nativa do mapa; no legado o mapa mostra todas as equipes mesmo com filtro da lista. |
| F03 | Shot list: categorias, busca/filtro, adicionar categoria/item, concluir/desmarcar e excluir item | `src/components/filming/shot-list.tsx`, `src/lib/filming/categories.ts`, `shot-items.ts` | Biblioteca de Filming; regras no servidor. |
| F04 | Pager da equipe: presets de Filming, mensagem, envio imediato/agendado e histórico com resposta | `src/lib/pages/send.ts`, `presets.ts`, `list.ts`, `src/components/page-team/` | Serviço compartilhado de mensagens com adaptador nativo. |
| F05 | Consulta pelo mentor de situação de filmagem por equipe | `src/lib/filming/team-status.ts`, `src/components/mentor/filming-view.tsx` | Preservar dependência necessária ao fluxo; compatibilizar sessão do mentor. |

Filming exige role `filmmaker` no legado. O acesso de admin global é uma exceção
do legado, não autorização para ignorar restrições explícitas de Judging.
Inventário é funcional inicial: ainda falta mapear todos os artefatos, modelos,
assets e verificações de paridade antes de executar a transposição integral.

## Autenticação e alertas

- `src/app/(auth)/sign-in/actions.ts`: Supabase `signInWithOtp`, alternativa
  `verifyOtp` por código de e-mail e logout. `src/lib/auth.ts`: verificação de claims,
  usuário interno, roles por evento e bypass de admin/superadmin.
- Reutilizar a identidade e o fluxo, adaptando cookies/redirects/Server Actions
  para clientes web/mobile e API. Não copiar APIs Next para React Native.
- `src/lib/pages/presets.ts`: mensagens de Filming, Judging, Pit Admin e Production;
  respostas de mentor: “On our way”, “ETA ~10 min”, “Can't come now”.
- `src/lib/mentor/respond.ts`: sessão de equipe, resposta à mensagem da própria
  equipe e primeira resposta aceita; não presumir uma conta de staff para mentor.
- `src/lib/announcements/send.ts`: anúncios para all/mentors/all_staff com role
  Pit Admin. Não concede essa permissão a Judge.
- `src/components/mentor/live-refresh.tsx`: consulta periódica, padrão de 20s.
  `src/lib/pages/list.ts`: mensagens agendadas vencidas aparecem na leitura;
  não é mecanismo de push em segundo plano. Adaptação nativa é trabalho novo.
- `src/lib/schedule/sync.ts` contém integração com `api.first.global/v1`;
  `prisma/sync-teams.ts` também usa essa API. Não foi consultada remotamente,
  nem validada para a programação requerida; manter placeholder e importação
  oficial aprovados, usando o código como evidência para investigação futura.

## Destino Nx

`npm exec -- nx show projects --json` identificou: fgc-web, fgc-api, fgc-mobile,
database, graphql, judging, shared, auth e ui. Aliases existentes: `@fgc/shared`,
`@fgc/graphql`, `@fgc/ui`, `@fgc/auth`, `@fgc/judging`, `@fgc/database`.

Stack declarada: React 18/RN 0.73/RN Web, Express/Apollo, Drizzle/Postgres;
legado: Next 16/React 19, Prisma 7/Postgres/Supabase Auth. Não copiar dependências
entre os projetos sem adaptação. Versões citadas são das declarações locais.

`apps/fgc-mobile` contém shell JS/TS e Metro, sem diretórios Android/iOS.
`apps/fgc-api/src/context.ts` usa JWT próprio com fallback de segredo de desenvolvimento;
README documenta login de demonstração sem senha. Esse caminho não serve como
evidência de autenticação pronta para produção.

Nx contém `passWithNoTests`; sucesso sem testes não comprova cobertura.
Builds, testes e funcionamento remoto não foram verificados nesta inspeção.
