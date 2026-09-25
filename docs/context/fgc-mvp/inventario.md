# Inventário e referências da migração

Base do legado: `70d3355014ffa27963455a589a24ff48ad151900`. Inventário completo: 150 arquivos, 30 modelos, 2 enums e 7 migrations; mapas estruturais não comprovam execução.

Referências vigentes: [decisões](../FGC-MVP-DECISOES.md), [PRD](PRD.md), [contratos](contratos-tecnicos.md), [paridade](migracao-escopo-paridade.md) e [design system](../design-system.md). O código legado documenta comportamento de origem; o destino segue esses contratos.

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
Mapeamento disponível em mapa-arquivos.md, modelos-legado.md e simbolos-legado.md; critérios de verificação em M01–M30.

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
