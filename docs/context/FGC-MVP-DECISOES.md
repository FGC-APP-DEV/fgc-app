# FGC App — decisões de consolidação do MVP

Contrato de decisões vigente. Registra confirmações do usuário na conversa vinculada ao
[card de consolidação](https://trello.com/c/0bqU0KV7). As decisões abaixo governam a migração; não comprovam implementação das funcionalidades.

## Fontes iniciais lidas

- [Conceitos e tarefas](APP-FGC-TODOS-AND-CONCEPTS.md): restrições, backlog e documentação esperada.
- [Reunião com Greg](FGC_Operations_App_Meeting_Summary_Aug31.md): MVP, responsabilidades e riscos operacionais.
- [Módulo de juízes](JUDGES-MODULE.md): visão ampla de funcionalidades e permissões; não equivale ao escopo aprovado do MVP.

O índice vigente está em [fgc-mvp/README.md](fgc-mvp/README.md). A interface final segue [design-system.md](design-system.md), aprovado como referência obrigatória em 19/09/2026.

## Decisões confirmadas pelo usuário

| ID | Decisão |
| --- | --- |
| D01 | Entregar um MVP enxuto para validar na competição, priorizando Filming e Judging, simplicidade, confiabilidade e pouco treinamento. |
| D02 | Judging inclui acesso do juiz ao próprio painel e às equipes atribuídas, consulta de informações das equipes, observações e acompanhamento das equipes avaliadas. |
| D03 | JA organiza os painéis, distribui juízes e equipes e acompanha o progresso. As permissões separam Judge, JA e Pit Admin. |
| D04 | Notas por prêmio, indicações e segunda rodada de avaliação ficam fora do MVP, conforme aceitação do recorte inicial. |
| D05 | No MVP, a programação será consultada por link para o site oficial. A fonte definitiva ainda precisa ser definida. |
| D06 | A melhoria posterior exibirá horários dentro do app e permitirá filtrar por equipe. A integração deve ficar desacoplada para facilitar a adoção de uma API futura. |
| D07 | Manter um placeholder para a URL oficial e destacar a necessidade de adicioná-la posteriormente. |
| D08 | O administrador concede os acessos e atribui as roles de cada usuário. |
| D09 | Juízes podem consultar as observações dos demais juízes do próprio painel. JA pode consultar as de todos os painéis. |
| D10 | Cada juiz pode editar e excluir somente as próprias observações. |
| D11 | O status de avaliação de uma equipe é único por painel, não individual por juiz. |
| D12 | Somente o líder do painel pode marcar uma equipe como avaliada. |
| D13 | Tanto o líder quanto o JA podem devolver uma equipe ao status pendente. |
| D14 | O JA deve obrigatoriamente atribuir um líder para que o painel seja criado. |
| D15 | O líder é um dos juízes integrantes do painel, escolhido pelo JA, e mantém as permissões normais de juiz. |
| D16 | No MVP, cada juiz pode participar de apenas um painel por vez. |
| D17 | No MVP, cada equipe fica vinculada a apenas um painel por vez. |
| D18 | Somente o JA pode substituir o líder, escolhendo outro juiz integrante do mesmo painel. O líder atual só pode ser removido ou transferido após a substituição, garantindo que o painel não fique sem líder. |
| D19 | Ao ser transferido, o juiz perde acesso ao painel original e passa a acessar somente o novo painel. Suas observações permanecem no painel original. A autoria não preserva acesso para consultar, editar ou excluir essas observações após a transferência. |
| D20 | No MVP, somente o JA pode transferir equipes entre painéis. A transferência é permitida apenas enquanto a equipe estiver pendente e sem observações registradas. |
| D21 | Somente o JA pode excluir um painel, desde que ele não contenha equipes nem observações. Após a exclusão, seus juízes ficam disponíveis para nova atribuição. |
| D22 | O cadastro inicial das equipes partirá de uma lista oficial importada. A importação deve aceitar múltiplos formatos, incluindo `.xlsx`, `.csv`, `.txt` e `.json`. Estruturas e limites dos quatro formatos definidos em T01; formatos adicionais fora do MVP. |
| D23 | O administrador realiza a importação da lista oficial. A aplicação mantém esse cadastro compartilhado para acesso pelos demais módulos. |
| D24 | Após a importação, o JA pode incluir, excluir e sinalizar equipes apenas no escopo do módulo de juízes. Incluir significa selecionar uma equipe já existente no cadastro oficial importado; o JA não cadastra uma nova equipe fora dessa lista. Essas alterações não devem modificar o cadastro compartilhado nem afetar outros módulos. As condições de exclusão estão em D25; sinalizações definidas em D26–D29/D69. |
| D25 | O JA pode remover uma equipe do módulo de juízes apenas se ela estiver pendente e sem observações. Se já houver histórico de avaliação, ele deve ser preservado e a equipe deve ser sinalizada como retirada da avaliação, em vez de removida. O cadastro compartilhado permanece intacto. |
| D26 | No MVP, o JA pode sinalizar equipes como “ausente”, “entrevista online” ou “outro impedimento”, com um campo para explicar o motivo. O motivo é obrigatório para “outro impedimento” e “retirada da avaliação”, e opcional para “ausente” e “entrevista online”. |
| D27 | As sinalizações “ausente”, “entrevista online” e “outro impedimento” são informativas e não bloqueiam a avaliação. “Retirada da avaliação” impede novas observações e a conclusão da avaliação, preservando o histórico existente. |
| D28 | Somente o JA pode reativar uma equipe retirada da avaliação. A reativação preserva as observações e restaura o status de avaliação anterior à retirada. |
| D29 | O progresso da avaliação é calculado como equipes ativas avaliadas / total de equipes ativas. Equipes retiradas ficam fora do numerador e do denominador, são contadas separadamente e não aparecem como avaliações pendentes. |
| D30 | Todos os juízes do painel podem consultar as observações. O autor só pode editar ou excluir as próprias observações enquanto a equipe estiver pendente e ativa, respeitando o acesso ao painel (D19). Após a conclusão, o líder ou o JA precisa reabrir a avaliação para permitir essas alterações. |
| D31 | Toda tentativa de marcar a avaliação de uma equipe como concluída deve exibir um aviso e solicitar confirmação explícita do líder antes de alterar o status. Cancelar mantém o status inalterado. A confirmação é exigida também ao concluir novamente uma avaliação reaberta. |
| D32 | O líder pode concluir a avaliação de uma equipe sem observações registradas. A confirmação obrigatória de D31 continua sendo exigida. |
| D33 | Após a conclusão, novas observações ficam bloqueadas. O líder ou o JA deve reabrir a avaliação antes que os juízes possam adicionar observações, respeitando também a exigência de equipe ativa e o acesso ao painel. |
| D34 | Adotar provisoriamente identificador oficial, nome e país como campos obrigatórios da importação de equipes. O usuário ainda não conhece a estrutura da lista oficial; esses campos e sua obrigatoriedade precisam ser verificados com uma amostra real antes de fechar o contrato de importação. Não tratar essa proposta como formato oficial confirmado. |
| D35 | Antes de gravar a importação, o administrador deve visualizar uma prévia dos dados e dos erros encontrados e confirmar a operação. |
| D36 | A implementação da importação deve conter validações e tratamento de erros, mantendo o restante da aplicação utilizável quando um arquivo não puder ser processado. Exibir informações pertinentes e erros compreensíveis, com localização (linha, campo ou registro) quando identificável e orientação de correção. Validar o conteúdo e a estrutura, além da extensão, e tratar arquivos vazios, corrompidos, formatos não suportados e falhas de leitura ou gravação sem erro não tratado na interface nem indicação falsa de sucesso. |
| D37 | Permitir a importação dos registros válidos mesmo quando houver registros inválidos. A prévia deve distinguir os registros aptos dos rejeitados antes da confirmação. Ao final, informar quais registros foram efetivamente importados e quais ficaram de fora, com o motivo e a localização no arquivo quando identificável, para permitir sua correção. Não apresentar a importação parcial como sucesso integral. |
| D38 | Em reimportações, equipes cujo identificador já esteja cadastrado não devem ser duplicadas nem alteradas automaticamente. Esses registros devem aparecer como “já cadastrados” no resultado. A definição do identificador depende da validação da lista oficial prevista em D34. |
| D39 | Quando um identificador se repetir no mesmo arquivo com dados iguais, importar a equipe uma única vez, respeitando D38. Quando os dados forem diferentes, separar todos os registros conflitantes desse identificador para correção, sem escolher um deles automaticamente, e importar os demais registros válidos. Informar as repetições e os conflitos na prévia e no resultado. |
| D40 | A importação deve permitir que o administrador associe os campos do arquivo aos campos da aplicação, com sugestões automáticas quando possível. O mapeamento deve ocorrer antes da validação dos registros e da prévia para confirmação da gravação. Sugestões não dispensam a revisão pelo administrador. |
| D41 | Pular neste momento as perguntas de definição funcional de Filming. Trazer integralmente as funcionalidades existentes desse módulo no app `firstglobal-ops`, inventariando a implementação como fonte para a especificação e a verificação de paridade. Essa orientação sobre Filming não substitui as decisões específicas já confirmadas para Judging. |
| D42 | O MVP deve estar disponível nas três plataformas: web, Android e iOS. |
| D43 | Os aplicativos Android e iOS devem ser publicados nas respectivas lojas como parte da entrega do MVP. A organização já possui as contas, mas a equipe ainda não tem acesso. Obter os acessos necessários à publicação é uma dependência pendente; responsáveis e prazos ainda precisam ser definidos. |
| D44 | Os aplicativos móveis devem utilizar recursos nativos dos aparelhos, incluindo notificações, vibração e sons. O usuário relaciona a entrega móvel publicada nas lojas à necessidade desses recursos. Os eventos que os acionam, permissões, preferências e comportamento em segundo plano ainda precisam ser especificados. |
| D45 | Partir dos alertas já existentes no `firstglobal-ops` para definir as notificações do MVP e mapear sua adaptação para notificações, vibração e sons nativos. O inventário deve identificar eventos, destinatários e comportamento atual, conciliando-os com o escopo e as permissões aprovados para o MVP. Os alertas concretos ainda não foram verificados na implementação. |
| D46 | O MVP exige conexão para consultar e registrar dados. Manter o fluxo simples, sem trabalho offline com sincronização posterior e minimizando dependências de operações em segundo plano que possam afetar as funcionalidades. Isso não elimina a natureza assíncrona das requisições de rede. |
| D47 | Se não houver conexão para salvar uma anotação, exibir um aviso claro de que ela não foi salva. A interface só deve indicar sucesso após confirmação da gravação; não pressupor que a anotação será sincronizada posteriormente. |
| D48 | Após uma falha de salvamento, manter o texto digitado na tela e permitir uma nova tentativa manual. Não realizar envio automático em segundo plano. Essa regra não implica persistência local do rascunho após fechar ou recarregar o aplicativo. |
| D49 | Ao tentar sair da tela de anotações com alterações não salvas, solicitar confirmação, oferecendo continuar editando ou descartar as alterações. Isso abrange a navegação controlada pelo aplicativo; não garante interceptar encerramento forçado pelo sistema nem persistência após fechamento ou recarga. |
| D50 | O MVP terá interface somente em inglês, com estrutura preparada para adicionar espanhol, francês e árabe posteriormente. As traduções adicionais não fazem parte da entrega inicial. |
| D51 | Não contratar serviços pagos nem gerar novas despesas sem aprovação prévia da organização. Essa restrição deve orientar as escolhas de infraestrutura, integrações, builds e distribuição do MVP. |
| D52 | Substituída por D65/D74; aplicar exclusivamente o contrato vigente de encerramento e descarte. |
| D53 | Substituída por D65/D74; comprovante técnico limitado por D73. |
| D54 | As contas dos usuários e suas roles Judge/JA permanecem após a limpeza dos dados de Judging. O administrador continua responsável por alterar os acessos quando necessário. |
| D55 | A exclusão definitiva dos dados de Judging pelo JA exige duas confirmações explícitas e consecutivas antes de iniciar qualquer deleção. Os avisos devem esclarecer o escopo e a irreversibilidade da operação. Cancelar qualquer uma das etapas não deve excluir dados. O objetivo é evitar exclusão acidental antes do encerramento da competição. |
| D56 | O MVP atende uma única competição por vez. Não há requisito de operação simultânea de múltiplas competições nesta versão. |
| D57 | A competição-alvo é o FIRST GLOBAL Challenge, de 4 a 10 de outubro de 2026, conforme informado pelo usuário. O MVP deve estar pronto antes de 30 de setembro de 2026 para testes (ou seja, até 29 de setembro). A distribuição de testes dos aplicativos móveis atende a esse marco; a publicação pública nas lojas continua sendo uma entrega exigida e deve ocorrer o quanto antes. |
| D58 | O aplicativo será testado por várias pessoas. Não exigir a definição nominal dos validadores nem uma divisão de aprovação por módulo nesta etapa. Preparar critérios de aceite e roteiros de teste que possam ser executados pelos participantes. |
| D59 | Reaproveitar a autenticação existente no `firstglobal-ops`, verificando sua implementação e corrigindo eventuais falhas na migração. Login com contas Google (SSO) fica como evolução posterior, fora do MVP. Todo acesso continua dependendo das roles concedidas pelo administrador (D08). |
| D60 | Somente o JA pode transferir juízes entre painéis, respeitando um painel por juiz e a substituição obrigatória do líder antes de sua transferência. |
| D61 | Enquanto a URL oficial da programação não estiver configurada, mostrar “Programação em breve”, sem link ativo. Como a interface do MVP é em inglês (D50), usar texto equivalente em inglês. |
| D62 | O administrador pode cadastrar/habilitar juízes e JAs e gerenciar seus acessos, mas não pode consultar anotações ou avaliações nem executar as funções de Judge, líder ou JA. A importação do cadastro compartilhado continua permitida (D23). Não há bypass administrativo em Judging; atribuição de roles não pode ser usada para contornar essa proibição. Esta decisão substitui a proposta de permitir acesso administrativo mediante role adicional. |

| D63 | Migração restrita a Filming, Judging e dependências necessárias. Pit Admin, anúncios e demais módulos não entram integralmente. Mentores entram como destinatários dos alertas/pager e nos fluxos necessários de Filming. |
| D64 | Supabase é a persistência definitiva. Não exigir compatibilidade Prisma/Drizzle. Contratos de API, autenticação web/mobile e dependências entre pacotes definidos em T01–T04 de fgc-mvp/contratos-tecnicos.md. |
| D65 | O JA encerra Judging mediante duas confirmações. Os dashboards operacionais ficam vazios; somente o JA pode consultar a auditoria temporária. Todos os dados de Judging e suas cópias devem ser eliminados permanentemente até 24 horas após o encerramento. Contas, roles, cadastro global e dados independentes de outros módulos permanecem. O prazo é fixo, não renovável por consulta ou retry. A configuração de backups/logs ainda precisa comprovar esse limite. Esta decisão substitui a ausência de retenção imediata de D52/D53. As duas confirmações de D55 antecedem o encerramento; o descarte automático no prazo não exige novas confirmações. O administrador continua proibido de acessar o conteúdo. |

| D66 | Criar projeto Supabase novo para o fgc-app. Reaproveitar schemas, relacionamentos e detalhes do firstglobal-ops como referência, adaptando-os ao escopo e às regras aprovadas. Não implica copiar dados reais, sessões, credenciais ou permissões administrativas antigas. |

| D67 | Adotar Expo no mobile e Expo Go para facilitar testes rápidos de telas e fluxos compatíveis em Android/iOS, conforme solicitação de 18/09/2026. Usar development build própria para recursos nativos que o Expo Go não suporta, incluindo push remoto e App/Universal Links, e builds de distribuição para aceite final. Preservar Nx, bibliotecas compartilhadas e a aplicação web existente. Substitui a orientação anterior de Expo apenas opcional; não aprova despesas EAS nem comprova compatibilidade ou implementação. SDK, atualização de React/RN e configuração de builds serão validados tecnicamente. |
| D68 | Uma única observação editável por juiz/equipe/painel, confirmada em 18/09/2026. Não criar uma lista de observações separadas do mesmo autor nesse vínculo. Permanecem as restrições de autoria, painel atual, equipe ativa/pendente e ciclo de Judging, inclusive bloqueio após conclusão e perda de acesso após transferência. |
| D69 | Uma equipe pode ter várias sinalizações informativas simultâneas. A retirada da avaliação permanece um estado separado; motivos obrigatórios e efeitos seguem D26–D29. |
| D70 | Somente o administrador emite e regenera códigos de acesso dos mentores, em tela mínima própria. Não migrar o módulo completo de Pit Admin nem conceder acesso administrativo a Judging. A política de expiração e o efeito da regeneração sobre sessões existentes ainda precisam ser definidos. |
| D71 | Confirmado em 19/09/2026: código de mentor expira 7 dias após emissão; cada sessão expira 7 dias após resgate, sem renovação silenciosa. Regenerar o código invalida o anterior e revoga todas as sessões vinculadas à versão anterior, incluindo seus vínculos de push. A expiração do código impede novos resgates; a sessão existente segue seu próprio prazo, salvo regeneração/revogação. Complementa D70. |
| D72 | Iniciar o Supabase novo apenas com equipes e configuração. Operação de Filming, pager e Judging começa limpa. Não copiar capturas, mensagens, observações, painéis, vínculos operacionais, sessões ou históricos reais do legado. Configuração abrange evento, templates/categorias estáticas e concessões iniciais de acesso explicitamente preparadas; usuários entram pelo Auth novo. |
| D73 | Após o descarte, manter por no máximo 30 dias apenas comprovante técnico com horário da limpeza, versão da rotina e resultado. Sem pessoas/equipes, conteúdo, contagens, identificadores do julgamento ou histórico. Apagar também o comprovante ao fim do prazo. É exceção restrita ao comprovante; não autoriza reter qualquer dado operacional. |
| D74 | A exigência D65 de eliminar Judging, backups e cópias em até 24h permanece integralmente, sem exceção de retenção para backups. Política confirmada em 19/09/2026; comprovação técnica no ambiente real continua obrigatória antes de usar dados reais sob essa garantia. |

A solicitação de tolerância a “qualquer formato” orienta a robustez e a extensão
da importação. O suporte confirmado continua sendo `.xlsx`, `.csv`, `.txt` e
`.json` (D22), sujeito à definição das estruturas aceitas. Formatos adicionais
precisam de suporte de leitura específico; não há garantia de interpretar
automaticamente qualquer arquivo. Um formato não suportado deve ser informado
ao administrador com orientação sobre os formatos aceitos, sem interromper o app.
A importação parcial está definida em D37, a reimportação de equipes já
cadastradas em D38 e o tratamento de identificadores repetidos no mesmo arquivo
em D39.

## Pendência destacada: programação oficial

**URL oficial: A DEFINIR — adicionar e validar posteriormente, antes de disponibilizar a consulta aos usuários.**

A interface sem link ativo e com indicação de programação em breve foi
confirmada em D61; o texto exibido deve seguir o idioma inglês do MVP.
A API futura pode exigir adaptação de dados e autenticação, além da configuração
do endpoint. O contrato técnico está definido em fgc-mvp/contratos-tecnicos.md.


## Execução e validação

Decisões funcionais e contratos T01–T05 estão fechados. A amostra oficial valida D34 antes da carga real. Provisionamento, implementação e comprovações são acompanhados em [pendências](fgc-mvp/pendencias.md); não reabrir decisões resolvidas.
