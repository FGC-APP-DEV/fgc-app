# Revisão independente — consistência e cobertura

Data: 18/09/2026. Escopo: ARCHITECTURE-SPINE.md, contratos-tecnicos.md,
PRD.md, permissoes.md e FGC-MVP-DECISOES.md. pendencias.md foi consultado
somente para distinguir dependências conhecidas de lacunas novas.

**Veredito: aprovação documental condicionada a duas precisões de contrato;
não representa fechamento de produto, implementação ou aceite operacional.**
Não há conflito material identificado com D67–D70. As perguntas de produto
P17/P18/P19 continuam abertas de forma explícita, sem resposta presumida.

## Achados que devem ser corrigidos na consolidação

### C01 — Médio: delimitar o bloqueio do ciclo ao domínio de Judging

Evidência: AD-2 abrange CAP-2/CAP-3/CAP-5/CAP-7 e termina com
“nenhuma escrita confirma depois de fechado”. T01 também encerra sua tabela
com essa formulação. AD-7, D65 e RF14 exigem preservar os módulos independentes.

A interpretação literal pode bloquear Filming, importação e entrega de pager
de Filming após encerrar Judging, ou até impedir o descarte automático.
O desenho correto está sugerido no restante dos documentos, mas a invariante
deve dizer expressamente que bloqueia mutações **operacionais pertencentes ao
ciclo de Judging**. Purge autorizado e operações independentes permanecem
permitidos; mensagens de Judging seguem o fechamento do respectivo ciclo.

Tratamento: autofix documental. Não é uma pergunta nova de produto.

### C02 — Médio: materializar a proteção do histórico na exclusão da participação

Evidência: D25 e permissoes.md proíbem remover equipe com histórico de
avaliação. T01 descreve DELETE /judging/participations/:id como “remover apenas
se permitido”, enquanto RF08 não explicita esse caso.

Um implementador pode aplicar apenas estado pendente + ausência atual de
observações e excluir uma equipe que já foi concluída e reaberta sem notas
(conclusão sem notas é permitida por D32). Registrar a pré-condição completa:
pendente, sem observações e sem histórico de avaliação; manter evidência interna
do fato de já ter sido avaliada até o descarte. Adicionar o caso ao critério RF08
e aos testes previstos. O formato físico dessa evidência pode ficar no schema.

Tratamento: autofix de contrato/aceite derivado de D25, sem inventar nova regra.

## Cobertura CAP / RF / decisões

| Capacidade | Requisitos cobertos | Reconciliação |
| --- | --- | --- |
| CAP-1 acesso | RF01/RF16 e D70 | AD-1/2/3/8 + T02/T03 preservam identidade, autorização atual e proibição admin em Judging. Política temporal mentor explicitamente aberta. |
| CAP-2 equipes | RF02–RF04 | Contrato de importação preserva prévia, mapeamento, parcialidade e duplicatas; amostra D34 ainda necessária. |
| CAP-3 Judging | RF05–RF10/RF16 | Autor, painel, líder, transferência, conclusão, cardinalidade D68 e flags D69 compatíveis. Precisar exclusão com histórico conforme C02. |
| CAP-4 programação | RF11 | Placeholder D61, link validado e ausência de API interna preservados. |
| CAP-5 Filming | RF12 | Remissão explícita F01–F05; não há alegação de paridade já testada. Delimitar lock de Judging conforme C01. |
| CAP-6 alertas | RF13 e D70 | Outbox, cron, identidade mentor, permissões e distinção receipt/leitura definidos. Valores de provisionamento e testes nativos continuam externos. |
| CAP-7 encerramento | RF14 | Duas confirmações, auditoria JA, limite fixo e preservação de outros domínios alinhados a D65; cumprimento físico ainda não comprovado. |
| CAP-8 distribuição | RF15 e D67 | Expo Go, dev-client e distribuição separados; regressão web, idiomas, data e orçamento preservados. |

D01–D70 são incorporadas integralmente pelo PRD. As decisões históricas
D52/D53 são corretamente substituídas por D65. D62 tem precedência explícita
sobre permissões administrativas legadas e combinações conflitantes de roles.
RF10 permanece detalhado no PRD e refletido por retry manual/rascunho em T01;
não precisa virar uma nova decisão arquitetural.

## Rubrica good-spine

- **Pontos de divergência:** transporte, autoridade transacional, identidade,
  fronteiras, plataforma, entrega, descarte e ambientes estão tratados.
- **Regras aplicáveis:** ADs possuem Binds/Prevents/Rule; C01 torna precisa a
  fronteira da invariante transacional. C02 evita implementação parcial de D25.
