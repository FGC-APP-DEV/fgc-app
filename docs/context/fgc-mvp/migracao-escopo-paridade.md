# Migração: escopo, destinos e paridade

Fonte: `firstglobal-ops` no commit registrado em [mapa por arquivo](mapa-arquivos.md).
Cobertura estrutural: 150 arquivos, 30 modelos, 2 enums; [símbolos](simbolos-legado.md)
incluem exports, schemas de entrada e chamadas de autorização. Isso é inventário
estático, não prova de funcionamento nem de segurança de todos os caminhos.

Escopo confirmado: Filming integral, Judging adaptado e dependências necessárias.
Pit Admin completo, anúncios, Production e horários integrados não entram por
existirem no legado. Catálogo abaixo prevalece sobre destinos genéricos por arquivo.

## Catálogo funcional e testes de aceite

Todos os testes estão **planejados, não executados**. Cada linha exige teste de
domínio/integração quando há regra ou persistência, e e2e nas superfícies aplicáveis.
Paridade significa preservar comportamento aprovado, não reproduzir defeitos.

| ID | Origem / funcionalidade | Destino e adaptação | Critério/teste de paridade |
| --- | --- | --- | --- |
| M01 | `app/(auth)/sign-in`, `auth/callback`, `lib/auth` — link/código/logout | `libs/auth` e shells; Supabase Auth; contratos por plataforma definidos em T02 | Entrar por link e código, inválido/expirado, sessão expirada e logout; nenhum acesso sem role. |
| M02 | `complete-profile` — nome obrigatório | `libs/auth` perfil | Perfil incompleto é solicitado; autoria usa identidade verificada, não payload. |
| M03 | `app/page`, `proxy`, `layout` — launcher/session refresh | Shells web/mobile | Módulos por role; admin não abre Judging nem por URL/API; refresh não perde anotação silenciosamente. |
| M04 | `lib/admin/actions`, `approve-emails`, componentes admin — aprovar, editar, acrescentar/remover roles em lote | `libs/admin` + função segura Supabase | Pré-aprovado recebe roles ao entrar; operações substituição/acréscimo distintas; autoelevação e admin+Judge/JA bloqueados. |
| M05 | `filming/list`, tracker — Step & Repeat, lista, mapa, filtros, cobertura | `libs/filming`, UI/mapa compartilhados | Pending/captured/skipped, busca/continente/status e contagem; mapa do legado mantém conjunto completo e informa filtro. |
| M06 | `filming/mark-shot`, dialog — capturar/pular/notas/reset | SQL transacional + `libs/filming` | Marca autor/hora/notas; reset retorna pending; validar equipe/template/evento; usuário sem role negado. |
| M07 | `filming/categories`, `shot-items`, shot-list — categoria/item, pesquisa, concluir/reabrir/excluir | `libs/filming` + SQL | Categoria nova, título válido, busca, filtros, contagem, toggle e exclusão; IDs de outro evento rejeitados. |
| M08 | `filming/team-status`, mentor/filming-view — checklist por equipe | `libs/mentor` consumindo contrato Filming | Sem marcação equivale pending; só equipe da sessão; não inventar UI de cadastro de templates ausente no legado. |
| M09 | `judges/advisor-actions` — painéis, membros, atribuição/remanejamento | `libs/judging`; reescrever conforme D14–D21/D60 | Líder obrigatório; uma equipe/juiz por painel; transferência revoga leitura antiga; remoções restritas. |
| M10 | `distributeRound1`, `clearRound1Split` — distribuição automática/limpeza coletiva | Não habilitar esses comandos no MVP sem aceite específico; atribuição manual aprovada | Nenhum botão/API destrutivo herdado remove histórico ou contorna líder. Não confundir com encerramento. |
| M11 | `bulkApproveJudges` — JA concede roles | Mover responsabilidade a M04; remover da experiência JA | JA não concede acesso, apenas gerencia juízes habilitados. |
| M12 | `judges/list`, panel-view/evaluation-dialog — notas | `libs/judging` + `judging.team_evaluations` | D68: uma observação por autor/equipe/painel, sem duplicação concorrente. Colegas do painel leem, somente autor edita/exclui pendente/ativa; admin nunca lê; transferência não move notas antigas. |
| M13 | `setAssignmentStatus` — status/flags | Reescrever; estado separado de retirada/sinalização | Só líder conclui com confirmação, mesmo sem notas; líder/JA reabre; todas mutações bloqueadas após conclusão. |
| M14 | Flags/progresso/reabertura/retirada | Complementar legado para D24–D33 | Motivos obrigatórios corretos; retiradas fora do cálculo; reativação restaura estado; zero equipes sem divisão inválida. |
| M15 | AwardKey, candidacies, createAwardPanels/createRound2/setJudgingRound | Fora do MVP D04 | Ausentes das telas/API operacionais; nenhuma coluna de round determina acesso novo. |
| M16 | `pages/send`, presets, PageTeamDialog — pager imediato/agendado | `libs/messaging` + Supabase; origem Filming/Judging | Somente origem autorizada; destinatário correto; presets/mensagem/hora futura; não enviar antes do horário. |
| M17 | `pages/list`, queries, recent-pages — histórico/resposta | Mesmo domínio; revalidar acesso em todas as leituras | Filming/Judging veem somente mensagens autorizadas; limites/paginação; nenhum endpoint sem autorização por confiar no chamador. |
| M18 | `mentor/codes`, issue/list, mentor-codes-panel — gerar/regenerar código | Serviço privado + tela mínima exclusiva do administrador (D70) | Outros papéis negados pela API; armazenar hash, exibir código uma vez, código antigo não resgata; D71: código válido por 7 dias, sessão por 7 dias após resgate; regeneração revoga sessões e vínculos push anteriores. |
| M19 | `mentor/redeem`, session, code-entry — acesso por equipe | Adaptar sessão web/mobile conforme T03/D71 | Código inválido/expirado dá erro genérico; revogação e expiração; sessão A nunca lê equipe B; rate limit no resgate. |
| M20 | `mentor/respond`, pages-list — confirmar pager | SQL atômico + UI mentor | Uma resposta por pager/equipe: concorrência entre dois aparelhos aceita apenas uma; respostas preset; nenhum acesso staff. |
| M21 | Mentor shell/home/pull-refresh/live-refresh | `libs/mentor`; apenas pager e situação Filming necessários | Badge/atualização corretos; offline mostra estado honesto; não carregar abas de anúncios/horários fora do escopo. |
| M22 | `locator/team-map`, geo/labels/format | `libs/ui` + `libs/shared`, compostos pelos shells conforme T04 | Mapa e identificação equivalentes, acessíveis por toque; sem obrigar biblioteca DOM no mobile. |
| M23 | `schedule`, matches-view, schedule-view, cron/sync scripts | Backlog; MVP `libs/schedule` apenas link | Placeholder sem URL; link validado abre site; nenhuma dependência do sync para operar Judging. |
| M24 | Pit Admin, anúncios, AnnouncementRead | Fora do MVP completo; não migrar somente por acoplamento do mentor | Não mostrar módulo extra; separar dependências de código de mentor do painel Pit Admin. |
| M25 | TeamResource, ProductionInterview | Modelos inventariados, ativação adiada | Sem upload/portfolio/produção inventados; preservar origem para evolução. |
| M26 | `components/ui`, CSS, assets/manifest/metadados | Tokens/primitivas RN Web; assets por plataforma | Diálogos/inputs/tabs/mapa funcionam em teclado/toque; imagens legíveis; metadados web não viram dependência RN. |
| M27 | Importação multiformato (novo) | `libs/imports` + leitores/validação Supabase | RF02–RF04: preview/mapeamento, válidos parciais, duplicatas, conflitos, corrupção e repetição sem duplicar. |
| M28 | Encerramento/auditoria/purge (novo) | `judging.cycles`, rotina segura + agendador | Duas confirmações; dashboards vazios; só JA audita até 24h; prazo original não reinicia; purge elimina conteúdo e cópias dentro do limite. |
| M29 | Push nativo (novo) | `libs/notifications` + Expo Push Service, outbox e cron servidor conforme T01 | Mentores recebem apenas pagers da própria equipe; token expirado/rotacionado; permissão negada não trava; sem notas no payload. |
| M30 | Build e lojas (novo) | Expo no mobile, Expo Go para fluxos compatíveis, development builds e distribuição assinada; web preservado (D67) | E01–E06: Go abre nos dois sistemas; build própria valida push/callbacks; build assinada abre sem Metro, testa background/foreground; distribuição de teste e submissão às lojas. |

