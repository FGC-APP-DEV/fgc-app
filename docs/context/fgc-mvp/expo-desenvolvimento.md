# Expo — adoção e testes do FGC

Decisão D67, aprovada em 18/09/2026. Status: documentação de implementação;
Expo ainda não instalado e nenhum teste mobile executado nesta revisão.

## Objetivo e limites

Facilitar a experimentação no celular com Expo Go e preparar development builds
para validar integrações nativas. Manter o monorepo Nx/npm, código compartilhado
e aplicação web existente. Expo não altera regras de autorização, retenção ou
conexão obrigatória. Não adotar Expo Router nem EAS pago automaticamente.
Expo Push Service foi escolhido em [contratos técnicos](contratos-tecnicos.md).
Nenhuma despesa nova está aprovada (D51).

## Escolhas técnicas fechadas nesta rodada

- SDK57 estável, patch mínimo Expo57.0.23, React Native0.86.3,
  React/React DOM19.2.3, React Native Web0.21.0 e Node22 a partir de22.13.
  Patches exatos resolvidos pelo Expo e fixados no lockfile na implementação;
  a instalação e compatibilidade do workspace ainda não foram verificadas.
- Nx permanece; usar targets `nx:run-commands` para Expo inicialmente, sem
  introduzir plugin `@nx/expo` como requisito. Alinhar plugins Nx antes dos gates.
- CNG: app config/config plugins são fonte versionada; android/ios gerados ficam
  fora do Git. Alterações nativas persistentes são codificadas em plugins.
- Metro deriva de `expo/metro-config`; remover ajustes manuais redundantes apenas
  após validar a resolução dos pacotes públicos do workspace.
- Expo Go iOS SDK57 exige mesma conta no CLI e aparelho, conforme aviso de03/09.
  Isso não significa compartilhar senha entre validadores: usar build própria para
  testes da equipe. O aviso ainda não estende a exigência ao Android/simuladores.
- Se a imagem iOS usar Xcode27/iOS27, configurar explicitamente scene support
  conforme changelog SDK57; patch mínimo sozinho não basta. Registrar imagem e
  configuração que passaram no teste de instalação/abertura.
- Matriz SDK57: Android 7+ e iOS 16.4+ nos aparelhos; Xcode 26.4+ para build iOS;
  compile/target SDK Android 36. Registrar sistemas/aparelhos concretos antes
  dos testes; suporte declarado pelo SDK não é evidência de execução do FGC.

