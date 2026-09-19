# Revisão adversarial — fronteiras e contratos

Data: 18/09/2026. Revisão somente documental de ARCHITECTURE-SPINE.md e
contratos-tecnicos.md, com consulta de supabase-dados-migracao.md e pendencias.md.
Nenhuma implementação, autenticação, migration ou teste foi executado.

## Veredito

**Requer ajustes antes de tratar o conjunto como contrato suficiente para
implementações independentes.** A direção está definida e as dependências externas
estão corretamente separadas de evidência de execução. Existem cinco lacunas
técnicas que ainda permitem implementações incompatíveis. Não exigem nova regra
de produto; podem ser fechadas pelo arquiteto. P17/P18/P19 e a comprovação de
descarte permanecem bloqueios explícitos, não decisões que esta revisão presume.

## 1. Alto — autenticação ainda não possui protocolo de fronteira

Referência: T01 superfícies públicas, T02 sessão, T03 mentor.

Implementação A expõe `/auth/refresh` com `{ refreshToken }` para mobile e retorna
`{ data: { accessToken, refreshToken } }`. Implementação B espera um header próprio
e retorna o refresh em cookie também para mobile. Ambas preservam access em
memória e refresh em SecureStore quando seus respectivos clientes são usados,
mas um cliente A não funciona com o servidor B. Analogamente, T03 permite tanto
`Authorization: Mentor <secret>` quanto outro esquema próprio. `/auth/verify`
não define a distinção entre código, confirmação do link e troca do ticket.

Fechar antes do desenvolvimento paralelo: schemas exatos por plataforma para
início/verificação/refresh/logout/resgate; nomes de cookies e seu Path; esquema
mentor; obtenção/envio do CSRF; vínculo entre tentativa, challenge/verifier PKCE
e ticket; distinção entre confirmação de link e troca de tokens. Definir o dono
do refresh serializado e seu comportamento entre abas web para impedir rotações
concorrentes. O gate Zod/OpenAPI proposto é correto, mas esses fluxos precisam
entrar nele antes de implementar clientes e servidor separadamente.

## 2. Alto — autoridade SQL precisa de um caminho executável único

Referência: AD-2, T01 e proposta de schemas.

Implementação A usa `SECURITY INVOKER`, grants de escrita ao papel authenticated
e apenas oculta tabelas da API pública. Implementação B revoga escrita nas tabelas
e usa funções `SECURITY DEFINER` verificando identidade e vínculos. Ambas buscam
comandos de domínio exclusivos e RLS, mas o modelo de grants da B faz as funções
invoker da A falharem; expor posteriormente o schema da A pode abrir escrita que
contorna comandos. A especificação exige invoker por padrão e proíbe bypass dos
comandos, sem decidir como combinar as duas condições.

Fechar: matriz de schema exposto, papel SQL, grants e funções de leitura/escrita;
eleger explicitamente o modelo dos comandos mutantes. Se definer for necessário,
documentar owner sem privilégios excessivos, `search_path`, grants EXECUTE e
checagens obrigatórias dentro da transação. A verificação de `session_id` ativo
também precisa de função/autorização definida, pois não se pode supor que o papel
authenticated consulte livremente tabelas internas de Auth. Mentor precisa de
entrypoints fixos que validem sessão, sem aceitar equipe como autoridade do caller.

## 3. Alto — replay idempotente não define resultado imutável

Referência: T01 envelope comum.

A guarda chave/hash/referência e, no retry, lê a entidade atual. B guarda a mesma
referência e reconstrói um recibo com a versão da primeira execução. Depois de
outra edição, A responde versão 3 e B versão 2 à mesma requisição repetida. Ambas
evitam duplicação e não copiam notas, mas só B consegue preservar um recibo
original; nenhuma estratégia foi escolhida. Após DELETE, a referência de A nem
resolve mais. A ordem entre expectedVersion e replay também permite devolver
conflito em um servidor e sucesso original no outro.

Fechar: envelope imutável de confirmação sem conteúdo de notas (commandId,
entityId, resultingVersion e resultado), hash canônico do payload, obrigatoriedade
da chave para comandos, chave de unicidade e reserva atômica. Autorizar primeiro,
depois resolver replay antes de repetir a checagem de versão da primeira execução.
Definir expiração e resposta para entidade eliminada/ciclo fechado; proibir
reapresentação de conteúdo cujo acesso já tenha expirado. A UI consulta o recurso
atual separadamente quando autorizado.

## 4. Alto — entrega push e deduplicação não compartilham identidade definida

Referência: AD-6 e seção Push, disponibilidade e cron.