## Verificação obrigatória por plataforma

Web: sessão, autorização por requisição, acessibilidade e fluxo sem rede.
Android/iOS: mesmos fluxos de negócio, teclado/voltar, retomada do aplicativo,
deep links, sessão segura, permissões e push em aparelhos reais. Exportar relatório
por M-ID com plataforma, versão, resultado e evidência; não aceitar mocks de push
como comprovação de entrega. Testes Nx com passWithNoTests não provam cobertura.

Expo Go é uma etapa de teste rápido, não a comprovação integral de M01/M29/M30.
Registrar também ambiente Go/development build/distribuição em cada evidência.
Ver [plano Expo](expo-desenvolvimento.md).

## Contratos técnicos vigentes

- T01: REST via Express, envelope/paginação/versão/idempotência e SQL transacional definidos em [contratos técnicos](contratos-tecnicos.md).
- T02: identidade Supabase, tokens/cookies por plataforma, callbacks e refresh definidos no mesmo contrato; valores de domínio/SMTP precisam ser provisionados.
- T03: mentor por sessão opaca e vínculo de dispositivo definidos; D71 fixa prazos de 7 dias e revogação na regeneração.
- T04: grafo de pacotes, exports públicos e tags definidos; pacotes novos ainda devem ser gerados e validados no código.
- T05: **resolvido em D70/D71** — administrador em tela mínima emite/regenera códigos de mentor; Pit Admin completo fora do escopo. Expiração e invalidação de sessões definidas em T03.

O mapa por arquivo segue os contratos acima e o grafo T04. Materializar schemas/DTOs/testes
antes de publicar cada operação. Dependências externas bloqueiam somente
o comportamento que depende delas; nenhum plano autoriza migração de dados reais.

## Referência obrigatória de interface

Aplicar [design-system.md](../design-system.md) à versão final do MVP em web, Android e iOS, através de @fgc/ui. Preservar identidade visual e adaptar as primitivas à plataforma. Fluxos, permissões e estados seguem D01–D74 e T01–T05; a referência visual não acrescenta funcionalidades. Validar acessibilidade, responsividade e estados assíncronos nos fluxos aprovados.
