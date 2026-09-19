# Pendências e revisão documental

## Regras fechadas nesta rodada

D59: Google SSO posterior. D60: apenas JA transfere juízes. D26: motivo obrigatório
para outro impedimento/retirada. D61: programação sem URL exibe mensagem em inglês,
sem link ativo. D63 limita a migração; D64 fixa Supabase; D65 substitui a retenção de D52/D53: somente JA audita, descarte definitivo em até 24h.
D67 aprova Expo/Expo Go para o mobile, com development builds e distribuição
assinada para os testes que exigem aplicativo próprio. A escolha da ferramenta
está fechada; a compatibilidade e a implementação permanecem pendentes.
D68 fecha P15: uma observação editável por juiz/equipe/painel.
D69 fecha P16: várias sinalizações simultâneas. D70 resolve a autoridade de T05:
administrador em tela mínima; D71 define expiração e invalidação das sessões.

Atualização de 19/09: D71 fecha validade/regeneração de mentor; D72 fecha carga
inicial limpa; D73 fecha comprovante de limpeza; D74 reafirma backups/cópias em
24h sem exceção. O adiamento de T01–T04 foi revisto: contratos definidos em
[contratos técnicos](contratos-tecnicos.md), com revisão independente.

## Dependências e conflitos

| ID | Ponto | Próxima ação / impacto |
| --- | --- | --- |
| P01 | Cadastro oficial desconhecido | Obter amostra e validar identificador/nome/país e compatibilidade com leitores e limites já definidos em T01. Campos são provisórios, não fato oficial. |
| P02 | URL de programação ausente | Adicionar e validar; até lá manter placeholder. API encontrada no legado não é fonte aprovada para integração. |
| P03 | Provisionamento pendente | Usuário confirmou em 19/09 que falta acesso Apple/Google; organização precisa concedê-lo para assinatura/distribuição até 29/09. |
| P04 | Supabase e descarte em 24h | Projeto novo confirmado (D66); configurar e comprovar prazo para banco, backups/logs/cópias. Bloqueia uso de conteúdo real sob essa garantia; ver proposta de dados. |
| P05 | Regra resolvida; adaptação pendente | D62 proíbe o administrador de consultar avaliações/anotações ou executar funções de Judge/JA/líder. Remover o bypass do legado em Judging e impedir que gestão de roles contorne a proibição. |
| P06 | Definição técnica fechada; execução pendente | Expo Push Service, outbox transacional, cron servidor e sessão mentor definidos em T01/T03; implementar credenciais, entrega e testes reais. |
| P07 | Definição técnica fechada; execução pendente | SDK57, CNG e targets Nx via run-commands escolhidos; migrar dependências/Metro/overrides e comprovar E01–E06. |
| P08 | Inventário e paridade | Mapa de 150 arquivos, 30 modelos/2 enums e critérios M01–M30 produzidos; validar destinos durante implementação e executar testes. |
| P09 | Escopo de descarte definido; prova pendente | Inventário de superfícies em prontidao-operacional.md; cycleId liga mensagens/outbox/recibos de Judging. Implementar e ensaiar purge preservando Filming. |
| P10 | Estratégia fechada; entrega remota pendente | contexts permanece fonte canônica; snapshot em fgc-app/docs/context com manifesto de hashes para versionamento. Preparação local não equivale a commit/push ou acesso da equipe. |
| P11 | Recursos ausentes, confirmado pelo usuário | Android/iPhone, Mac ou Expo/EAS ainda faltam. Providenciar aparelhos compatíveis e ambiente de build; Go não elimina P03. |
| P12 | Contrato fechado; ambiente pendente | API_BASE_URL por ambiente, LAN/HTTPS dev e HTTPS produção definidos; substituir localhost mobile na implementação e provisionar endpoint real. |
| P13 | Contrato fechado; implementação pendente | T02/T03 definem protocolo HTTP, cookies/SecureStore, sessão mentor e callbacks; domínio/IDs devem ser provisionados e fluxo testado em build própria. |
| P14 | Cobertura e regressão | Busca por nomes de arquivos test/spec/e2e no código não encontrou suítes; target mobile aceita passWithNoTests. Implementar testes significativos e verificar web/mobile após atualização; nenhuma execução comprovada. |
| P15 | Resolvida em D68 | Uma observação editável por juiz/equipe/painel. Implementar unicidade e testar concorrência; resolução de produto não comprova schema ou código pronto. |
| P16 | Resolvida em D69 | Várias sinalizações informativas simultâneas; retirada continua estado separado. Implementar e testar motivos/efeitos conforme D26–D29. |
| P17 | Resolvida em D72 | Somente equipes/configuração; Filming, pager e Judging começam limpos. Implementar carga inicial e verificar ausência de dados operacionais legados. |
| P18 | Resolvida em D70/D71 | Admin emite/regenera; código 7 dias desde emissão, sessão 7 dias desde resgate; regeneração revoga versões/sessões/vínculos push anteriores. |
| P19 | Resolvida em D73 | Comprovante restrito a horário, versão da rotina e resultado por até 30 dias; implementar expiração sem conteúdo/contagens/identificadores de Judging. |
| P20 | SMTP ausente | Usuário confirmou indisponibilidade; SMTP próprio/remetente/DNS necessários para login externo, conforme T02. |
| P21 | Hospedagem ausente | Web/API HTTPS, proxy, health, segredos e destinatário de falhas precisam ser preparados; nenhum host existente foi confirmado. |