- **Fronteiras adiadas:** respostas e provisionamento estão explicitamente
  identificados. Não permitem implementar silenciosamente uma política temporal
  de mentor ou alegar descarte real.
- **Tecnologia atual:** a spine registra versões e fontes, mas esta revisão não
  repetiu pesquisa externa nem resolução do lockfile. Compatibilidade instalada
  não está comprovada por revisão documental.
- **Brownfield:** diferenças são declaradas como destino, inclusive aposentadoria
  gradual de GraphQL; não se descreve a migração como já executada.
- **Operação:** implantação, ambientes, segredos, readiness, cron, SMTP, logs,
  distribuição e testes estão contemplados; valores organizacionais não inventados.
- **Traceabilidade:** capacidades cobrem RF01–RF16; emissão de códigos de mentor
  está no texto do PRD, embora não possua RF próprio. Numerá-la seria melhoria de
  rastreabilidade, não condição nova de produto.

## Pendências legítimas, distintas dos defeitos do contrato

- P17: quais dados reais migrar e eventual transição.
- P18: expiração dos códigos/sessões e efeito de regenerar sobre sessões ativas.
- P19: evidência técnica permitida após o descarte.
- P01/P03/P04/P11: amostra, acessos, dispositivos e comprovação da retenção;
  não se resolvem apenas escolhendo uma arquitetura.

Esses itens impedem declarar “tudo fechado” operacionalmente, mas não impedem
avançar em implementação isolada com dados sintéticos nos contratos já fechados.
Esta revisão não executou testes nem alterou os documentos principais.

## Rechecagem após decisões D71–D74 — 19/09/2026

**Veredito atualizado: C01 e C02 resolvidos; contratos centrais coerentes com
as novas decisões, com duas correções editoriais residuais. Nenhum novo bloqueador
funcional de produto identificado nesta rechecagem.** Este veredito substitui a
condição anterior sobre C01/C02; não valida código nem provisão de serviços.

Foram relidos contratos-tecnicos.md, ARCHITECTURE-SPINE.md, PRD.md,
supabase-dados-migracao.md e as decisões D71–D74. Os índices pendencias.md e
fechamento.md não foram reavaliados por estarem sendo reconciliados em paralelo.

- **C01 resolvido:** AD-2 e T01 agora delimitam o bloqueio às escritas
  operacionais de Judging e preservam purge, Filming e cadastro global.
- **C02 resolvido:** T01 e RF08 vedam explicitamente remover participação com
  histórico, incluindo concluir e reabrir sem notas. O schema proposto registra
  `participated_history`, cuja semântica deve ser materializada na implementação.
- **D71 consistente:** código conta sete dias da emissão; sessão conta sete dias
  do resgate; sem renovação silenciosa; regeneração revoga sessões e vínculos
  push da versão anterior. T03 explicita atomicidade e validação em cada operação.
- **D72 consistente:** carga restrita a equipes/configuração, sem operação ou
  sessões legadas; Auth novo e concessões preparadas não são cópia de credenciais.
- **D73/D74 consistentes no núcleo:** comprovante sem IDs, conteúdo ou contagens,
  limitado a 30 dias; ciclo e referências são removidos; dados operacionais e
  backups mantêm limite de 24h, sem comprovação presumida.

### Resíduos documentais a corrigir

1. **Baixo — PRD, abertura:** o texto ainda diz “decisões D01–D70”, embora o corpo
   já adote D71–D74. Atualizar para D01–D74 para não limitar a incorporação formal.
2. **Baixo — supabase-dados-migracao.md, bloqueador técnico de 24h:** persiste a
   alternativa “ou submeter uma exceção explícita ao usuário”, imediatamente antes
   de reafirmar D74 sem exceção. Remover a alternativa e manter apenas adequação
   de configuração/estratégia e bloqueio de dados reais até comprovação. A decisão
   já foi dada; esta frase histórica não deve reabrir a mesma escolha.

Não há necessidade de nova pergunta de produto para corrigir esses resíduos.

### Bloqueadores reais de aceite que permanecem

- Comprovação, no ambiente real, de eliminação de Judging e todas as cópias em
  até 24h. Nenhuma atualização documental elimina esse bloqueador.
- Provisionamento informado como ausente: acessos, SMTP, host e dispositivos.
  Isso impede validar login externo, push e distribuição, mas permite desenvolver
  e testar as partes isoladas com dados sintéticos.
- Amostra oficial ainda necessária para confirmar D34. URL ausente tem
  placeholder aprovado e não bloqueia a implementação desse comportamento.
- Implementação e testes aplicáveis continuam não executados por esta revisão.

P17/P18/P19 deixam de ser perguntas abertas nesta rechecagem; foram respondidas
por D71–D73. Requisitos aprovados e evidências de execução são estados distintos.
