# FGC MVP — contexto consolidado

Atualização de 19/09/2026 para o [card de documentação](https://trello.com/c/0bqU0KV7).
Regras e contratos de destino documentados; implementação e ambiente pendentes.

## Ordem de leitura

[Diagrama atualizado da arquitetura](arquitetura.html), gerado com Archify. Conteúdo em português; controles e idioma HTML do visualizador em inglês por limitação de localização.

1. [Project brief](project-brief.md): objetivo, público, escopo e prazo.
2. [PRD](PRD.md): requisitos e critérios de aceite.
3. [Regras confirmadas](../FGC-MVP-DECISOES.md): D01–D74, parte obrigatória do contrato.
4. [Permissões](permissoes.md): quem pode fazer o quê.
5. [Arquitetura](architecture.md): estado atual, fronteiras propostas e limitações.
6. [Especificação](SPEC.md): contrato de desenvolvimento e sequência de entrega.
7. [Inventário](inventario.md): evidências locais e diferenças do legado.
8. [Pendências e revisão](pendencias.md): dependências, pontos não resolvidos e verificação documental.
9. [Expo e testes mobile](expo-desenvolvimento.md): adoção aprovada, plano e critérios E01–E06.
10. [Contratos técnicos](contratos-tecnicos.md) e [invariantes](ARCHITECTURE-SPINE.md): T01–T05 e decisões de implementação.
11. [Preparação operacional](prontidao-operacional.md): recursos ausentes, responsáveis por função e evidência para aceite.

As decisões da conversa prevalecem sobre documentos históricos e comportamento
do protótipo. O legado é referência de paridade para Filming e de reaproveitamento
para autenticação/alertas, não fonte para reintroduzir funcionalidades excluídas
de Judging. Detalhes não confirmados estão explicitamente pendentes.

A fonte canônica fica no workspace `contexts/`. Snapshot em `fgc-app/docs/context/`
permite versionar e consultar num checkout isolado; não editar esse snapshot
independentemente da fonte. Nenhum commit/push/publicação remota foi realizado.

## Estado do card

Definições de produto/arquitetura consolidadas até D74; amostra oficial continua
dependência externa. Isso não significa aplicação implementada nem descarte validado.
Ver [fechamento e gates](fechamento.md).

Revisão de 19/09: D71–D74 fecham validade/revogação de mentor, início limpo,
comprovante e manutenção da regra de backups. Usuário confirmou ausência de todos
os recursos operacionais levantados. Diagrama anterior mostra fronteiras históricas;
contratos e spine atuais prevalecem sobre seus detalhes técnicos.

## Migração delimitada e proposta de dados

- [Escopo e critérios por funcionalidade](migracao-escopo-paridade.md).
- [Mapa de 150 arquivos](mapa-arquivos.md), [30 modelos e 2 enums](modelos-legado.md) e [símbolos](simbolos-legado.md).
- [Supabase: schemas, autorização, migração e descarte](supabase-dados-migracao.md).

As propostas de schema não são migrations executáveis nem evidência de implementação.
