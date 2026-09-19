# Mapa por arquivo — firstglobal-ops → fgc-app

Base: `70d3355014ffa27963455a589a24ff48ad151900`. 150 arquivos rastreados pelo Git. Gerado de fontes locais; não contém dados ou segredos do ambiente.

Os destinos são propostas de localização, não contratos/pacotes já criados. API, autenticação por plataforma e dependências finais permanecem TODO. Nenhum arquivo é excluído silenciosamente: referência/avaliar exige decisão antes da implementação. O catálogo funcional prevalece sobre destinos mecânicos.

| ID | Origem | Domínio | Destino proposto | Ação | Adaptação |
| --- | --- | --- | --- | --- | --- |
| AR-001 | `.env.example` | configuração | `exemplos por app e Supabase` | adaptar | Somente nomes de variáveis; segredos exclusivamente no servidor. |
| AR-002 | `.gitignore` | configuração | `configuração Nx/RN/Supabase equivalente` | substituir | Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual. |
| AR-003 | `AGENTS.md` | documentação | `contexts/fgc-mvp + documentação da migração` | referência | Preservar origem; regras atuais prevalecem sobre instruções históricas. |
| AR-004 | `CLAUDE.md` | documentação | `contexts/fgc-mvp + documentação da migração` | referência | Preservar origem; regras atuais prevalecem sobre instruções históricas. |
| AR-005 | `LEARNING.md` | documentação | `contexts/fgc-mvp + documentação da migração` | referência | Preservar origem; regras atuais prevalecem sobre instruções históricas. |
| AR-006 | `README.md` | documentação | `contexts/fgc-mvp + documentação da migração` | referência | Preservar origem; regras atuais prevalecem sobre instruções históricas. |
| AR-007 | `components.json` | configuração | `configuração Nx/RN/Supabase equivalente` | substituir | Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual. |
| AR-008 | `docs/OVERVIEW.md` | documentação | `contexts/fgc-mvp + documentação da migração` | referência | Preservar origem; regras atuais prevalecem sobre instruções históricas. |
| AR-009 | `eslint.config.mjs` | configuração | `configuração Nx/RN/Supabase equivalente` | substituir | Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual. |
| AR-010 | `next.config.ts` | configuração | `configuração Nx/RN/Supabase equivalente` | substituir | Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual. |
| AR-011 | `package-lock.json` | configuração | `configuração Nx/RN/Supabase equivalente` | substituir | Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual. |
| AR-012 | `package.json` | configuração | `configuração Nx/RN/Supabase equivalente` | substituir | Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual. |
| AR-013 | `postcss.config.mjs` | configuração | `configuração Nx/RN/Supabase equivalente` | substituir | Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual. |
| AR-014 | `prisma.config.ts` | configuração | `configuração Nx/RN/Supabase equivalente` | substituir | Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual. |
| AR-015 | `prisma/dev-grant-role.ts` | dados | `supabase/seed.sql ou tools/migration/dev-grant-role.ts` | adaptar | Separar fixtures de dados reais; sync externo posterior; atribuição de roles não permite bypass. |
| AR-016 | `prisma/dev-join-panel.ts` | dados | `supabase/seed.sql ou tools/migration/dev-join-panel.ts` | adaptar | Separar fixtures de dados reais; sync externo posterior; atribuição de roles não permite bypass. |
| AR-017 | `prisma/migrations/20260621195926_init/migration.sql` | dados | `arquivo de referência do legado; novas migrations SQL Supabase` | referência | Não reaplicar migrations Prisma sobre o destino; extrair relações/constraints necessárias. |
| AR-018 | `prisma/migrations/20260622153936_make_user_full_name_nullable/migration.sql` | dados | `arquivo de referência do legado; novas migrations SQL Supabase` | referência | Não reaplicar migrations Prisma sobre o destino; extrair relações/constraints necessárias. |
| AR-019 | `prisma/migrations/20260623194418_filming_shot_items/migration.sql` | dados | `arquivo de referência do legado; novas migrations SQL Supabase` | referência | Não reaplicar migrations Prisma sobre o destino; extrair relações/constraints necessárias. |
| AR-020 | `prisma/migrations/20260624185050_judges_module_v1/migration.sql` | dados | `arquivo de referência do legado; novas migrations SQL Supabase` | referência | Não reaplicar migrations Prisma sobre o destino; extrair relações/constraints necessárias. |
| AR-021 | `prisma/migrations/20260708012031_schedule_entries/migration.sql` | dados | `arquivo de referência do legado; novas migrations SQL Supabase` | referência | Não reaplicar migrations Prisma sobre o destino; extrair relações/constraints necessárias. |
| AR-022 | `prisma/migrations/20260708163658_judging_round/migration.sql` | dados | `arquivo de referência do legado; novas migrations SQL Supabase` | referência | Não reaplicar migrations Prisma sobre o destino; extrair relações/constraints necessárias. |
| AR-023 | `prisma/migrations/20260708170751_panel_award/migration.sql` | dados | `arquivo de referência do legado; novas migrations SQL Supabase` | referência | Não reaplicar migrations Prisma sobre o destino; extrair relações/constraints necessárias. |
| AR-024 | `prisma/migrations/migration_lock.toml` | dados | `arquivo de referência do legado; novas migrations SQL Supabase` | referência | Não reaplicar migrations Prisma sobre o destino; extrair relações/constraints necessárias. |
| AR-025 | `prisma/schema.prisma` | dados | `supabase/migrations/*.sql + libs/shared/src/database.types.ts` | substituir | Todos os modelos mapeados em modelos-legado.md; sem Prisma/Drizzle no destino. |
| AR-026 | `prisma/seed-mock-schedule.ts` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-027 | `prisma/seed.ts` | dados | `supabase/seed.sql ou tools/migration/seed.ts` | adaptar | Separar fixtures de dados reais; sync externo posterior; atribuição de roles não permite bypass. |
| AR-028 | `prisma/sync-matches.ts` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-029 | `prisma/sync-rankings.ts` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-030 | `prisma/sync-teams.ts` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-031 | `public/file.svg` | assets | `apps/fgc-web/public/file.svg ou libs/ui/src/assets/file.svg` | avaliar | Preservar assets usados; logos de template só com necessidade confirmada; conferir resolução/licença. |
| AR-032 | `public/globe.svg` | assets | `apps/fgc-web/public/globe.svg ou libs/ui/src/assets/globe.svg` | avaliar | Preservar assets usados; logos de template só com necessidade confirmada; conferir resolução/licença. |
| AR-033 | `public/icons/app-icon-192.png` | assets | `apps/fgc-web/public/icons/app-icon-192.png ou libs/ui/src/assets/app-icon-192.png` | avaliar | Preservar assets usados; logos de template só com necessidade confirmada; conferir resolução/licença. |
| AR-034 | `public/icons/app-icon-512.png` | assets | `apps/fgc-web/public/icons/app-icon-512.png ou libs/ui/src/assets/app-icon-512.png` | avaliar | Preservar assets usados; logos de template só com necessidade confirmada; conferir resolução/licença. |
| AR-035 | `public/next.svg` | assets | `apps/fgc-web/public/next.svg ou libs/ui/src/assets/next.svg` | avaliar | Preservar assets usados; logos de template só com necessidade confirmada; conferir resolução/licença. |
| AR-036 | `public/vercel.svg` | assets | `apps/fgc-web/public/vercel.svg ou libs/ui/src/assets/vercel.svg` | avaliar | Preservar assets usados; logos de template só com necessidade confirmada; conferir resolução/licença. |
| AR-037 | `public/window.svg` | assets | `apps/fgc-web/public/window.svg ou libs/ui/src/assets/window.svg` | avaliar | Preservar assets usados; logos de template só com necessidade confirmada; conferir resolução/licença. |
| AR-038 | `src/app/(auth)/sign-in/actions.ts` | auth | `supabase/functions/_shared/(auth)/sign-in/actions.ts` | adaptar | Separar comando seguro de navegação Next; manter contratos TODO. |
| AR-039 | `src/app/(auth)/sign-in/page.tsx` | auth | `libs/auth/src/screens/(auth)/sign-in.tsx + apps/fgc-{web,mobile}` | adaptar | Registrar rota em cada shell; ajustar Judging e horários às decisões atuais. |
| AR-040 | `src/app/admin/page.tsx` | admin | `libs/admin/src/screens/admin.tsx + apps/fgc-{web,mobile}` | adaptar | Registrar rota em cada shell; ajustar Judging e horários às decisões atuais. |
| AR-041 | `src/app/api/cron/sync-matches/route.ts` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-042 | `src/app/api/health/route.ts` | server | `supabase/functions/api/health/index.ts` | adaptar | Health/cron autenticados; sync de horários permanece evolução conforme D05–D06. |
| AR-043 | `src/app/apple-icon.png` | shell | `apps/fgc-web + apps/fgc-mobile + libs/ui` | adaptar | Separar layout/metadados/PWA web de assets, tema e configuração nativa. |
| AR-044 | `src/app/auth/callback/actions.ts` | auth | `supabase/functions/_shared/auth/callback/actions.ts` | adaptar | Separar comando seguro de navegação Next; manter contratos TODO. |
| AR-045 | `src/app/auth/callback/page.tsx` | auth | `libs/auth/src/screens/auth/callback.tsx + apps/fgc-{web,mobile}` | adaptar | Registrar rota em cada shell; ajustar Judging e horários às decisões atuais. |
| AR-046 | `src/app/complete-profile/actions.ts` | auth | `supabase/functions/_shared/complete-profile/actions.ts` | adaptar | Separar comando seguro de navegação Next; manter contratos TODO. |
| AR-047 | `src/app/complete-profile/page.tsx` | auth | `libs/auth/src/screens/complete-profile.tsx + apps/fgc-{web,mobile}` | adaptar | Registrar rota em cada shell; ajustar Judging e horários às decisões atuais. |
| AR-048 | `src/app/filming/page.tsx` | filming | `libs/filming/src/screens/filming.tsx + apps/fgc-{web,mobile}` | adaptar | Registrar rota em cada shell; ajustar Judging e horários às decisões atuais. |
| AR-049 | `src/app/globals.css` | shell | `apps/fgc-web + apps/fgc-mobile + libs/ui` | adaptar | Separar layout/metadados/PWA web de assets, tema e configuração nativa. |
| AR-050 | `src/app/icon.png` | shell | `apps/fgc-web + apps/fgc-mobile + libs/ui` | adaptar | Separar layout/metadados/PWA web de assets, tema e configuração nativa. |
| AR-051 | `src/app/judges/advisor/page.tsx` | judging | `libs/judging/src/screens/judges/advisor.tsx + apps/fgc-{web,mobile}` | adaptar | Registrar rota em cada shell; ajustar Judging e horários às decisões atuais. |
| AR-052 | `src/app/judges/page.tsx` | judging | `libs/judging/src/screens/judges.tsx + apps/fgc-{web,mobile}` | adaptar | Registrar rota em cada shell; ajustar Judging e horários às decisões atuais. |
| AR-053 | `src/app/layout.tsx` | shell | `apps/fgc-web + apps/fgc-mobile + libs/ui` | adaptar | Separar layout/metadados/PWA web de assets, tema e configuração nativa. |
| AR-054 | `src/app/manifest.ts` | shell | `apps/fgc-web + apps/fgc-mobile + libs/ui` | adaptar | Separar layout/metadados/PWA web de assets, tema e configuração nativa. |
| AR-055 | `src/app/mentor/page.tsx` | mentor | `libs/mentor/src/screens/mentor.tsx + apps/fgc-{web,mobile}` | adaptar | Registrar rota em cada shell; ajustar Judging e horários às decisões atuais. |
| AR-056 | `src/app/opengraph-image.tsx` | shell | `apps/fgc-web + apps/fgc-mobile + libs/ui` | adaptar | Separar layout/metadados/PWA web de assets, tema e configuração nativa. |
| AR-057 | `src/app/page.tsx` | auth | `libs/auth/src/screens/page.tsx.tsx + apps/fgc-{web,mobile}` | adaptar | Registrar rota em cada shell; ajustar Judging e horários às decisões atuais. |
| AR-058 | `src/app/pit-admin/page.tsx` | fora do escopo | `referência futura de Pit Admin/anúncios` | adiar | Escopo confirmado: Filming/Judging e dependências; não migrar módulo completo. |
| AR-059 | `src/app/twitter-image.tsx` | shell | `apps/fgc-web + apps/fgc-mobile + libs/ui` | adaptar | Separar layout/metadados/PWA web de assets, tema e configuração nativa. |
| AR-060 | `src/components/admin/add-users-panel.tsx` | admin | `libs/admin/src/components/add-users-panel.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-061 | `src/components/admin/admin-dashboard.tsx` | admin | `libs/admin/src/components/admin-dashboard.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-062 | `src/components/admin/confirm-admin-dialog.tsx` | admin | `libs/admin/src/components/confirm-admin-dialog.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-063 | `src/components/admin/pending-approved-list.tsx` | admin | `libs/admin/src/components/pending-approved-list.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-064 | `src/components/admin/users-list.tsx` | admin | `libs/admin/src/components/users-list.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-065 | `src/components/announcement/recent-announcements-list.tsx` | fora do escopo | `referência futura de Pit Admin/anúncios` | adiar | Escopo confirmado: Filming/Judging e dependências; não migrar módulo completo. |
| AR-066 | `src/components/announcement/send-to-all-button.tsx` | fora do escopo | `referência futura de Pit Admin/anúncios` | adiar | Escopo confirmado: Filming/Judging e dependências; não migrar módulo completo. |
| AR-067 | `src/components/announcement/send-to-all-dialog.tsx` | fora do escopo | `referência futura de Pit Admin/anúncios` | adiar | Escopo confirmado: Filming/Judging e dependências; não migrar módulo completo. |
| AR-068 | `src/components/filming/mark-shot-dialog.tsx` | filming | `libs/filming/src/components/mark-shot-dialog.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-069 | `src/components/filming/shot-list.tsx` | filming | `libs/filming/src/components/shot-list.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-070 | `src/components/filming/step-and-repeat-tracker.tsx` | filming | `libs/filming/src/components/step-and-repeat-tracker.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-071 | `src/components/judges/advisor-dashboard.tsx` | judging | `libs/judging/src/components/advisor-dashboard.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-072 | `src/components/judges/evaluation-dialog.tsx` | judging | `libs/judging/src/components/evaluation-dialog.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-073 | `src/components/judges/judges-tabs.tsx` | judging | `libs/judging/src/components/judges-tabs.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-074 | `src/components/judges/match-list.tsx` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-075 | `src/components/judges/panel-view.tsx` | judging | `libs/judging/src/components/panel-view.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-076 | `src/components/locator/team-map.tsx` | teams | `libs/teams/src/components/team-map.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-077 | `src/components/mentor/code-entry-form.tsx` | mentor | `libs/mentor/src/components/code-entry-form.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-078 | `src/components/mentor/day-picker.tsx` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-079 | `src/components/mentor/filming-view.tsx` | mentor | `libs/mentor/src/components/filming-view.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-080 | `src/components/mentor/home-view.tsx` | mentor | `libs/mentor/src/components/home-view.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-081 | `src/components/mentor/live-refresh.tsx` | mentor | `libs/mentor/src/components/live-refresh.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-082 | `src/components/mentor/matches-view.tsx` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-083 | `src/components/mentor/mentor-announcements-list.tsx` | fora do escopo | `referência futura de Pit Admin/anúncios` | adiar | Escopo confirmado: Filming/Judging e dependências; não migrar módulo completo. |
| AR-084 | `src/components/mentor/mentor-pages-list.tsx` | mentor | `libs/mentor/src/components/mentor-pages-list.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-085 | `src/components/mentor/pull-to-refresh.tsx` | mentor | `libs/mentor/src/components/pull-to-refresh.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-086 | `src/components/mentor/schedule-view.tsx` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-087 | `src/components/mentor/shell.tsx` | mentor | `libs/mentor/src/components/shell.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-088 | `src/components/page-team/page-team-button.tsx` | messaging | `libs/messaging/src/components/page-team-button.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-089 | `src/components/page-team/page-team-dialog.tsx` | messaging | `libs/messaging/src/components/page-team-dialog.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-090 | `src/components/page-team/recent-pages-list.tsx` | messaging | `libs/messaging/src/components/recent-pages-list.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-091 | `src/components/pit-admin/mentor-codes-panel.tsx` | pit-admin | `libs/pit-admin/src/components/mentor-codes-panel.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-092 | `src/components/pit-admin/pit-admin-tabs.tsx` | fora do escopo | `referência futura de Pit Admin/anúncios` | adiar | Escopo confirmado: Filming/Judging e dependências; não migrar módulo completo. |
| AR-093 | `src/components/ui/app-shell.tsx` | ui | `libs/ui/src/components/app-shell.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-094 | `src/components/ui/badge.tsx` | ui | `libs/ui/src/components/badge.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-095 | `src/components/ui/button.tsx` | ui | `libs/ui/src/components/button.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-096 | `src/components/ui/card.tsx` | ui | `libs/ui/src/components/card.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-097 | `src/components/ui/checkbox.tsx` | ui | `libs/ui/src/components/checkbox.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-098 | `src/components/ui/command.tsx` | ui | `libs/ui/src/components/command.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-099 | `src/components/ui/dialog.tsx` | ui | `libs/ui/src/components/dialog.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-100 | `src/components/ui/input-otp.tsx` | ui | `libs/ui/src/components/input-otp.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-101 | `src/components/ui/input.tsx` | ui | `libs/ui/src/components/input.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-102 | `src/components/ui/label.tsx` | ui | `libs/ui/src/components/label.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-103 | `src/components/ui/popover.tsx` | ui | `libs/ui/src/components/popover.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-104 | `src/components/ui/progress.tsx` | ui | `libs/ui/src/components/progress.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-105 | `src/components/ui/separator.tsx` | ui | `libs/ui/src/components/separator.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-106 | `src/components/ui/sonner.tsx` | ui | `libs/ui/src/components/sonner.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-107 | `src/components/ui/table.tsx` | ui | `libs/ui/src/components/table.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-108 | `src/components/ui/tabs.tsx` | ui | `libs/ui/src/components/tabs.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-109 | `src/components/ui/textarea.tsx` | ui | `libs/ui/src/components/textarea.tsx` | adaptar | Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo. |
| AR-110 | `src/lib/admin/actions.ts` | admin | `supabase/functions/_shared/admin/admin/actions.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-111 | `src/lib/admin/approve-emails.ts` | admin | `supabase/functions/_shared/admin/admin/approve-emails.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-112 | `src/lib/announcements/list.ts` | fora do escopo | `referência futura de Pit Admin/anúncios` | adiar | Escopo confirmado: Filming/Judging e dependências; não migrar módulo completo. |
| AR-113 | `src/lib/announcements/presets.ts` | fora do escopo | `referência futura de Pit Admin/anúncios` | adiar | Escopo confirmado: Filming/Judging e dependências; não migrar módulo completo. |
| AR-114 | `src/lib/announcements/send.ts` | fora do escopo | `referência futura de Pit Admin/anúncios` | adiar | Escopo confirmado: Filming/Judging e dependências; não migrar módulo completo. |
| AR-115 | `src/lib/auth.ts` | auth | `libs/auth/src + supabase/functions/_shared/auth` | adaptar | Supabase Auth; separar cliente/servidor; sem bypass admin em Judging; contrato TODO. |
| AR-116 | `src/lib/db.ts` | dados | `supabase/migrations + acesso Supabase tipado` | substituir | Eliminar cliente Prisma; não introduzir Drizzle. |
| AR-117 | `src/lib/events.ts` | shared | `supabase/functions/_shared/shared/events.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-118 | `src/lib/filming/categories.ts` | filming | `supabase/functions/_shared/filming/filming/categories.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-119 | `src/lib/filming/list.ts` | filming | `supabase/functions/_shared/filming/filming/list.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-120 | `src/lib/filming/mark-shot.ts` | filming | `supabase/functions/_shared/filming/filming/mark-shot.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-121 | `src/lib/filming/shot-items.ts` | filming | `supabase/functions/_shared/filming/filming/shot-items.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-122 | `src/lib/filming/team-status.ts` | filming | `supabase/functions/_shared/filming/filming/team-status.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-123 | `src/lib/format.ts` | shared | `libs/shared/src/format.ts` | adaptar | Reutilizar lógica pura após revisar imports e contratos; dependências TODO. |
| AR-124 | `src/lib/geo.ts` | shared | `libs/shared/src/geo.ts` | adaptar | Reutilizar lógica pura após revisar imports e contratos; dependências TODO. |
| AR-125 | `src/lib/judges/advisor-actions.ts` | judging | `supabase/functions/_shared/judging/judges/advisor-actions.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-126 | `src/lib/judges/advisor.ts` | judging | `supabase/functions/_shared/judging/judges/advisor.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-127 | `src/lib/judges/evaluation-actions.ts` | judging | `supabase/functions/_shared/judging/judges/evaluation-actions.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-128 | `src/lib/judges/labels.ts` | judging | `supabase/functions/_shared/judging/judges/labels.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-129 | `src/lib/judges/list.ts` | judging | `supabase/functions/_shared/judging/judges/list.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-130 | `src/lib/judges/match-list.ts` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-131 | `src/lib/labels.ts` | shared | `libs/shared/src/labels.ts` | adaptar | Reutilizar lógica pura após revisar imports e contratos; dependências TODO. |
| AR-132 | `src/lib/mentor/code-format.ts` | mentor | `supabase/functions/_shared/mentor/mentor/code-format.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-133 | `src/lib/mentor/codes.ts` | mentor | `supabase/functions/_shared/mentor/mentor/codes.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-134 | `src/lib/mentor/issue.ts` | mentor | `supabase/functions/_shared/mentor/mentor/issue.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-135 | `src/lib/mentor/list.ts` | mentor | `supabase/functions/_shared/mentor/mentor/list.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-136 | `src/lib/mentor/redeem.ts` | mentor | `supabase/functions/_shared/mentor/mentor/redeem.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-137 | `src/lib/mentor/respond.ts` | mentor | `supabase/functions/_shared/mentor/mentor/respond.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-138 | `src/lib/mentor/session.ts` | mentor | `supabase/functions/_shared/mentor/mentor/session.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-139 | `src/lib/pages/list.ts` | messaging | `supabase/functions/_shared/messaging/pages/list.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-140 | `src/lib/pages/presets.ts` | messaging | `libs/messaging/src/pages/presets.ts` | adaptar | Reutilizar lógica pura após revisar imports e contratos; dependências TODO. |
| AR-141 | `src/lib/pages/queries.ts` | messaging | `supabase/functions/_shared/messaging/pages/queries.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-142 | `src/lib/pages/send.ts` | messaging | `supabase/functions/_shared/messaging/pages/send.ts` | adaptar | Substituir Prisma/Server Actions por SQL/RPC/Edge Function; assinatura final TODO. |
| AR-143 | `src/lib/schedule/matches.ts` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-144 | `src/lib/schedule/sync.ts` | programação | `backlog: libs/schedule; MVP: link externo` | adiar | D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar. |
| AR-145 | `src/lib/supabase/client.ts` | auth | `libs/auth/src + supabase/functions/_shared/auth` | adaptar | Supabase Auth; separar cliente/servidor; sem bypass admin em Judging; contrato TODO. |
| AR-146 | `src/lib/supabase/server.ts` | auth | `libs/auth/src + supabase/functions/_shared/auth` | adaptar | Supabase Auth; separar cliente/servidor; sem bypass admin em Judging; contrato TODO. |
| AR-147 | `src/lib/utils.ts` | shared | `libs/shared/src/utils.ts` | adaptar | Reutilizar lógica pura após revisar imports e contratos; dependências TODO. |
| AR-148 | `src/proxy.ts` | auth | `libs/auth/src/session + shells web/mobile` | substituir | Refresh/cookies Next viram adaptadores por plataforma; contrato TODO. |
| AR-149 | `tsconfig.json` | configuração | `configuração Nx/RN/Supabase equivalente` | substituir | Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual. |
| AR-150 | `vercel.json` | configuração | `configuração Nx/RN/Supabase equivalente` | substituir | Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual. |
