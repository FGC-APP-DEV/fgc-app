# Judging — escopo vigente do MVP

O contrato do módulo está no [PRD](fgc-mvp/PRD.md), nas [decisões](FGC-MVP-DECISOES.md) e na [matriz de permissões](fgc-mvp/permissoes.md).

JA organiza painéis e designa líder; juízes observam equipes do próprio painel; somente o líder conclui e líder/JA reabrem. Observações, sinalizações, retirada e progresso seguem D09–D33/D68/D69. Encerramento e descarte seguem D65/D73/D74.

A interface segue o [design system](design-system.md). O [catálogo M01–M30](fgc-mvp/migracao-escopo-paridade.md) delimita os fluxos a implementar. As antigas propostas de prêmios, segunda rodada, uploads e horários integrados foram retiradas deste contrato.

## Head referee (`headReferee`)

Papel separado de admin (não pode ser combinado com `admin`) e do papel de juiz. Lê as anotações de todos os painéis (`api.referee_annotations`) e escreve as próprias "Refs notes" por equipe (`referee_note_put/delete`, uma nota por árbitro e equipe, com versão). Juízes do painel da equipe e JAs leem essas notas em modo somente leitura (`api.referee_notes_list`), na tela da equipe. As notas pertencem ao ciclo e são descartadas junto com ele.

## Pessoas sem papel

Quem está cadastrado (aprovado) sem nenhum papel entra e vê apenas a Home e os Recursos úteis (`capabilities().member`); `/me` e `/me/profile` valem para qualquer pessoa cadastrada, e nenhum outro dado é exposto (a RLS continua exigindo um papel).
