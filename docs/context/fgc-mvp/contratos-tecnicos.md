# Contratos técnicos — T01 a T05

Definições técnicas consolidadas em 19/09/2026, após solicitação de fechar as pendências.
Este contrato descreve o destino a implementar; não descreve APIs já disponíveis.
Regras de produto vêm de [decisões](../FGC-MVP-DECISOES.md), incluindo D71–D74.
Dependências externas e comprovações operacionais permanecem pendentes de execução.

## T01 — transporte, autorização e escrita

Manter `apps/fgc-api` como servidor Express, expondo REST JSON em `/api/v1`.
Web e mobile usam o mesmo contrato. Substituir o GraphQL/Apollo demonstrativo;
não manter duas APIs públicas para a mesma operação. `@fgc/database` passa a
conter adaptadores Supabase/SQL, sem Drizzle/Prisma. Migrations SQL versionadas
em `supabase/migrations` são a autoridade do schema físico.

O servidor verifica a identidade e o estado atual antes de cada operação. Para
staff, criar cliente Supabase por requisição com JWT do usuário, preservando RLS.
Não aceitar authorId, userId, role ou ciclo ativo enviados pelo cliente como
autoridade. Funções SQL transacionais verificam novamente role, painel, autoria,
estado e versão. Leituras usam `SECURITY INVOKER`; comandos mutantes usam
`SECURITY DEFINER` com owner restrito, grants mínimos, search_path fixo e
verificação explícita, conforme matriz SQL abaixo. Não permitir
escritas diretas em tabelas que contornem os comandos de domínio.

Mentores usam sessão própria (T03), nunca JWT inventado de staff. O servidor
resolve sessão/equipe em função restrita e executa somente projeções/comandos
mentor. Service role, quando indispensável, fica em adaptador servidor exclusivo;
não pode ser o cliente padrão de staff nem expor consultas arbitrárias.

### Envelope comum

- IDs UUID, identificador oficial da equipe como texto; datas ISO 8601 UTC.
- Sucesso: `{ data, meta: { requestId, nextCursor? } }`.
- Erro: `{ error: { code, message, fieldErrors? }, requestId }`.
  Mensagens da interface em inglês; nenhuma stack, SQL ou segredo em respostas.
