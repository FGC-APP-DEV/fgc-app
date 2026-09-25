# Pendências de execução e validação

Decisões funcionais D01–D74 e contratos T01–T05 fechados. P15–P19 foram encerrados por D68–D74 e retirados da lista de perguntas; suas regras permanecem no PRD e nos contratos. Referência visual obrigatória: [design system](../design-system.md).

O usuário informou em 19/09 que os demais itens estão sendo resolvidos em paralelo. Os estados abaixo são a última verificação registrada, não confirmação atual de indisponibilidade ou conclusão.

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
| P20 | SMTP ausente | Usuário confirmou indisponibilidade; SMTP próprio/remetente/DNS necessários para login externo, conforme T02. |
| P21 | Hospedagem ausente | Web/API HTTPS, proxy, health, segredos e destinatário de falhas precisam ser preparados; nenhum host existente foi confirmado. |

## O que exige decisão e o que pode avançar tecnicamente

- **Usuário/organização:** fornecer amostra/URL P01/P02, acessos/Supabase/aparelhos
  P03/P04/P11, SMTP P20 e hospedagem P21; acompanhar provisionamento em andamento, conforme atualização do usuário.
  Políticas P15–P19 não exigem novas respostas.
- **Equipe técnica:** matriz de versões, integração Expo, Metro/Nx, rede e testes
  P07/P12/P14; materializar T01–T04 em schemas/DTOs/testes antes de publicar APIs;
  implementar push P06 e comprovar retenção P04/P09. Manter snapshot P10 sincronizado.
- **Não bloquear tudo:** URL ausente tem placeholder aprovado. T01–T04 estão
  documentados; Expo e módulos podem ser preparados com dados sintéticos enquanto
  acessos são obtidos. Amostra valida D34 antes da carga oficial.
- **Bloqueios de aceite:** Expo Go não encerra P03/P06/P07/P11/P13; sem testes
  reais E01–E06 não há aceite mobile. Sem P04/P09 resolvidos não usar dados reais
  sob a promessa de descarte integral em 24 horas.
