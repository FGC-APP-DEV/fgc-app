# Supabase — proposta de dados e estratégia de migração

Decisão do usuário: Supabase como persistência definitiva, sem Prisma/Drizzle no
destino. Supabase utiliza PostgreSQL; migrations passam a ser SQL versionado e
tipos TypeScript gerados. Nenhum SQL foi executado nesta tarefa.

## Schemas propostos

| Schema | Responsabilidade e tabelas | Acesso |
| --- | --- | --- |
| `api` | Funções SQL públicas de leitura/comando, sem tabelas operacionais | Único schema exposto pela Data API; grants e verificação conforme T01. |
| `auth` | Identidades geridas pelo Supabase Auth | Não recriar tabelas internas manualmente. |
| `core` | events, users (FK auth.users), roles, user_event_roles, approved_emails, approved_email_roles, teams, team_pit_locations, import_runs/import_results | RLS por ação; admin gerencia usuários/importações; consumidores recebem somente campos necessários. |
| `judging` | cycles, judge_panels, panel_members, team_participations, panel_team_assignments, team_evaluations, team_flags | Admin explicitamente negado; juiz/painel e JA segundo matriz; ciclo fechado muda acesso para auditoria temporária exclusiva do JA. |
| `filming` | filming_categories, filming_shot_items, team_shot_templates, team_shots | Filmmaker; mentor só projeção da própria equipe, sem dados internos desnecessários. |
| `messaging` | pages, page_responses | Origem autorizada e destinatário/equipe; sem abertura global por ser tabela compartilhada. |
| `private` | mentor_codes, mentor_sessions, push_devices, notification_deliveries, migration_id_map | Sem exposição direta aos clientes. Código/token/credencial não aparece em logs. |
| `audit` | audit_log e evidência técnica de encerramento | Acesso restrito; não vira atalho de leitura para admin; dados Judging obedecem purge de 24h. |