A gera um deliveryId por tentativa; B preserva um deliveryId por mensagem e
instalação durante retries. Ambos usam identificador aleatório, mas A faz retries
parecerem novos alertas. Um cliente pode deduplicar polling por pageId enquanto
outro usa deliveryId recebido no push: sem relação autorizada na API, nenhum
consegue aplicar de forma portável a regra de não tocar duas vezes. Também falta
definir a fronteira temporal quando um worker valida ciclo/sessão, o ciclo fecha
e só então o provedor aceita o envio.

Fechar: identidade persistente por mensagem/instalação, unicidade e renovação de
lease, tratamento de tentativa com resultado desconhecido, correlação autorizada
entre resposta da caixa e deliveryId sem conteúdo sensível no push. Definir se a
proibição após encerramento significa não iniciar novos envios ou também cancelar
envios já em voo; estes não podem ser recolhidos com garantia no provedor. Não
prometer exatamente uma entrega externa; especificar retries e deduplicação.

## 5. Médio — grafo Nx descreve intenção, mas não torna todas as fronteiras verificáveis

Referência: AD-4 e T04.

A marca todas as features como `platform:client,type:domain` e usa somente essas
duas dimensões no lint. B acrescenta scopes por feature e restrições específicas.
Os dois seguem as tags documentadas, mas A não distingue judging→filming de
judging→shared apenas com platform/type. Messaging e notifications também não
possuem lista fechada de dependências como os demais pacotes; duas equipes podem
colocar auth e orquestração de dispositivo em lados opostos da composição.

Fechar: matriz explícita de tags por pacote, dimensão de scope ou constraints
equivalentes por pacote, regras para messaging/notifications e exceções de shell;
nomear quem integra auth, registro de dispositivo e callbacks. Validar os casos
proibidos por lint e os exports públicos. Não é necessário criar novos módulos
de negócio para isso.

## Retenção e consistência entre documentos

AD-7 reconhece corretamente que excluir linhas não prova eliminar backups e que
o limite de 24h exige evidência no ambiente real. Não há base para declarar esse
gate fechado. A escolha de pg_cron a cada minuto cobre push; não deve ser
reutilizada implicitamente como garantia de purge pontual. O plano de purge deve
fixar inventário de cópias por ciclo, prazo máximo medido e comportamento de
falha, mantendo a proibição de dados reais até comprovação.

Os companheiros consultados ainda contêm referências anteriores: proposta de
dados diz que provedor push e contratos T01–T04 são TODO; pendencias.md ainda
manda escolher SDK e definir push. Sincronizar esses estados ao publicar a
arquitetura revisada, sem marcar implementação, acessos ou ensaios como concluídos.

## Rechecagem — 19/09/2026

Escopo restrito à nova leitura de contratos-tecnicos.md e ARCHITECTURE-SPINE.md.
Os textos anteriores deste relatório registram a versão revisada em 18/09 e não
devem ser interpretados como achados ainda abertos indiscriminadamente.

Os achados 1, 2, 4 e 5 foram resolvidos no nível de arquitetura: protocolo HTTP e
armazenamento por plataforma explícitos; papéis/grants e autoridade das funções
SQL definidos; deliveryId estável e limites de entrega em voo esclarecidos;
scopes Nx, dependências e composição de notificações especificados. A implementação
e os testes correspondentes continuam sendo gates, não evidência desta revisão.
D71–D74 agora estão incorporadas à arquitetura, sem necessidade de novas perguntas
de produto para esses temas.

**Um bloqueador de precisão técnica permanece no achado 3:** o recibo imutável e
a ordem do replay resolvem o problema original, mas a afirmação de que constraints
e versionamento impedem duplicação mesmo sem recibo retido não é válida para todas
as criações. Exemplo: `POST /pages` com UUID de idempotência K confirma, o recibo
expira após 24h e o mesmo comando é reenviado. A permite uma segunda mensagem,
pois seu ID é gerado pelo servidor; B preserva uma chave no recurso e rejeita.
Nenhuma constraint de identidade de criação obrigatória foi especificada, e a
reconciliação manual do cliente não constitui garantia transacional.

Correção técnica suficiente: limitar explicitamente a garantia de replay à janela
de retenção e retirar a promessa geral pós-expiração, ou obrigar identidade estável
por criação com unicidade persistida pelo período permitido. Não conservar chaves
de Judging além do descarte para resolver esse problema. A regra escolhida deve
constar no contrato de criações antes de implementações independentes.

A comprovação de exclusão incluindo backups em 24h permanece bloqueio de uso de
dados reais, já assumido em AD-7/D74. Não é nova lacuna de decisão; exige evidência
operacional do ambiente. Nenhum outro bloqueador técnico documental foi encontrado
nesta rechecagem das cinco fronteiras.