Fontes verificadas em18/09/2026: [matriz SDK](https://docs.expo.dev/versions/latest/),
[SDK57](https://expo.dev/changelog/sdk-57), [login Go](https://expo.dev/changelog/expo-go-57-login),
[monorepo](https://docs.expo.dev/guides/monorepos/) e [CNG](https://docs.expo.dev/workflow/continuous-native-generation/).

## Baseline inspecionado em 18/09/2026

- `fgc-app/package.json`: React Native 0.73.11, React/React DOM 18.2.0,
  React Native Web ^0.19.0 e Nx 22.6.0; plugins Nx têm versões declaradas distintas.
  Há overrides de React e React DOM que precisam acompanhar qualquer atualização.
- Não há dependência Expo declarada no manifesto raiz nem no manifesto mobile.
- `apps/fgc-mobile/project.json`: start/run-android/run-ios chamam React Native CLI.
  Esses são targets atuais; ainda não iniciam Expo Go nem development client.
- Metro possui watchFolders e resolução manual de bibliotecas `@fgc/*`.
  Revisar com a configuração Expo do SDK escolhido, sem copiar ajustes antigos
  indiscriminadamente nem quebrar aliases/exports compartilhados.
- As pastas `android/` e `ios/` estão ausentes. Gerar/configurar pelo fluxo Expo
  escolhido, em vez de copiar projetos de uma versão arbitrária de React Native.
- `apps/fgc-mobile/src/App.tsx` fixa a API em `http://localhost:4000`.
  Celulares precisam de endpoint acessível; a integração Supabase continua pendente.
- O target de teste mobile permite `passWithNoTests`; isso não comprova cobertura.
  A busca por arquivos com nomes de teste/spec/e2e no código não encontrou suítes.

## Ambientes e evidências

| Ambiente | Uso no FGC | Limite / aceite |
| --- | --- | --- |
| Web existente | Fluxos de negócio, autorização e acessibilidade no navegador | Continua com seu build atual; não comprova comportamento nativo. |
| Expo Go em Android e iPhone | Telas, navegação, formulários e chamadas ao backend com bibliotecas compatíveis | SDK deve ser compatível com o Expo Go instalado. Não comprova push remoto, links nativos próprios ou distribuição. |
| Development build própria | Login/callbacks reais, sessão, permissões, push, sons, vibração e retomada | Testar em aparelhos Android/iOS, registrando permissões e estado do app. |
| Build de distribuição assinada | Regressão final e distribuição aos participantes antes da publicação | Instalar e abrir sem Metro; validar configuração de ambiente e integrações reais. Expo Go sozinho não atende RF15. |

Expo Go contém um conjunto fixo de bibliotecas nativas. Recursos indisponíveis
devem ser isolados em adaptadores e apresentados como não suportados nesse
ambiente; não simular entrega push como sucesso real. Se uma dependência impedir
abrir o app, resolver a separação do recurso antes de declarar o fluxo Go pronto.
As limitações de push remoto e App/Universal Links estão na
[documentação oficial](https://docs.expo.dev/develop/development-builds/faq/).

## Sequência de aplicação

1. Registrar versões instaladas e aplicar o SDK57 escolhido, compatível com Expo Go nos
   aparelhos de teste. Validar a matriz SDK/React/RN/RN Web/Node/Nx, incluindo
   overrides e impacto no web. Registrar versões exatas após validação; não
   presumir suporte do Expo Go atual ao RN 0.73.11.
2. Integrar Expo ao app mobile existente; ajustar entrada, Babel, Metro, assets e
   configuração do app. Aplicar CNG e política de geração/versionamento de android/ios
   e config plugins; evitar mudanças nativas manuais que se percam na regeneração.
3. Expor no Nx comandos distintos para Expo Go e development client, mantendo npm
   e documentação a partir de `fgc-app/`. Nomes/comandos novos serão registrados
   somente depois de implementados e verificados. Usar nx:run-commands com o CLI
   local Expo; eventual adoção de plugin Nx Expo exige benefício e compatibilidade.
4. Configurar endpoint dev acessível e dados sintéticos no Supabase novo. LAN ou
   encaminhamento USB precisa alcançar o backend; túnel do Metro não publica a
   API automaticamente. Nunca incluir service role, tokens de envio ou segredos
   no bundle/variáveis públicas. Resolver sessões e callbacks conforme T02/T03.
5. Demonstrar abertura por QR code no Expo Go em Android e iPhone, alterações por
   Fast Refresh, navegação e um fluxo de leitura/gravação com falha de rede tratada.
6. Gerar development builds; configurar identidades Android/iOS, assinatura,
   credenciais push e links de login/pager. Escolher build local ou EAS conforme
   disponibilidade de Mac, contas, capacidade gratuita e D51.
7. Executar E01–E06 e RF01–RF16/M01–M30 aplicáveis, distribuir builds de teste até
   29/09/2026 e preparar publicação. Registrar versão, dispositivo, ambiente,
   resultado e evidência, sem conteúdo real de avaliações nos relatórios.

No Windows é possível trabalhar no JavaScript e usar Expo Go no iPhone; compilar
iOS localmente exige macOS/Xcode. EAS permite build iOS na nuvem a partir de outro
sistema, mas exige avaliar acesso, assinatura e condições do serviço. Uma build
própria precisa ser refeita quando muda a parte nativa; alterações somente em
JavaScript/TypeScript usam o servidor de desenvolvimento.
[Referência de builds](https://docs.expo.dev/develop/development-builds/introduction/).

## Critérios para encerrar a adoção

Todos estão pendentes; documentação não é evidência de execução.

| ID | Evidência exigida |
| --- | --- |
| E01 | Versões compatíveis registradas, instalação reproduzível e verificação de dependências sem conflitos não resolvidos. |
| E02 | Expo Go abre em Android/iPhone por QR code; telas e fluxo compatível com backend funcionam; limitações nativas são explícitas. |
| E03 | Development builds Android/iOS instalam; login/callback, sessão, permissões e logout funcionam com isolamento por role/equipe. |
| E04 | Push real, toque no alerta, som/vibração conforme permissões, foreground/background e retomada validados; negar permissão não bloqueia o módulo. |
| E05 | Web e bibliotecas compartilhadas sem regressão; verificações Nx aplicáveis, testes unitários/integração/e2e com cobertura real aprovados. |
| E06 | Builds assinadas abrem sem Metro, fluxos críticos passam e participantes recebem instruções de instalação; acesso às lojas e submissão rastreados separadamente. |

## Pendências que governam este plano

P03/P06/P07/P11–P14 e T01–T04 estão em [pendências](pendencias.md).
SDK, CNG e integração Nx foram escolhidos; instalar, fixar dependências e comprovar
compatibilidade/configuração continuam tarefas de implementação;
contas, aparelhos disponíveis e despesas dependem da organização. Expo Go não
elimina essas dependências nem a validação de descarte de Judging de P04/P09.
