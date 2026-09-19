# PRD — MVP FGC App

Status: requisitos consolidados; execução e validação do aplicativo pendentes.
Todas as [decisões D01–D74](../FGC-MVP-DECISOES.md) integram este PRD.
As datas são requisitos informados pelo usuário, não validação do calendário externo.

## Requisitos e critérios de aceite

| ID | Requisito e fonte | Critério verificável |
| --- | --- | --- |
| RF01 | Login legado; roles só pelo administrador; Google posterior. D08, D59 | Magic link e código funcionam; usuário sem role não acessa módulos; login não concede privilégios por conta própria. |
| RF02 | Cadastro compartilhado via importação pelo administrador. D22–D24, D34–D40 | XLSX, CSV, TXT e JSON nas estruturas documentadas são lidos, mapeados e apresentados em prévia antes de qualquer gravação. Campos provisórios: identificador, nome e país. |
| RF03 | Importação parcial e erros úteis. D35–D39 | Válidos são gravados após confirmação; inválidos e não importados aparecem com motivo/localização. Arquivo vazio, ilegível ou não suportado não derruba o app. |
| RF04 | Duplicidades. D38–D39 | Identificador existente não é alterado; duplicatas idênticas do arquivo viram uma equipe; todos os registros de um identificador conflitante ficam para correção. |
| RF05 | Painéis e líder obrigatório. D03, D14–D21, D60 | Criação sem líder é recusada; juiz/equipe não ficam em dois painéis; remover líder sem substituição é recusado; transferência retira acesso antigo. |
| RF06 | Observações. D09–D10, D19, D30, D33, D68 | Uma observação editável por juiz/equipe/painel; gravações concorrentes não criam duplicatas. Juiz lê o painel atual, JA lê todos; só autor edita/exclui enquanto equipe ativa e pendente. Concluída bloqueia criação/edição/exclusão. |
| RF07 | Conclusão/reabertura. D11–D13, D31–D32 | Apenas líder conclui, inclusive sem notas; sempre há confirmação; cancelar não altera estado. Líder/JA reabrem. Testar requisição direta sem permissão. |
| RF08 | Equipes no módulo e sinalizações. D24–D28, D69 | JA inclui apenas equipes importadas; só remove pendente, sem observações e sem histórico de avaliação. Concluir/reabrir sem notas não libera remoção. Várias sinalizações informativas simultâneas são permitidas; ausente/online/outro não bloqueiam avaliação. Outro e retirada exigem motivo. Retirada é estado separado, bloqueia observações/conclusão; reativação preserva status e notas. |
| RF09 | Progresso. D29 | Numerador só inclui ativas avaliadas; denominador só ativas; retiradas aparecem separadamente. Com zero ativas, apresentar contagem zero sem divisão inválida. |
| RF10 | Sem perda silenciosa de texto. D46–D49 | Sem rede, aviso e texto mantido na tela; tentativa manual; nenhum sucesso antes da confirmação do servidor; saída com alterações solicita continuar/descartar. |
| RF11 | Programação externa provisória. D05–D07, D61 | Sem URL, mensagem em inglês e nenhum link ativo; com URL validada, abrir site. API interna/filtro por equipe ficam para evolução. |
| RF12 | Filming completo do legado. D41 | Executar todos os fluxos F01–F05 do inventário em web e mobile, preservando dados e autorização; registrar paridade e diferenças. |
| RF13 | Alertas móveis. D44–D45 | Para cada evento/destinatário aprovado do legado, verificar notificação, som e vibração conforme permissões do aparelho; negar permissão não bloqueia o uso do módulo. Não confundir gravação com entrega ao aparelho. |
| RF14 | Encerramento e auditoria temporária. D54–D55, D65 | Duas confirmações do JA; cancelamento preserva os dados. Dashboards operacionais vazios; auditoria só pelo JA até o prazo fixo de 24h. Expirado o prazo, exclusão permanente de banco, backups, logs e cópias, com evidências. Preservar contas/roles, cadastro global e outros módulos. Não declarar conclusão integral sem comprovar o descarte. |
| RF15 | Distribuição e operação. D42–D43, D50–D51, D56–D58 | Web/Android/iOS disponíveis para teste até 29/09/2026, em inglês, uma competição; publicação pública priorizada e sem novos gastos não aprovados. |

## Fluxos principais

RF16 — Separação administrativa (D62): administrador cadastra/habilita juízes e
JAs e importa equipes, mas não consulta anotações/avaliações nem executa funções
de Judge, líder ou JA. Critério de aceite: tentativas pela interface e diretamente
pela API são negadas sem exposição de conteúdo. Testar também roles conflitantes
e autoatribuição de acesso; não permitir contornar a proibição. Este critério se
aplica junto a RF01 e à matriz de permissões.

Emissão/regeneração dos códigos necessários ao acesso de mentores: somente o
administrador em tela mínima (D70/M18), com negação pela API para outros papéis.
Não ampliar o escopo para Pit Admin. D71 fixa código em 7 dias desde emissão,
sessão em 7 dias desde resgate e regeneração revogando sessões/vínculos push
anteriores. Testar os limites pelo relógio do servidor e múltiplos aparelhos.

Carga inicial D72: equipes/configuração, sem operação legada. D73 permite
comprovante técnico mínimo por 30 dias após limpeza; D74 mantém 24h para dados
operacionais e backups/cópias. Testar separação do comprovante e sua expiração;
não usar evidência agregada para preservar qualquer histórico de julgamento.

1. Administrador entra, concede roles, escolhe arquivo, mapeia campos, revisa prévia,
   confirma válidos e recebe relação de importados/rejeitados/já cadastrados.
2. JA inclui equipes no módulo, cria painel com líder e atribui juízes/equipes.
3. Juiz consulta seu painel e equipes, registra observação e salva explicitamente.
   Falha mantém texto; sucesso só após resposta confirmada. Transferência invalida acesso antigo.
4. Líder confirma conclusão; equipe vira avaliada para todo o painel. Líder ou JA
   pode reabrir. Sinalização informativa não altera esse estado.
5. JA retira/reativa equipes conforme regras e acompanha progresso sem contar retiradas.
6. Ao final, JA passa por duas confirmações de limpeza. Aplicativo só informa
   conclusão quando a operação terminou; se falhar, mostra erro e estado real.

## Não objetivos

Notas por prêmio, indicações, segunda rodada, IA, trabalho offline, Google SSO,
traduções adicionais, horários integrados e competições simultâneas. Visão ampla
do documento histórico de juízes não reintroduz esses itens no MVP.

## Roteiro de validação

Executar RF01–RF16 com contas distintas de admin, JA, líder e dois juízes em
painéis diferentes. Incluir tentativas negadas, transferência, duas sessões
simultâneas, perda de conexão, retorno à tela, importação mista, repetição da
importação e cancelamento de cada confirmação destrutiva. Repetir os fluxos
críticos em web, Android e iOS; push requer aparelhos e credenciais de teste.

Usar dados sintéticos para testar a limpeza. Os testes automatizados de regras,
API e e2e devem existir e passar antes de PR de implementação. Este trabalho
documental não executou nem aprovou o aplicativo.

Conforme D67, usar Expo Go para testes rápidos dos fluxos compatíveis em Android
e iPhone. RF01 com callbacks nativos e RF13 com push remoto exigem development
build própria; RF15 exige distribuição de builds assinadas e validação sem Metro.
Expo Go não substitui esses critérios. Executar também E01–E06 do
[plano Expo](expo-desenvolvimento.md), incluindo regressão web após atualizar dependências.
