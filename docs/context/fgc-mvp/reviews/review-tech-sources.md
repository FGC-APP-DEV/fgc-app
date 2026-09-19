# Revisão de fontes e escolhas técnicas

Data: 18/09/2026. Escopo: ARCHITECTURE-SPINE.md, contratos-tecnicos.md,
expo-desenvolvimento.md e supabase-dados-migracao.md. Revisão documental;
nenhuma instalação, build, conexão ao projeto Supabase ou teste executado.

## Veredito

Escolhas tecnicamente plausíveis e fontes primárias confirmadas, com ajustes
documentais necessários. Aprovação da direção não equivale a compatibilidade
instalada ou cumprimento do descarte. O baseline RN 0.73.11 não executa SDK57
sem migração coordenada. A documentação já distingue implementação pendente.

## Achados

1. **Alta — instruções de Expo Go incompletas para iPhone.** A orientação de
   QR code deve exigir login na mesma conta Expo no CLI e Expo Go iOS. Não
   compartilhar a conta do desenvolvedor com validadores: usar builds próprias
   para esse público. A atualização de 03/09 confirma disponibilidade SDK57 na
   App Store e supera a frase antiga do lançamento sobre aprovação pendente.
   [Fonte atual](https://expo.dev/changelog/expo-go-57-login).

2. **Média — patch SDK57 não basta para Xcode27.** O mínimo 57.0.23 habilita
   suporte opt-in a scenes, mas uma imagem Xcode27 exige configurar
   `ios.enableSceneSupport` em `expo-build-properties`. Registrar imagem e
   configuração no gate E01/E03; não presumir que somente atualizar resolve.
   [Changelog SDK57](https://expo.dev/changelog/sdk-57).

3. **Média — sincronizar decisão com companions.** O plano Expo ainda manda
   escolher SDK/política nativa, enquanto o spine já adota SDK57/CNG. No plano
   Supabase ainda aparecem provedor push e contratos como TODO, apesar de
   contratos-tecnicos.md escolher Expo Push Service e REST. Trocar esses TODOs
   por implementação/verificação pendente evita decisões contraditórias.

4. **Média — cobertura de aparelhos precisa refletir mínimos.** SDK57 exige
   iOS16.4+ e Android7+, com Xcode26.4+ na matriz. Confirmar esses mínimos nos
   dispositivos oferecidos para E02–E06 antes de prometer cobertura universal.
   [Matriz oficial](https://docs.expo.dev/versions/latest/).

5. **Baixa — falta materializar ambiente e versões e2e.** Playwright/Maestro
   são escolhas coerentes, mas ainda requerem instalação, versões fixadas,
   targets Nx, navegadores/emuladores e runner iOS macOS/Xcode. Maestro dispõe
   de instalação Windows; não exigir WSL por costume. Testes em simulador iOS
   não substituem push/assinatura em aparelho real.
   [Playwright](https://playwright.dev/docs/intro),
   [Maestro CLI](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli),
   [Maestro iOS](https://docs.maestro.dev/get-started/supported-platform/ios).

## Verificações favoráveis e limites

- SDK57/RN0.86/React19.2.3/RNW0.21/Node22.13 são consistentes com a matriz;
  RN0.86.3 é documentado no changelog. Atualizar React e overrides também no
  web é necessário. Nx22 suporta Node22.12+, logo Node22.13+ satisfaz ambos.
  Nx orienta manter versões dos plugins sincronizadas. Isso não comprova
  compatibilidade de cada executor/plugin Expo22 com SDK57: instalar e validar
  permanece obrigatório. [Nx/Node](https://nx.dev/docs/technologies/node/introduction).
- CNG com configuração/plugins versionados é coerente; arquivos nativos
  gerados não devem receber ajustes manuais descartáveis.
  [CNG](https://docs.expo.dev/workflow/continuous-native-generation/).
- SMTP próprio é necessário para testes externos: o padrão restringe
  destinatários e capacidade. Não há configuração de SMTP comprovada.
  [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
- Supabase possui session_id e controles de sessão dependentes de plano.
  Expiração temporal configurada é aplicada no refresh; revogação imediata
  exige checagem adicional. O contrato reconhece corretamente essa diferença.
  Ticket/PKCE intermediário é solução própria ainda a implementar/testar, não
  funcionalidade pronta do Supabase.
  [Sessões](https://supabase.com/docs/guides/auth/sessions).
- pg_cron/pg_net/Vault são suportados. A documentação de exemplo usa Edge
  Functions; chamar endpoint Express é adaptação do projeto, dependente de
  conectividade HTTPS e autenticação própria. Não copiar chave pública como
  segredo do worker. Cron de minuto não prova purge em prazo estrito.
  [Agendamento](https://supabase.com/docs/guides/functions/schedule-functions).
- A objeção a descarte físico em 24h é material: planos pagos têm backups
  diários retidos por múltiplos dias; Storage possui ciclo distinto. Apagar
  linhas não comprova eliminação de todas as cópias. O documento acerta em
  bloquear dados reais até evidência/decisão, sem presumir exceção.
  [Backups](https://supabase.com/docs/guides/platform/backups).

## Critério de fechamento

Atualizar os pontos documentais acima; manter E01–E06, SMTP, contas, credenciais,
dispositivos, testes e viabilidade do descarte como execução não comprovada.
Nenhum achado autoriza comprar serviços, compartilhar credenciais ou relaxar
decisões de produto. Fontes consultadas em 18/09/2026; versões exatas finais
devem estar no lockfile e evidências de build, não apenas nesta revisão.

## Reavaliação de 19/09/2026

Escopo restrito a expo-desenvolvimento.md e ARCHITECTURE-SPINE.md; sem nova
instalação, pesquisa ou execução de testes. A fonte de matriz SDK consultada
na rodada anterior continua sendo a evidência desta revisão.

- Achados 1 e 2 resolvidos documentalmente: login Go iOS na mesma conta,
  separação dos validadores e scene support condicional a Xcode27 estão explícitos.
- Achado 3 resolvido no plano Expo: SDK57, CNG, nx:run-commands e Expo Push
  Service são escolhas registradas. A reavaliação não reabre os demais companions.
- Achado 4 permanece: registrar no plano os mínimos Android7+ e iOS16.4+,
  Xcode26.4+ e Android compileSdk/targetSdk36 da
  [matriz SDK57](https://docs.expo.dev/versions/latest/). Confirmar aparelhos
  disponíveis nesses limites é gate de execução, não prova já obtida.
- Inconsistência residual de redação: a última seção do plano ainda diz que
  SDK é decisão técnica a resolver; trocar por escolha fechada cuja instalação
  e compatibilidade no workspace precisam de evidência.
- AD-5 e a base técnica do spine continuam coerentes com o plano atualizado.
  Versões instaladas, hardware, build assinada e retenção de cópias permanecem
  não comprovados. Nenhum novo bloqueador de escolha tecnológica identificado.

Veredito atualizado: direção aprovada com os dois ajustes documentais acima;
E01–E06 permanecem pendentes de execução.