Schemas são fronteiras organizacionais, não substituem grants/RLS. Expor somente
as superfícies necessárias conforme T01 em [contratos técnicos](contratos-tecnicos.md). Supabase permite schemas próprios;
a exposição pela API precisa ser configurada explicitamente. [Documentação](https://supabase.com/docs/guides/api/using-custom-schemas).

## Chaves, relações e constraints propostas

- IDs internos UUID em entidades novas; preservar IDs de origem de configuração
  importada em `private.migration_id_map(source, entity, legacy_id, target_id)` com unicidade.
  Não usar nome/país para relacionar equipes. Identificador oficial como texto
  preserva zeros à esquerda; validar com amostra antes do schema físico final.
- `users.auth_user_id` UUID único; roles atribuídas no banco, nunca a partir
  de user_metadata controlável pelo cliente. Um evento operacional ativo por vez.
- `teams` global; `team_participations(cycle_id, team_id)` define presença em Judging.
  Excluir/retirar essa participação não apaga a equipe global.
- `cycles`: id, event_id, state (active/closed/purged), closed_at, purge_due_at,
  closed_by; prazo de purge = primeiro encerramento confirmado + 24h (UTC).
  D73 permite comprovante por 30 dias com horário, versão da rotina e resultado;
  sem conteúdo, contagens, pessoas/equipes ou IDs de Judging. Remover inclusive
  o registro de ciclo e suas referências; o comprovante não contém cycle_id.
- `judge_panels`: cycle_id, name, leader_user_id obrigatório. FK composta
  diferida ou trigger transacional assegura que o líder é membro. Criar painel,
  membro e líder em uma transação; impedir mudanças isoladas inconsistentes.
- `panel_members`: cycle_id, panel_id, user_id; único (cycle_id,user_id).
  FKs compostas garantem que painel/membro pertencem ao mesmo ciclo.
- `panel_team_assignments`: cycle_id, panel_id, team_id, evaluation_state,
  participated_history, evaluated_at, version; único (cycle_id,team_id).
  Separar retirada em participação e flag em tabela própria. Sem round/award.
- `team_evaluations`: cycle_id, panel_id, team_id, author_id, notes, timestamps,
  version. Preservar autoria/painel após transferência do juiz. D68 confirma uma
  anotação editável por autor/equipe/painel. Proposta técnica: unicidade em
  (cycle_id, panel_id, team_id, author_id), com escrita atômica e controle de versão
  para impedir duplicação e sobrescrita silenciosa por sessões concorrentes.
- Flags: tipo, motivo, equipe/ciclo, autor/hora; outro impedimento/retirada exige
  motivo. D69 confirma múltiplas sinalizações informativas simultâneas;
  retirada é estado separado da participação.
- Códigos de mentor: somente administrador emite/regenera (D70); tela mínima
  sem acesso a Judging. D71: código 7 dias desde emissão, sessão 7 dias desde
  resgate; regenerar incrementa versão e revoga sessões/dispositivos anteriores.
- Filming mantém relações/constraints do [extrato de modelos](modelos-legado.md),
  reforçando evento coerente entre template, captura e equipe. timestamps UTC.
- Pager: FK equipe/evento/origem, scheduled_for, expires_at e chave idempotente;
  page_responses com UNIQUE(page_id) implementa primeira resposta por equipe,
  sem corrida read-then-write. Sessão deve corresponder ao destinatário.
- push_devices vincula token protegido à sessão mentor/equipe; entrega possui
  chave única mensagem/dispositivo e tentativas limitadas. Expo Push Service é o
  adaptador escolhido; payload externo genérico e outbox conforme T01.

Modelos de awards/round 2, anúncios completos, Production e horários integrados
ficam fora do schema operacional inicial; todos estão mapeados como referência.

## Segurança e limites reais

RLS precisa considerar role atual, autoria, vínculo, ciclo ativo e prazo de auditoria.
Nenhum filtro somente no cliente. Cliente com chave pública só usa políticas
autorizadas; segredos/service_role ficam no servidor. Service role pode ultrapassar
RLS, portanto handlers privilegiados também precisam checar o usuário e a ação.
Admin do aplicativo não é proprietário técnico do projeto Supabase: quem possui
acesso privilegiado ao banco pode ultrapassar essas restrições. Separar essas
credenciais da role administrativa da aplicação. [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Encerramento, auditoria de 24h e exclusão

Nova política substitui D52–D53 na parte de exclusão imediata sem retenção.
Após duas confirmações pelo JA, fechar o ciclo em transação; toda consulta
operacional de Judge/JA passa a mostrar estado vazio, sem reexpor esse ciclo.
Auditoria fica em superfície separada, somente JA, somente leitura, até o prazo.
Contas, roles, equipes globais e Filming permanecem.

Job do servidor elimina dados operacionais de Judging antes do prazo; bloquear
leitura por RLS ao expirar mesmo se o job falhar. Bloqueio de leitura NÃO equivale
a exclusão: atraso de purge é falha operacional com alerta e nova tentativa.
Cron + função segura não depende de o JA abrir o app. Planejar início do purge
em closed_at + 23h, reservando até 1h para conclusão/verificação/retry; D65 define
prazo máximo, não garante auditoria disponível durante todas as 24h. Auditoria
fica disponível somente enquanto houver dados dentro desse limite, sem reabertura
do ciclo. Medir latência, volume e falhas; configuração de cron sozinha não comprova
prazo ou descarte físico de cópias. [Agendamento Supabase](https://supabase.com/docs/guides/functions/schedule-functions).

Apagar também mensagens/copias de Judging, anexos se existirem, índices, caches e
dados em logs/exports. Não duplicar conteúdo das notas em logs: registrar apenas
metadados operacionais mínimos durante a janela. Não restaurar conteúdo expirado
a partir de backup; executar purge/verificação em ambiente isolado antes de reabrir.

**Bloqueador técnico do prazo de 24h:** backups gerenciados podem ter retenção
distinta, e backup de banco não inclui objetos do Storage. Verificar plano e
controles do projeto real; não configurar retenção indefinida por silêncio.
Se não for possível eliminar todas as cópias no prazo, a promessa não está
atendida: rever configuração/estratégia antes de dados reais. Não há exceção
de retenção aprovada; D74 mantém a regra. Criptografia/descarte de chave não será apresentado
como exclusão física sem nova decisão. D74 reafirma a exigência sem exceção de
backups. [Backups Supabase](https://supabase.com/docs/guides/platform/backups).

## Migração proposta, em ordem

1. Preparar um projeto Supabase novo (D66), definindo acesso e região/plano dentro do orçamento aprovado. Reaproveitar schema/metadados do legado como referência, adaptando regras e RLS. Não alterar origem nem copiar dados reais implicitamente.
2. Criar migrations SQL aditivas em `fgc-app/supabase/migrations` e fixtures
   sintéticas; separar dev/teste/produção. Nenhum cliente recebe permissões amplas.
3. D72: carregar somente equipes e configuração (evento, templates/categorias e
   concessões iniciais preparadas). Não importar capturas, pager, observações,
   painéis, vínculos operacionais, sessões nem históricos. Validar contagens,
   órfãos, unicidade e valores apenas dos dados aprovados para carga.
4. Criar novo login no Auth do destino; pré-aprovações não equivalem a copiar
   senhas/sessões. Admin emite novos códigos de mentor conforme D70/D71.
5. Verificar que Judging, capturas Filming e pager começam vazios. Não planejar
   freeze/delta operacional do legado: nenhuma carga desse tipo foi aprovada.
   A aplicação anterior permanece intacta como fonte de consulta técnica.
6. Após abertura do destino, recuperação deve preservar suas novas escritas,
   respeitando D65/D74. Jamais restaurar dados Judging expirados para recuperar
   uma versão anterior. Estratégia de backup só é aceita se cumprir esses limites.

## Definições fechadas e evidência pendente

Projeto novo confirmado (D66) e carga inicial limpa (D72). Amostra oficial ainda
precisa confirmar os campos provisórios D34, sem bloquear fixtures sintéticas.
Cardinalidades resolvidas: D68, uma observação por autor/equipe/painel; D69,
várias sinalizações informativas simultâneas. D70 fixa o emissor dos códigos;
expiração e invalidação de sessões estão fechadas em D71.
API, transporte de autenticação e dependências foram definidos em
[contratos técnicos](contratos-tecnicos.md), após pedido de fechar as pendências.
Schema físico/migrations e a garantia sobre cópias ainda exigem implementação e evidência.
