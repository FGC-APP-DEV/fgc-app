# Project brief — FGC App

Status: consolidado e atualizado com a adoção de Expo em 18/09/2026.

## Problema e objetivo

A operação da competição precisa de ferramentas simples para acompanhar equipes,
filmagens e avaliações, sem exigir treinamento extenso nem suporte contínuo dos
desenvolvedores durante o evento. Entregar um MVP confiável para validação real
no FIRST GLOBAL Challenge de 4 a 10/10/2026, conforme datas fornecidas pelo usuário.

Estar pronto para testes até 29/09/2026 em web, Android e iOS. Distribuição móvel
de testes atende a esse marco; publicação nas lojas permanece obrigatória e prioritária.

## Público

- Administrador: identidade, roles e importação do cadastro compartilhado de equipes.
- JA: organização dos painéis, gestão das equipes de Judging e encerramento com exclusão.
- Juiz: observa e acompanha equipes do próprio painel.
- Líder: juiz designado pelo JA, único que conclui avaliações do painel.
- Equipe de Filming: funcionalidades existentes no `firstglobal-ops`.
- Destinatários dos alertas do legado: preservar os fluxos necessários ao pager; mentores recebem o pager; não incluir Pit Admin integralmente.

## Escopo aprovado

Judging simplificado, observações compartilhadas por painel, conclusão pelo líder,
reabertura pelo líder/JA, sinalizações, progresso e encerramento com auditoria temporária exclusiva do JA e descarte definitivo em até 24h.
Filming integralmente a partir do legado. Login legado, importação multiformato
com prévia e erros por registro, notificações/vibração/sons móveis, programação
por link configurável. Fonte detalhada: D01–D74 em [decisões](../FGC-MVP-DECISOES.md).

Mobile com Expo: Expo Go facilita testes rápidos dos fluxos compatíveis;
development builds permitem testar integrações nativas. Builds assinadas seguem
obrigatórias para distribuição e aceite final. A adoção está aprovada, ainda não implementada.

## Limites

Uma competição por vez; interface em inglês; conexão obrigatória; sem fila offline.
Nenhuma nova despesa sem aprovação da organização. Contas das lojas existem,
mas falta acesso. Toda informação de Judging da competição deve ser eliminada
até 24 horas após o encerramento iniciado pelo JA, mantendo contas, roles e dados compartilhados de outros módulos.

Fora do MVP: notas por prêmio, indicações, segunda rodada, Google SSO, tradução
para outros idiomas e integração interna dos horários. Não assumir migração
integral de todos os módulos só porque Filming será integralmente reaproveitado.

## Sucesso verificável

Participantes de teste executam o fluxo de importação, atribuição de acessos,
montagem de painel, observação, conclusão/reabertura e encerramento nas plataformas
previstas, sem acesso indevido nem perda silenciosa de texto. Filming preserva seus
fluxos inventariados. A entrega móvel comprova os alertas nativos em aparelhos.
Critérios detalhados no [PRD](PRD.md); nenhuma validação de execução foi declarada nesta consolidação.

## Referência obrigatória de interface

Aplicar [design-system.md](../design-system.md) à versão final do MVP em web, Android e iOS, através de @fgc/ui. Preservar identidade visual e adaptar as primitivas à plataforma. Fluxos, permissões e estados seguem D01–D74 e T01–T05; a referência visual não acrescenta funcionalidades. Validar acessibilidade, responsividade e estados assíncronos nos fluxos aprovados.