## O que exige decisão e o que pode avançar tecnicamente

- **Usuário/organização:** fornecer amostra/URL P01/P02, acessos/Supabase/aparelhos
  P03/P04/P11, SMTP P20 e hospedagem P21; estado atual confirmado: tudo falta.
  Políticas P15–P19 não exigem novas respostas.
- **Equipe técnica:** matriz de versões, integração Expo, Metro/Nx, rede e testes
  P07/P12/P14; materializar T01–T04 em schemas/DTOs/testes antes de publicar APIs;
  implementar push P06 e comprovar retenção P04/P09. Providenciar snapshot P10.
- **Não bloquear tudo:** URL ausente tem placeholder aprovado. T01–T04 estão
  documentados; Expo e módulos podem ser preparados com dados sintéticos enquanto
  acessos são obtidos. Amostra valida D34 antes da carga oficial.
- **Bloqueios de aceite:** Expo Go não encerra P03/P06/P07/P11/P13; sem testes
  reais E01–E06 não há aceite mobile. Sem P04/P09 resolvidos não usar dados reais
  sob a promessa de descarte integral em 24 horas.

## Revisão de consistência realizada

- Regras identificadas por D01–D74 e preservadas no documento de decisões;
  PRD e especificação adotam esse documento integralmente.
- Horários por link no MVP, filtro/API posteriores; português nas discussões
  não muda interface em inglês.
- Exclusão de Judging não apaga contas, roles, cadastro global nem Filming.
- Concluída e retirada são estados distintos; reativação não apaga histórico.
- Registros de importação já cadastrados não são sobrescritos; duplicatas
  conflitantes não são resolvidas arbitrariamente.
- Admin não pode consultar nem executar funções de Judging, inclusive mediante
  tentativa de elevação via roles; D62 resolve a diferença do legado em P05.
- Recursos do código legado são descritos como observados, não como migração pronta.

## Limites da verificação

Inspeção de código/configuração e descoberta Nx realizadas. Sem alteração de
código de aplicação, migração, build, teste unitário/e2e, publicação ou exclusão
de dados. Testes de execução permanecem não verificados.

O runtime `_bmad/scripts` não foi encontrado no workspace nem no pacote consultado;
os documentos foram consolidados diretamente em Markdown usando a estrutura
de contrato/requisitos. Não se declara execução completa do pipeline automatizado
BMAD, memlog ou seus gates de revisão.

Diagrama anterior representa fronteiras Supabase/D65 e foi validado com Archify.
O fluxo técnico atual está em ARCHITECTURE-SPINE.md e contratos-tecnicos.md;
schema físico, configuração e execução ainda precisam ser implementados.

A consolidação documental está concluída. Pendências acima são gates das entregas de implementação, não funcionalidades comprovadas. Ver [fechamento](fechamento.md).

Revisão Expo de 18/09/2026: manifestos, targets estáticos, Metro, endpoint e ausência
de pastas nativas conferidos novamente. Não foram consultadas contas externas nem
executados builds, testes ou uma nova resolução de targets Nx nesta revisão.
As validações anteriores do diagrama não cobrem o novo fluxo Expo documentado.

Revisão de 19/09: relatórios independentes em reviews/; correções de protocolo,
privilégios SQL, idempotência, entrega e grafo aplicadas. Ver lista concreta de
acessos, responsáveis por função e critérios em [preparação operacional](prontidao-operacional.md).
