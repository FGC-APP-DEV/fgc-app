# Arquitetura — contrato de destino do MVP

[Diagrama atualizado com Archify](arquitetura.html) · [fonte](arquitetura.archify.json) · [validação](arquitetura-validacao.md).

Status: contratos T01–T04 definidos em [contratos técnicos](contratos-tecnicos.md)
e invariantes em [ARCHITECTURE-SPINE](ARCHITECTURE-SPINE.md). Definições técnicas
não comprovam implementação, compatibilidade executada ou garantia de descarte.
Políticas de produto sem resposta permanecem identificadas como tal.
Referências: [inventário](inventario.md), [regras](../FGC-MVP-DECISOES.md).

## Fronteiras

- `apps/fgc-web` e `apps/fgc-mobile`: navegação, ciclo de vida e adaptadores de plataforma.
- `@fgc/ui`: componentes e tokens; sem regras de autorização ou acesso ao banco.
- `@fgc/judging`: fluxos e apresentação de Judging. Regras de negócio puras compartilháveis;
  execução autorizada das mutações sempre no servidor.
- `@fgc/auth`: contrato de sessão/autenticação para os clientes. Adaptadores de
  magic link/código preservam Supabase Auth; Google pode ser incorporado depois.
- `@fgc/shared`: tipos e validações sem segredos ou dependências de servidor.
- `@fgc/graphql`: aposentadoria definida após migrar consumidores para `@fgc/contracts` e `@fgc/api-client`; não manter dois contratos públicos.
- Supabase: Auth, PostgreSQL, RLS e operações privilegiadas. `apps/fgc-api` mantém Express como fachada REST; `@fgc/database` passa a adaptadores Supabase/SQL sem Drizzle. Nunca expor credenciais privilegiadas aos clientes.
- Filming, importação, programação e notificações precisam de fronteiras próprias;
  bibliotecas novas ainda não existem e devem ser geradas com o Nx instalado quando implementadas.

Adotar Expo no mobile conforme D67, preservando Nx, as bibliotecas compartilhadas
e a aplicação web existente. O código atual ainda usa React Native com Metro sem
Expo; a adoção está aprovada, mas não implementada. Push, builds e assinatura
exigem versões compatíveis, orçamento respeitado e contas disponíveis.

## Dados e estados propostos

Administradores gerenciam identidade/roles e cadastro global, sem acesso a dados
ou operações de Judging (D62). Remover o bypass administrativo do legado nesse
domínio e impedir autoelevação por atribuição de roles. Aplicar a negação no
servidor, inclusive em consultas diretas e combinações conflitantes de roles.

Cadastro global de equipes separado da participação no módulo de Judging.
Painel referencia um líder que obrigatoriamente é membro; associação de juiz e
de equipe deve impedir múltiplos painéis na competição ativa. Observação guarda
autor, equipe e painel; transferência não muda autoria nem amplia visibilidade.

Separar estado de avaliação (`pending`/`evaluated`) da participação
(`active`/`withdrawn`). Assim a retirada preserva o estado a restaurar.
Observações têm cardinalidade aprovada em D68: uma por juiz/equipe/painel,
com unicidade no ciclo e controle de concorrência; não uma lista por autor.
Sinalizações informativas e motivo não alteram o estado de avaliação.
D69 permite várias sinalizações simultâneas. D70 atribui a emissão/regeneração de
códigos de mentor ao administrador em tela mínima, sem ampliar acesso a Judging;
D71 fixa expiração de código/sessão em 7 dias e regeneração revogando sessões
anteriores; T03 detalha os marcos temporais e o vínculo push.
Um marcador de existência de histórico pode ser necessário para impedir remoção
indevida de equipe já avaliada/reaberta mesmo sem observações; sem retenção após a limpeza.

Invariantes, revalidação de permissões e mudanças de estado devem ocorrer em
transações. Clientes desatualizados não podem gravar observação após conclusão,
transferência ou início da limpeza. Usar controle de versão/concorrência e chaves
de idempotência para evitar duplicação em tentativas após resposta de rede perdida.

