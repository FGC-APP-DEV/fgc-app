# Fechamento das definições — 19/09/2026

Escopo: Filming, Judging e dependências necessárias, nas três plataformas. Supabase novo, reutilizando modelos do legado como referência, sem Prisma/Drizzle obrigatório. Regras D01–D74 prevalecem sobre o código legado.

## Entregas

Brief, PRD, permissões, arquitetura, especificação, inventário por arquivo/modelo e critérios M01–M30 disponíveis no índice. O inventário cobre 150 arquivos versionados e 30 modelos/2 enums da revisão registrada; destinos são propostas e não prova de portabilidade ou paridade executada.

Expo/Expo Go adotados por D67. [Plano mobile](expo-desenvolvimento.md) registra
baseline, sequência e E01–E06; PRD/SPEC/paridade/README alinhados. A escolha está
fechada, mas dependências, código e ambiente ainda não foram migrados.

## Definições concluídas

- T01–T04: REST/Express, SQL transacional, protocolo de sessões, fronteiras Nx e contratos comuns definidos em [contratos técnicos](contratos-tecnicos.md) e [invariantes](ARCHITECTURE-SPINE.md).
- T05 e política mentor resolvidos em D70/D71: administrador em tela mínima; código 7 dias, sessão 7 dias após resgate; regeneração revoga sessões e vínculos push anteriores.
- D72: somente equipes/configuração; Filming, pager e Judging começam limpos.
- Aplicar D68 (uma observação por juiz/equipe/painel) e D69 (várias sinalizações simultâneas) ao schema físico e aos testes.
- D73: comprovante técnico mínimo por 30 dias; D74: descarte em 24h continua abrangendo backups/cópias, sem exceção.
- Expo SDK57/CNG, Expo Go para fluxos compatíveis, development builds e distribuição assinada; push via Expo Push Service/outbox/cron servidor.
- Contrato inicial de importação e limites técnicos definidos; campos oficiais D34 aguardam amostra externa.
- contexts continua fonte canônica; snapshot versionável em fgc-app/docs/context, com manifesto de hashes, permite checkout isolado.

## O que permanece para executar

1. **Provisionamento:** usuário confirmou que faltam todos os acessos, serviços,
   aparelhos, amostra e URL levantados. A [lista operacional](prontidao-operacional.md)
   define responsáveis por função e evidência exigida; não há disponibilidade presumida.
2. **Implementação:** instalar/migrar Expo, materializar contratos, migrations,
   sessões, módulos, notificações e testes. Nenhum desses itens foi executado aqui.
3. **Retenção:** comprovar D65/D74 em ambiente real antes de dados reais de Judging.
   Excluir linhas ou ocultar telas não prova eliminar backups/cópias.
4. **Distribuição:** validar E01–E06 e RF/M aplicáveis, preparar builds assinadas,
   distribuir até 29/09 e publicar nas lojas. Expo Go não substitui esses passos.
5. **Compartilhamento:** snapshot local pronto para Git não significa commit/push
   ou publicação remota; isso continua rastreado em P10.

Não há novas perguntas funcionais abertas em P15–P19. A programação já tem
placeholder aprovado enquanto a URL faltar. A amostra oficial precisa validar
os campos provisórios antes da carga real. Responsáveis nominais e datas dos
acessos ainda devem ser atribuídos pela organização.

O planejamento técnico está documentado; sua execução não deve reabrir escolhas
já feitas sem demonstrar conflito ou incompatibilidade. Compatibilidade instalada,
SLAs e descarte são fatos a medir, não decisões que possam ser marcadas como prontas.

## Ordem de desbloqueio

1. Preparar acessos em paralelo à implementação isolada e validação de versões Expo.
2. Demonstrar Go em Android/iPhone com backend de teste e dados sintéticos.
3. Concluir development builds, autenticação e push real nos dois sistemas.
4. Executar cobertura de regras/e2e, comprovar retenção e validar builds assinadas
   sem Metro para os participantes até 29/09/2026. Publicação permanece exigida.

## Verificação realizada

Revisão documental e links locais; inspeção do legado; diagrama vigente documentado na ARCHITECTURE-SPINE.md. Nenhum código de aplicação, banco, deploy ou conta foi alterado. Testes unitários, e2e e nativos serão exigidos nas entregas de implementação; não foram executados nesta consolidação.

A validação documental não declara E01–E06 concluídos. O detalhamento e os responsáveis por tipo de ação estão em
[pendências P01–P21](pendencias.md).

Revisão de 19/09: três relatórios independentes lidos e correções aplicadas;
lint determinístico da spine sem achados. Verificação de links e manifesto do
snapshot é registrada na entrega. Não se declara execução completa do runtime
BMAD, ausente no workspace, nem aprovação operacional do aplicativo.

## Referência obrigatória de interface

Aplicar [design-system.md](../design-system.md) à versão final do MVP em web, Android e iOS, através de @fgc/ui. Preservar identidade visual e adaptar as primitivas à plataforma. Fluxos, permissões e estados seguem D01–D74 e T01–T05; a referência visual não acrescenta funcionalidades. Validar acessibilidade, responsividade e estados assíncronos nos fluxos aprovados.