- Códigos: 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`,
  404 `NOT_FOUND`, 409 `VERSION_CONFLICT`/`STATE_CONFLICT`/`DUPLICATE`,
  413 `PAYLOAD_TOO_LARGE`, 429 `RATE_LIMITED`, 503 `DEPENDENCY_UNAVAILABLE`.
  Recurso de outra equipe/painel retorna 404 sem revelar sua existência;
  proibição de ação por role retorna 403 sem conteúdo.
- Listas: `limit` padrão 50, máximo 100; cursor opaco, ordenação estável por
  timestamp/ID; filtros permitidos tipados, nunca SQL fornecido pelo cliente.
- Mutação de entidade existente exige `expectedVersion`; conflito retorna 409,
  mantém rascunho na UI e pede revisão, sem sobrescrita automática.
- Comandos com efeitos persistentes exigem `Idempotency-Key` UUID gerado no
  cliente. Mesma chave/ator/operação/payload devolve resultado original; payload
  diferente dá 409. Checar autorização atual antes de devolver resultado salvo.
  Guardar hash do payload e recibo imutável sem conteúdo, nunca cópia de notas.
  Registros de Judging pertencem ao ciclo e são eliminados com ele.
- JSON comum limitado a 256 KiB; upload segue limites próprios de importação.
  Todas as respostas de sessão/Judging/mentor: `Cache-Control: no-store`.
- Nenhuma fila offline de escrita; retry de anotação é manual. Retry interno de
  entrega push é trabalho de servidor e não equivale a salvar rascunho offline.

### Superfícies públicas

Campos de payload abaixo são a base comum. Em cada entrega, schemas Zod de
`@fgc/contracts` e contrato OpenAPI devem materializar esses campos, com testes
cliente/servidor na mesma alteração. Não publicar endpoint antes desse gate.

| Grupo / rota sob `/api/v1` | Entrada e resultado essenciais | Autoridade |
| --- | --- | --- |
| `POST /auth/email`, `/auth/verify`, `/auth/refresh`, `/auth/logout` | E-mail + destino permitido; código/link verificado; sessão conforme T02 | Público com limites; verificação Supabase |
| `GET /me`; `PATCH /me/profile` | Identidade, nome, roles atuais e capacidades; edição somente de nome | Staff autenticado; roles nunca editadas por perfil |
| `GET /admin/users`; `POST /admin/access` | Lista paginada; e-mails, roles, modo add/replace, expectedVersion quando existente | Admin, D62; operação atômica por usuário |
| `GET /teams` | IDs oficiais/nome/país e dados autorizados; busca/paginação | Staff habilitado; mentor só projeção da própria equipe |
| `POST /imports/preview`; `/imports/:id/commit`; `GET /imports/:id` | Arquivo/mapeamento; prévia com linhas aptas/rejeitadas; confirmação por previewId/versão; resultado por linha | Admin |
| `GET /judging/panels`; `POST /judging/panels` | Painéis autorizados; criação com name, leaderId, judgeIds | Leitura Judge/JA, criação JA |
| `POST /judging/panels/:id/leader`, `/members`, `/teams`; `DELETE /judging/panels/:id` | Substituição/atribuição; exclusão somente vazia; versões dos vínculos afetados | JA |
| `POST /judging/judges/:id/transfer`; `/judging/teams/:id/transfer` | sourcePanelId, targetPanelId, versões; operação atômica, líder substituído previamente | JA; D18–D21/D60 |
| `GET /judging/teams`; `POST /judging/participations`; `DELETE /judging/participations/:id` | Participações, progresso; incluir teamId oficial; remover apenas se permitido | JA escreve; Judge lê painel atual |
| `GET /judging/teams/:id/observations`; `PUT /judging/teams/:id/observation`; `DELETE /judging/teams/:id/observation` | Coleção visível; texto da observação do autor; panelId e expectedVersion (0 na criação) | D68; servidor deriva autor, ciclo e vínculo; autor ativo/pendente |
| `POST /judging/teams/:id/complete`, `/reopen`, `/withdraw`, `/reactivate` | Versão, confirmação de conclusão; motivo da retirada | Líder conclui; líder/JA reabre; JA retira/reativa |
| `PUT /judging/teams/:id/flags/:type`; `DELETE` na mesma rota | Uma sinalização por tipo, motivo conforme D26; vários tipos coexistem | JA, D69; retirada não é flag informativa |
| `GET /filming/tracker`, `/categories`, `/items`; `POST /filming/categories`, `/items` | Lista/mapa/filtros/categorias/itens e criação conforme F01–F05 | Filmmaker; paridade das permissões legadas fora de Judging |
| `PUT /filming/teams/:id/shots/:templateId`; `DELETE` na mesma rota | captured/skipped, notes; limpar retorna pending; expectedVersion | Filmmaker; validar evento/template/equipe |
| `PATCH /filming/items/:id`; `DELETE /filming/items/:id` | Concluir/reabrir ou excluir; versão | Filmmaker |
| `POST /pages`; `GET /pages` | teamId, sourceArea filming/judges, message até 500 caracteres, scheduledFor opcional; histórico autorizado | Filmmaker para filming; Judge do painel/JA para judges; admin proibido em judges |
| `POST /admin/mentor-codes`; `GET /admin/mentor-codes` | teamId; código mostrado uma vez; consulta somente status/expiração | Admin (D70), sem recuperar código em texto |
| `POST /mentor/redeem`, `/mentor/logout`; `GET /mentor/me`, `/mentor/filming`, `/mentor/pages` | Código normalizado; sessão opaca; projeções da equipe resolvida no servidor | T03; nenhuma role de staff |
| `POST /mentor/pages/:id/respond` | Uma das três respostas legadas; primeira gravação por equipe vence | Sessão da equipe; mensagem já disponível |
| `PUT /mentor/device`; `DELETE /mentor/device` | installationId, ExpoPushToken, plataforma, permissão; vínculo derivado da sessão | Mentor; não aceitar teamId de destino livre |
| `GET /schedule` | URL validada ou null; estado indisponível em inglês | Usuário habilitado; sem API de horários no MVP |
| `POST /judging/closure-intents`; `POST /judging/close` | Primeira confirmação cria token curto; segunda envia token + expectedVersion | JA; token expira em 5 min, uso único, vinculado ao ciclo e ator |
| `GET /judging/audit` | Auditoria autorizada do ciclo fechado, antes do limite | Somente JA; admin/Judge negados |

Alterações operacionais de Judging usam o mesmo bloqueio transacional que o
encerramento; nenhuma escrita operacional desse ciclo confirma após o fechamento.
Purge autorizado, Filming, cadastro global e suas mensagens independentes continuam
permitidos. Remover participação exige equipe pendente, sem observações e sem
histórico de avaliação: concluir e reabrir sem notas não permite removê-la (D25).
Transferência
invalida leituras antigas no servidor, mesmo com tela/JWT ainda abertos.

## T02 — sessão de staff em web e mobile

Supabase Auth é o único emissor de identidade. Preservar magic link e código de
e-mail. Remover login de demonstração, JWT próprio e segredo fallback do destino.
E-mail verificado não concede role: cadastro interno e concessões do admin são
avaliados no servidor. SSO Google continua fora do MVP.

Web: access token somente em memória; refresh token em cookie `HttpOnly`,
`Secure`, `SameSite=Lax`, conforme o protocolo explícito abaixo.
Servidor usa cookie para refresh, devolve novo access token e rotaciona cookie.
Proxy `/api` na origem web evita depender de cookies de terceiros. Escritas por
cookie exigem Origin permitido e proteção CSRF. Não salvar tokens em localStorage.

Mobile: access token em memória e refresh token em `expo-secure-store`, sem
AsyncStorage para credenciais. Requisições usam Bearer; app retoma, tenta refresh
serializado e volta ao login se expirado/revogado. Logout elimina credenciais,
caches e rascunhos do usuário e revoga a sessão corrente no servidor.
Configurar JWT de staff com 15 minutos; checar `session_id` ativo e roles atuais
nas operações protegidas, inclusive RPC, para não prometer revogação imediata
apenas pela validade criptográfica do JWT. Nenhuma role vem de user_metadata.

Callback: allowlist de URLs por ambiente, sem redirect aberto. Magic link web
retorna ao callback HTTPS; mobile usa App/Universal Links de domínio verificado
na build própria. O link contém apenas material temporário de autenticação;
não registrar query em logs/analytics, nem encaminhar refresh token por URL.
Ao confirmar o link, servidor emite ticket de troca de uso único, 60 segundos,
vinculado à tentativa/plataforma e ao verificador PKCE; aplicativo troca pelo
par de tokens. Não consumir link automaticamente em GET de scanner de e-mail.
O código de e-mail atende Expo Go; não declarar callbacks próprios validados no Go.

Caso o link seja aberto em aparelho diferente do que iniciou a tentativa,
orientar a usar o código no aparelho original ou iniciar novo login, sem relaxar
o vínculo PKCE. Limitar envio/verificação por IP/e-mail, com erro genérico.

Configurar SMTP próprio da organização e template com link/código, remetente
e DNS verificados antes de testes externos. O SMTP padrão Supabase é limitado
e não atende distribuição real. [Fonte](https://supabase.com/docs/guides/auth/auth-smtp).
Controles de sessão Supabase dependem do plano; não presumir recursos pagos.
[Sessões](https://supabase.com/docs/guides/auth/sessions).
SecureStore é o adaptador nativo escolhido, não armazenamento de observações.
[Fonte](https://docs.expo.dev/versions/latest/sdk/securestore/).

## T03/T05 — mentor por código

D70 fecha T05: apenas admin emite/regenera, em tela mínima. Código aleatório
normalizado no formato legado; armazenar HMAC do código com chave só no servidor,
jamais texto recuperável. Limitar resgate inicialmente a 5 tentativas/minuto por
IP e 20/hora por instalação, com cooldown de 15 min após falhas consecutivas;
IP de rede compartilhada deve ter teste de carga para não bloquear a competição.
Esses limites são parâmetros técnicos ajustáveis com evidência, sem mudar roles.
O contador por instalação é somente complementar: não confiar em installationId
fornecido pelo cliente para limitar brute force. Aplicar também limite global
por evento e digest do código, com resposta genérica e sem registrar código/IP bruto.

Resgate produz segredo aleatório de 256 bits; banco guarda somente hash, equipe,
evento, versão do código, createdAt, expiresAt e revokedAt. Servidor confere
validade em cada leitura, resposta e registro/envio push. Equipe nunca é aceita
como autoridade a partir do dispositivo. Não converter mentor em usuário staff.

Web: cookie de sessão HttpOnly/Secure/SameSite, mesma origem API, proteção CSRF.
Mobile: segredo em SecureStore enviado em esquema próprio de autorização mentor;
nunca confundir com JWT Supabase. Logout revoga a sessão e seu vínculo push.
Cada instalação só tem uma equipe ativa; troca de equipe remove vínculo antigo.
Múltiplos aparelhos da mesma equipe são permitidos. Primeira resposta a um pager
é garantida por constraint única e transação, não por botão desabilitado.

D71 fecha a política: código expira em issuedAt + 7 dias; cada sessão, em
redeemedAt + 7 dias. Sem extensão em consulta/refresh. A expiração do código
impede novo resgate, mas não reduz a validade própria das sessões existentes.
Regeneração atômica incrementa codeVersion, troca digest/issuedAt/expiresAt,
revoga sessões da versão anterior e desativa vínculos push correspondentes.
Toda requisição e envio de push confere versão/revogação/prazo; reautenticar
com novo código recria vínculo. Retorno do sistema operacional pode conter push
genérico já em voo, sem conceder acesso à equipe antiga.

## T04 — fronteiras e dependências

Paradigma: monólito modular, clientes por plataforma e regras autoritativas no
servidor/banco. Um único dono por dado: core (identidade/equipes), judging,
filming, messaging, private (sessões/entrega), audit (evidência autorizada).

| Pacote | Responsabilidade / dependências permitidas |
| --- | --- |
| `@fgc/shared` | Tipos/valores puros, sem React, banco, rede ou segredos |
| `@fgc/contracts` (novo) | Schemas Zod, DTOs e erros REST; depende apenas de shared |
| `@fgc/api-client` (novo) | Fetch tipado, paginação e erros; depende de contracts/shared; recebe adaptador de sessão |
| `@fgc/auth` | Estado de sessão e contratos de armazenamento; depende de contracts/api-client/shared; sem importar módulos de negócio |
| `@fgc/ui` | Tokens e componentes RN/RN Web; somente shared; sem autorização ou fetch |
| `@fgc/judging`, `@fgc/filming`, `@fgc/admin`, `@fgc/mentor`, `@fgc/imports`, `@fgc/schedule` | Fluxos/telas; dependem de ui/auth/api-client/contracts/shared; não importam outro feature |
| `@fgc/messaging` | UI/contratos de pager reutilizados por composição dos shells; features recebem callbacks, sem dependência circular |
| `@fgc/notifications` | Contrato de capacidades; adaptadores `.native` e `.web`; sem regra de destinatário no cliente |
| `@fgc/database` | Adaptadores SQL/Supabase exclusivos do servidor, tipos gerados e RPC; não exportar client service role para clientes |
| `@fgc/server` (novo) | Casos de uso e políticas por domínio, depende de database/contracts/shared; nenhum componente React |
| `apps/fgc-api` | HTTP, sessão, validação, observabilidade e composição de server; não decide regras só no handler |
| `apps/fgc-web`, `apps/fgc-mobile` | Navegação, configuração e composição dos módulos; adaptadores de sessão/plataforma |

Pacotes novos ainda não existem. Criá-los com geradores Nx compatíveis na entrega
correspondente; exports públicos únicos e dependências npm explícitas. Tags de
plataforma `platform:shared/client/server` e tipo `type:domain/ui/data-access/app`
devem ser validadas por lint: cliente nunca importa server/database; biblioteca
nunca importa app; nenhum import profundo de outro pacote. Mesmas versões React
nos clientes e uma única instância no runtime. `@fgc/graphql` será aposentado
quando todos os consumidores forem migrados, sem apagar código antes de testes.

### Regras verificáveis do grafo Nx

Cada pacote recebe `scope:<nome>` além das tags platform/type. Constraints por
scope usam exatamente a lista de dependências da tabela T04; platform sozinha
não distingue dependência entre features. Source consumption continua o padrão.
`@fgc/messaging` depende só de ui/auth/api-client/contracts/shared;
`@fgc/notifications` depende só de contracts/shared e módulos Expo no entrypoint
nativo. Web usa entrypoint sem imports nativos. Shell coordena auth, registro de
dispositivo e abertura de pager; notifications não depende de auth/messaging.
Server/database recebem platform:server; contracts/shared, platform:shared;
demais bibliotecas de apresentação, platform:client. Apps são type:app e têm
exceções explícitas de composição, nunca de cliente→server.

CI verifica import proibido feature→feature, import profundo entre pacotes,
server/database alcançável pelo bundle cliente e ciclos. Cache somente tarefas
determinísticas; serve, builds remotos, publicação e testes com serviços externos
não reutilizam resultado de cache como evidência de execução.

## Precisões obrigatórias de fronteira — revisão de 19/09

### Matriz SQL

Somente schema `api` é exposto pela Data API. Tabelas de core/judging/filming/
messaging/private/audit não são expostas. `anon` não recebe DML nem EXECUTE de
domínio. `authenticated` recebe SELECT mínimo para leituras invoker sob RLS e
EXECUTE de comandos staff; nunca INSERT/UPDATE/DELETE direto.

Funções mutantes pertencem a um papel `fgc_command_owner` NOLOGIN, não superuser,
sem BYPASSRLS e distinto do owner das tabelas; recebe somente DML necessário.
RLS também se aplica a esse papel. Comandos staff usam `auth.uid()` e helper
privado de sessão/roles; não recebem actorId livre. Fixar `search_path` vazio,
qualificar nomes, revogar EXECUTE de PUBLIC e proibir SQL dinâmico de entrada.
Leituras expostas exigem as mesmas verificações de sessão ativa e role atual.

Helper restrito de sessão consulta `auth.sessions` apenas por identificador
derivado do JWT verificado, retorna boolean e não expõe tabela Auth. Sua função
definer tem somente os grants necessários; verificação de `session_id` ocorre
também em RLS/comandos, não apenas no Express. Testes exercitam chamada direta
à Data API para comprovar que não há bypass do contrato de segurança.

Rotas mentor e worker usam funções separadas, com EXECUTE exclusivo do papel de
serviço no servidor. Mentor fornece segredo da sessão para verificação dentro
da transação; função resolve equipe e validade internamente, sem aceitar equipe
declarada pelo chamador. Worker tem comandos fixos de lease/entrega/purge, sem
endpoint SQL genérico. RLS não é presumida quando service role atua: validar
escopo explicitamente e testar negações por sessão/role/ciclo. Segredos e bodies
dessas chamadas nunca entram em logs ou traces.

### Recibo e replay

Chave única `(principalType, principalId, operation, idempotencyKey)`, reservada
na mesma transação do comando. Hash SHA-256 de JSON canônico, com chaves ordenadas,
inclui path, versão e payload normalizado pelo schema. Recibo imutável contém
`commandId`, `entityId`, `resultingVersion`, `outcome` (created/updated/deleted/noop)
e `committedAt`; não contém observação nem perfil. Resultado mutante devolve esse
recibo em data; o cliente consulta a entidade atual separadamente.

Ordem: autenticar/autorizar acesso atual → localizar replay → validar versão e
regras se novo → gravar recibo e efeito atomicamente. Mesmo replay não devolve
conteúdo depois da perda de acesso. Retenção do recibo: 24h, limitada ao purge do
ciclo se Judging. Após expirar, chave antiga retorna `IDEMPOTENCY_EXPIRED` quando
detectável; cliente não reapresenta comandos antigos automaticamente e faz leitura
de reconciliação antes de nova tentativa manual. A garantia de replay idempotente
vale somente durante a retenção do recibo. Após esse prazo, criações sem identidade
natural (por exemplo pager) podem duplicar se reenviadas; não alegar que constraints
genéricas impedem isso. O cliente exige consulta e confirmação explícita de nova
criação, sem reutilizar silenciosamente um comando expirado.

Exceções a recibos de domínio: autenticação e resgate possuem protocolo de
tentativa/ticket de uso único. Emissão de código retorna segredo uma única vez;
repetição da mesma chave informa `SECRET_ALREADY_ISSUED`, sem recuperar texto nem
gerar código novo. Em resposta perdida, admin precisa iniciar regeneração explícita
com nova chave. Não salvar segredo em recibo para permitir replay.

### Protocolo HTTP de autenticação

Todas as rotas abaixo ficam em `/api/v1`. `platform` aceita somente web/mobile;
o servidor aplica allowlist e nunca retorna refresh token em body de resposta web.
Sucesso usa envelope data/meta; erro usa códigos comuns. Tempos retornam UTC.

| Rota | Body | Resposta data |
| --- | --- | --- |
| `POST /auth/email` | email, platform, codeChallenge (S256) | attemptId, expiresAt; resposta genérica mesmo para e-mail sem acesso |
| `POST /auth/verify` | attemptId, emailCode, codeVerifier | accessToken, expiresAt, user; mobile também refreshToken; web Set-Cookie |
| `POST /auth/confirm-link` | attemptId, tokenHash | ticket, exchangeUrl allowlisted; nunca tokens Supabase |
| `POST /auth/exchange` | ticket, codeVerifier | Mesmo resultado de verify, plataforma vem da tentativa persistida |
| `GET /auth/csrf` | Sem body, mesma origem | csrfToken vinculado ao cookie de sessão/refresh; no-store |
| `POST /auth/refresh` | Web: platform=web; mobile: platform=mobile, refreshToken | accessToken, expiresAt; mobile novo refreshToken; web Set-Cookie |
| `POST /auth/logout` | platform; mobile refreshToken quando disponível | signedOut=true após revogar sessão corrente; limpa cookie web |
| `POST /mentor/redeem` | code, platform, installationId | team, event, expiresAt; mobile também sessionToken; web Set-Cookie |
| `POST /mentor/logout` | Sem body | signedOut=true após revogar sessão e vínculo push |

Web refresh cookie: `__Host-fgc_refresh`, HttpOnly/Secure/SameSite=Lax/Path=/,
sem Domain. Mentor: `__Host-fgc_mentor`, mesmas flags. Domínio web encaminha `/api`
ao Express. Dev HTTP local usa nomes sem prefixo e Secure=false somente em
ambiente explicitamente dev; homologação/produção exigem HTTPS, sem override inseguro.
CSRF: token assinado pelo servidor, vinculado à sessão, retornado só a origem
allowlisted; header `X-CSRF-Token` obrigatório em refresh/logout e mutações mentor
por cookie. Validar também Origin. Login iniciado tem tentativa/challenge e
verificador vinculados para prevenir login CSRF. CORS nunca usa wildcard com cookie.

Mobile staff: `Authorization: Bearer <accessToken>`. Mobile mentor:
`Authorization: Mentor <sessionToken>`. Rejeitar combinações de credenciais
ambíguas. Servidor não interpreta token mentor como JWT. InstallationId não é
credencial e não escolhe equipe. Web não recebe sessionToken de mentor em JSON.

Tentativa de login dura 10 min, armazena email normalizado, platform, challenge
e destino derivado da configuração. Link do template Supabase transporta TokenHash
em fragmento da URL permitida, não refresh token. Página de confirmação lê o
fragmento, limpa a URL e só envia confirm-link após ação humana. Servidor verifica
OTP e se a identidade corresponde à tentativa; não aceita trocar attemptId para
outro e-mail. Ticket aleatório fica armazenado por hash, uso único e TTL60s.
Par de tokens temporário fica cifrado em private.auth_exchanges, com chave no
servidor, até troca/expiração; rotina remove resíduos. Exchange valida S256 antes
de consumir ticket e entregar credenciais. Supabase SDK não fornece essa ponte
pronta: implementar e testar explicitamente.

`@fgc/auth` é dono do refresh single-flight. Web coordena abas por Web Locks e
BroadcastChannel; antes de refresh, reusa access token válido de outra aba.
Fallback sem Web Locks usa coordenador por lease em armazenamento web contendo
somente estado de lock, nunca tokens persistidos. Servidor tolera concorrência
conforme janela de reutilização Supabase; resposta tardia inválida não apaga
cookie atualizado por outro refresh. Mobile serializa no processo. Testar duas
abas, retomada, refresh concorrente e logout sem sessão, sem loops de retry.

### Identidade da entrega e corrida com encerramento

Uma entrega possui deliveryId aleatório estável e constraint única
`(pageId, installationId)`; retries não criam identidade nova. A API mentor
autorizada inclui deliveryId da instalação para correlacionar polling e push.
Cliente guarda conjunto temporário de IDs vistos em memória; deduplicação não
promete eliminar toda duplicação externa após encerrar/reiniciar o processo.

Worker reivindica lease de 60s com lock e renova antes do envio se necessário;
verifica sessão, permissão e ciclo imediatamente antes de iniciar a requisição.
Timeout do provedor registra resultado desconhecido e pode causar retry com mesmo
deliveryId. Fechar Judging cancela entregas ainda não iniciadas desse ciclo;
requisições já em voo não podem ser recolhidas com garantia. A notificação genérica
não concede acesso; ao abrir, API nega mensagem/ciclo já fechado ou descartado.
Isso não afeta a fila de Filming e não equivale a entrega exatamente uma vez.

## Contrato de importação inicial

Suportar XLSX (uma planilha selecionada), CSV UTF-8 com delimitador selecionável,
TXT UTF-8 delimitado e JSON array de objetos planos. JSON aninhado, macros,
arquivos cifrados e formatos binários disfarçados são rejeitados com orientação.
Mapeamento manual sempre disponível; campos provisórios D34 ficam explícitos
até verificar amostra oficial. Nomes de coluna não são fixados ao formato oficial.

Limites técnicos iniciais: arquivo 5 MiB, 5.000 registros, 50 colunas, campo
2.000 caracteres e conteúdo XLSX descompactado 25 MiB. Exibir limites antes do
upload. Identificador como texto, trim e preservação de zeros; nome/país
normalizados sem alteração silenciosa de identidade. País aceita ISO alpha-2 ou
nome mapeado em prévia; ambiguidade exige correção. Nenhuma fórmula é executada.

Prévia temporária por 30 min, vinculada ao admin e hash do arquivo/mapeamento;
expirada exige nova prévia. Commit revalida banco e permissões; uma transação por
registro/grupo duplicado, resultado final distingue importado/já existente/erro.
Não persistir arquivo original além da janela nem manter cópias desnecessárias.
Fixar fixtures de cada formato; a amostra real valida o adaptador, não bloqueia
implementar o contrato documentado. D34 continua proibindo declarar o formato
oficial confirmado sem amostra.

## Push, disponibilidade e cron

Escolha técnica: `expo-notifications` no cliente e Expo Push Service no servidor,
com adaptador substituível. Não exigir Firebase SDK no bundle; FCM/APNs seguem
como credenciais de entrega. Fonte: [serviço Expo](https://docs.expo.dev/push-notifications/faq/).
Go declara push não suportado. Web mantém consulta enquanto aberta, sem web push
no MVP. Polling de 20s em foreground e atualização ao retomar preservam o fluxo
legado; pausar no background e não usar isso como prova de notificação nativa.

Criar pager e outbox na mesma transação. Scheduler Supabase `pg_cron` aciona
endpoint interno autenticado a cada minuto via `pg_net`; segredo fica no Vault.
O endpoint só aceita credencial de worker, nunca sessão de cliente.
Trabalhadores reivindicam lotes com lease/lock, sem depender da leitura do usuário.
Agendado nunca envia antes de scheduledFor; a precisão planejada é de minuto,
não uma garantia de entrega pelo sistema operacional. Falhas viram status visível.
[Base de agendamento](https://supabase.com/docs/guides/functions/schedule-functions).

Eventos: pager imediato e pager que atingiu horário, originados em Filming ou
Judging. Destinatários são sessões ativas dos mentores da equipe. Não acrescentar
push para observações, flags ou respostas sem decisão funcional. Uma resposta
permanece no pager e aparece no histórico staff autorizado.

Payload externo genérico: título FGC e aviso em inglês de nova mensagem; nenhum
texto do pager, equipe, observação ou identidade de julgamento. Abrir leva à
caixa de mensagens após autenticação, que consulta dados autorizados do servidor.
Usar identificador de entrega aleatório somente para deduplicação, eliminar o
mapeamento no descarte. Não persistir conteúdo Judging na central de notificações.

Registrar separadamente fila/aceito pelo provedor/falha/resposta do mentor;
receipt Expo não prova leitura nem entrega ao aparelho. Retry transitório com
backoff, máximo 5 tentativas; não reenviar quando respondido/cancelado/ciclo fechado.
O bloqueio por ciclo aplica-se apenas a mensagens de Judging; mensagens de Filming
continuam independentes. Token inválido é desativado. Permissão negada mantém o pager acessível no app.
Som/vibração padrão sujeitos ao sistema; sem contornar modo silencioso. Cliente
deduplica para não tocar alerta duas vezes ao receber push e atualizar a lista.

## Desenvolvimento, publicação e operação

Configuração por ambiente: API_BASE_URL pública, Supabase URL/chave pública
somente onde necessárias; segredos exclusivos do servidor. Dev usa dados
sintéticos, web :3000 e API :4000; mobile acessa IP LAN ou endpoint HTTPS de teste.
Manter portas atuais e verificar listener antes de iniciar. Produção/homologação
usam HTTPS e allowlist, sem localhost compilado. Web e API na mesma origem via proxy.

Hospedagem: web estática + processo Node da API em infraestrutura da organização;
API não depende de filesystem persistente nem de timer em processo para cron.
Servidor só é pronto após conexão/Auth/SQL; `/health/live` e `/health/ready` sem
segredos. Logs estruturados por requestId, sem corpos, cookies ou query de login.
Métricas agregadas de erros/latência/fila; política de retenção segue decisão de
descarte, sem gravar conteúdo de Judging em telemetria. Alerta de purge/fila falha
exige destinatário operacional da organização antes de dados reais.

Testes: Jest instalado para regras e integração; e2e web com Playwright e mobile
com Maestro, executados por targets Nx a criar e validar. São escolhas de
ferramentas, não suítes existentes. Cobrir concorrência/RLS com banco de teste
real, especialmente D62/D68/encerramento. Teste push final é em aparelho real.
Não criar PR de implementação sem unitários e e2e aplicáveis aprovados.

Distribuir Android por build de teste assinada e iOS por TestFlight ou canal
interno permitido pelas contas da organização. Expo Go não é o canal dos
validadores finais. As contas, bundle IDs, domínios, host e aparelhos reais são
valores de provisionamento a fornecer; este documento não os inventa.
