# Preparação operacional — 19/09/2026

O usuário confirmou: **todos os acessos, serviços, aparelhos, amostra oficial e
URL listados abaixo ainda faltam**. Isso fecha o levantamento de disponibilidade;
não significa provisionamento realizado. Não enviar senhas/tokens em documentos
ou mensagens. Usar convites de acesso e armazenamento de segredos do ambiente.

## Responsabilidade e comprovação

Responsáveis abaixo são funções necessárias, não pessoas já designadas. A
organização ainda deve atribuir responsáveis nominais; validadores individuais
não são requisito de fechamento funcional (D58).

| Item | Quem providencia | Critério objetivo para concluir | Estado |
| --- | --- | --- | --- |
| Apple Developer/App Store Connect | Organização, titular das contas | Convite aceito com permissão para certificados/distribuição; bundle ID disponível; instalação TestFlight no iPhone de teste | Falta acesso |
| Google Play Console | Organização, titular da conta | Convite aceito; applicationId confirmado; assinatura e canal interno funcionam em Android | Falta acesso |
| Supabase novo (D66) | Organização + responsável técnico | Projeto isolado criado, região/plano registrados, Auth e migrations verificadas, segredos guardados; banco legado intacto | Não disponível |
| SMTP e domínio | Organização + responsável técnico de DNS/e-mail | Remetente autorizado; SPF/DKIM/DMARC; magic link/código chega a e-mails externos no ensaio de volume | Não disponível |
| Web/API HTTPS | Organização + responsável técnico de deploy | Host Node e arquivos web publicados em homologação; proxy `/api`, TLS, health, limites e segredos configurados | Não disponível |
| Expo/EAS | Desenvolvedor + organização | Conta Expo própria; Go iOS com mesma conta no CLI/aparelho; projeto sob proprietário aprovado; nenhuma despesa nova implícita | Não disponível |
| Ambiente de build Android | Responsável técnico | SDK/JDK/CLI compatíveis, build assinada reproduzível e instalada | Não preparado |
| Ambiente de build iOS | Organização + responsável técnico | Mac/Xcode ou EAS disponível dentro do orçamento; imagem/configuração registradas; build instala | Não preparado |
| Android e iPhone | Organização/equipe de testes | Aparelhos compatíveis disponíveis; versões registradas; permissões, links, push e retomada testados | Não disponíveis |
| Amostra oficial | Organização | Arquivo real confirma identificador/nome/país, unicidade e mapeamento; contrato D34 deixa de ser provisório por evidência | Não disponível |
| URL da programação | Organização | URL HTTPS oficial validada em web/mobile; até lá “Schedule coming soon” sem link | Não disponível; placeholder aprovado |
| Monitoramento de falhas | Responsável técnico + organização | Destinatário operacional definido; ensaio de alerta de falha de purge/entrega, sem dados de julgamento | Não preparado |

Preparar configuração pública por ambiente (origens, API_BASE_URL, IDs de app,
owner/project Expo) separada de credenciais servidor. Não usar identificadores
inventados como definitivos de lojas. Conta Expo do desenvolvedor não é
compartilhada com participantes: estes recebem build de distribuição.

## Descarte — bloqueador de aceite, não pergunta de produto

D74 mantém integralmente D65. Não há autorização para reter backups de Judging
por sete dias nem para chamar criptografia de exclusão física. Banco novo e
plano gratuito, isoladamente, não comprovam ausência de cópias do provedor.

Antes de dados reais, obter evidência do ambiente sobre:

| Cópia/superfície | Tratamento exigido |
| --- | --- |
| Schema judging e registros de ciclo | Purge de observações, painéis, vínculos, status, flags, histórico e ciclo |
| Messaging de origem judges | Vincular cycleId; apagar pages/responses, cancelar entregas pendentes e remover outbox/receipts relacionados; preservar Filming |
| Idempotência/auditoria/logs | Remover recibos e metadados ligados ao ciclo; nunca registrar corpo das notas, tokens ou query de login |
| Caches web/mobile | Dados de Judging somente em memória, no-store, sem persistência/analytics/replay; limpar ao perder sessão/acesso/fechar ciclo |
| Push e sistema operacional | Payload genérico sem conteúdo/equipe/ID de julgamento; remover mapeamento deliveryId no servidor; não prometer recolher push já em voo |
| Banco: backups, WAL/PITR, réplicas e snapshots | Evidência de política e eliminação dentro de 24h; restauração não pode reintroduzir dados expirados |
| Storage/exportações/arquivos temporários | Sem exportação de Judging no MVP; se alguma cópia for criada para execução técnica, incluí-la no inventário e purge |
| Comprovante D73 | Somente horário da limpeza, versão da rotina e resultado, até 30 dias; sem outros identificadores/conteúdo/contagens |

Ensaiar com dados sintéticos: fechar ciclo, verificar negativa de acesso e
cancelamento de novas escritas/envios Judging, executar purge com falha/retry,
inspecionar cópias e preservar Filming/contas/equipes. Medir tempo máximo real.
A rotina é planejada para começar em 23h e concluir antes de 24h; resultado de
falha não pode ser registrado como limpeza completa. O comprovante precisa ter
sua própria expiração de 30 dias, inclusive nas cópias controladas.

Se o provedor não permitir comprovar D74, **não liberar Judging com dados reais**.
A ação seguinte é trazer evidência e opções de infraestrutura ao usuário; não
mudar a regra silenciosamente nem apagar o projeto inteiro, pois contas e
outros módulos precisam permanecer. A limitação não impede desenvolver/testar
com dados sintéticos. [Backups Supabase](https://supabase.com/docs/guides/platform/backups).

## Documentação compartilhável

Fonte de edição permanece `contexts/`, conforme as instruções do workspace.
Preparar snapshot completo em `fgc-app/docs/context/`, com fontes históricas,
links relativos e manifesto de hashes. Esse snapshot permite checkout isolado
sem criar uma segunda fonte editável. Atualizações da fonte exigem novo snapshot.
Commit/push/publicação remota são estados distintos: cópia local não prova que
a equipe já recebeu os documentos.

## Liberações

1. **Definições:** D01–D74 e contratos técnicos documentados; não há nova pergunta
   funcional de P15–P19. Amostra ainda valida o formato externo D34.
2. **Implementação isolada:** autorizável por funcionalidade com dados sintéticos;
   schemas/DTOs, migrations, suíte de testes e integração ainda serão construídos.
3. **Teste mobile integrado:** somente após E01–E05 e infraestrutura correspondente.
4. **Dados reais e distribuição:** exigem D74 comprovado, builds assinadas sem Metro,
   contas/aparelhos disponíveis e testes aplicáveis aprovados. Marco até 29/09/2026.
5. **Publicação pública:** depende das lojas e é entrega separada, ainda exigida.

Nenhum item operacional desta lista foi executado nesta revisão documental.