## Integrações substituíveis

Programação: contrato oferece disponibilidade, URL externa e, futuramente,
consulta por equipe. Implementação inicial apenas configura/valida link; futura
API terá adaptador de dados e autenticação. Trocar endpoint pode não bastar.

Importação: leitores por formato produzem registros comuns e diagnósticos;
mapeamento, validação e persistência são etapas separadas. Preview não escreve.
Servidor revalida antes de gravar, detecta concorrência com importações anteriores
e retorna resultado por registro. TXT/JSON/XLSX precisam de estruturas e limites
documentados após obter amostra. Não executar fórmulas/macros nem interpretar
conteúdo de arquivo como código. Limites de tamanho/linhas e seleção de planilha
estão definidos no contrato inicial de importação em contratos-tecnicos.md.

Autenticação: substituir o login de demonstração do destino por verificação real
da identidade Supabase e vínculo com usuário/roles internos. Manter role atual
validada no servidor; não confiar apenas no estado da UI nem no e-mail recebido.
Supabase é definitivo, sem compatibilidade Prisma/Drizzle (D64). O destino é um projeto novo (D66); reutilizar modelos do legado como referência e adaptar as permissões. Não alterar o banco de origem.

Notificações: separar registro da mensagem, seleção de destinatário e entrega
por plataforma. A entrega nativa não pode ser garantida pelo polling do legado.
Credenciais de envio ficam no servidor, tokens vinculados ao destinatário correto,
sem conteúdo de avaliação em payloads. Registrar falha de envio sem alegar entrega;
o fluxo central continua utilizável mesmo se a permissão nativa for negada.
Agendamento de entrega usa outbox e cron no servidor, conforme T01; sua implementação e validação em aparelhos ainda faltam. Não há fila offline de notas.

## Encerramento e auditoria temporária

O JA encerra Judging mediante duas confirmações. Os dashboards operacionais ficam vazios; somente o JA pode consultar a auditoria temporária. Todos os dados de Judging e suas cópias devem ser eliminados permanentemente até 24 horas após o encerramento. Contas, roles, cadastro global e dados independentes de outros módulos permanecem. O prazo é fixo, não renovável por consulta ou retry. A configuração de backups/logs ainda precisa comprovar esse limite.

A proposta de [schemas, RLS, migração e descarte](supabase-dados-migracao.md) detalha a implementação a validar. O mapa de [funcionalidades e paridade](migracao-escopo-paridade.md) delimita a migração. API, transporte de sessões e grafo de pacotes seguem T01–T04 em [contratos técnicos](contratos-tecnicos.md). D71–D74 fecham sessão, início limpo e comprovante; acessos e comprovação do descarte permanecem execução pendente.

## Expo e distribuição

Expo passa a ser a ferramenta escolhida para o mobile (D67). Expo Go deve permitir
testes rápidos dos fluxos compatíveis; development build com `expo-dev-client`
deve suportar integrações nativas e validação em aparelhos reais. O aceite final
exige build de distribuição assinada, independente do Metro e do Expo Go.

O [plano de adoção e testes](expo-desenvolvimento.md) registra baseline, sequência,
matriz de ambientes e critérios E01–E06. SDK57 e matriz React/RN/web foram escolhidos
como destino; a configuração atual ainda precisa migrar e ser testada.
Expo Push Service é o adaptador de entrega escolhido em T01. EAS pago e Expo Router
não foram adotados; build iOS usa Mac disponível ou EAS dentro do orçamento aprovado.

O diagrama existente representa as fronteiras de aplicação/dados; não detalha
esta nova estratégia de desenvolvimento e distribuição. Este documento e o plano
Expo são as referências desse fluxo.

Fontes oficiais: [development builds](https://docs.expo.dev/develop/development-builds/introduction/)
e [limitações do Expo Go](https://docs.expo.dev/develop/development-builds/faq/).
