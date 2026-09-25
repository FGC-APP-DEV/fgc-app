---
id: SPEC-fgc-mvp
companions:
  - ../FGC-MVP-DECISOES.md
  - PRD.md
  - permissoes.md
  - architecture.md
  - inventario.md
  - pendencias.md
  - expo-desenvolvimento.md
  - contratos-tecnicos.md
  - ARCHITECTURE-SPINE.md
---

# Especificação de desenvolvimento — FGC MVP

Status: definições funcionais, técnicas e referência visual prontas para orientar a implementação; execução e comprovações permanecem acompanhadas em pendencias.md.

## Why

Entregar coordenação de Filming e Judging simples para a competição, com testes
até 29/09/2026 e operação prevista de 4 a 10/10/2026, conforme informado pelo usuário.

## Capabilities

- **CAP-1 — Acesso:** usuário entra pelo fluxo legado; sucesso: RF01 e matriz de permissões respeitados em UI/API.
- **CAP-2 — Equipes:** administrador importa cadastro compartilhado; sucesso: RF02–RF04 com preview, mapeamento, erros e resultados parciais.
- **CAP-3 — Judging:** JA organiza e juízes acompanham avaliações; sucesso: RF05–RF10, sem acesso cruzado entre painéis.
- **CAP-4 — Programação:** usuário consulta link oficial configurado; sucesso: RF11 e estado sem link quando ausente.
- **CAP-5 — Filming:** equipe opera todos os fluxos legados inventariados; sucesso: RF12 e evidência de paridade F01–F05.
- **CAP-6 — Alertas:** destinatários recebem alertas móveis adaptados do legado; sucesso: RF13 validado em aparelhos, sem confundir polling com push.
- **CAP-7 — Encerramento:** JA limpa todo Judging ao final; sucesso: RF14 com duas confirmações, isolamento, auditoria exclusiva do JA e descarte comprovado em até 24h.
- **CAP-8 — Distribuição:** participantes testam nas três plataformas; sucesso: RF15, seguido da publicação pública prioritária.

## Constraints

D01–D74 são obrigatórias e prevalecem sobre os protótipos. Uma competição, inglês,
conexão necessária, nenhuma despesa nova sem aprovação. Adotar fronteiras Nx/RN,
preservar Filming e adaptar autenticação; Supabase definitivo, sem camada de compatibilidade Prisma/Drizzle. Projeto Supabase novo (D66), reutilizando schemas do legado como referência.
Expo adotado no mobile (D67): Expo Go para fluxos compatíveis, development build
para integrações nativas e build assinada para distribuição. Preservar o web existente.

## Non-goals

Segunda rodada, notas/indicações por prêmio, SSO Google, idiomas adicionais,
horários integrados, IA e sincronização offline não integram este MVP.

## Success signal

Executar o roteiro do PRD em web/Android/iOS com usuários distintos, evidência
de negação de acesso indevido, falhas tratadas e exclusão completa no encerramento.
Teste sem cobertura ou mock de push não comprova aceite de produção.

## Sequência proposta de desenvolvimento

Preparação mobile em paralelo à implementação dos contratos de backend: validar versões e integrar
Expo seguindo o [plano E01–E06](expo-desenvolvimento.md). Não adiar a descoberta
de incompatibilidades ou a obtenção de credenciais para a etapa final.

1. Aplicar a proibição de acesso administrativo a Judging (D62), resolver acesso ao banco e viabilidade de
   descarte em até 24h; fixar baseline legado e mapear todos os artefatos de Filming.
2. Adaptar identidade/roles, contratos compartilhados e modelo de dados isolado;
   criar testes de autorização e concorrência antes de habilitar dados reais.
3. Implementar importação por leitores, mapeamento, prévia e gravação parcial idempotente.
4. Implementar painéis/liderança, participação de equipes, observações e estados;
   confirmar requisitos no servidor, não só nos botões.
5. Portar Filming e dependências de pager/mentor, com comparação funcional do legado.
6. Completar development builds Expo, callbacks de login, push, vibração e sons; implementar
   programação externa como adaptador substituível.
7. Implementar limpeza e verificar descarte em até 24h e preservação de outros módulos.
8. Rodar testes de regras/API/e2e, validação em dispositivos e builds de distribuição;
   preparar revisão das lojas e testes com participantes até o marco acordado.

## Dependências de execução

Ver [pendências](pendencias.md). Não converter recomendações técnicas em decisões
de produto sem evidência. O [mapa por arquivo](mapa-arquivos.md), a [matriz funcional](migracao-escopo-paridade.md) e a [proposta de dados](supabase-dados-migracao.md) estão disponíveis. T01–T04 foram definidos em [contratos técnicos](contratos-tecnicos.md) após solicitação de fechar as pendências; D71–D74 encerram as perguntas funcionais; amostra oficial, valores de provisionamento e comprovações operacionais continuam pendentes. Esta especificação não autoriza
executar migrações, publicação ou exclusão de dados reais.

## Referência obrigatória de interface

Aplicar [design-system.md](../design-system.md) à versão final do MVP em web, Android e iOS, através de @fgc/ui. Preservar identidade visual e adaptar as primitivas à plataforma. Fluxos, permissões e estados seguem D01–D74 e T01–T05; a referência visual não acrescenta funcionalidades. Validar acessibilidade, responsividade e estados assíncronos nos fluxos aprovados.
