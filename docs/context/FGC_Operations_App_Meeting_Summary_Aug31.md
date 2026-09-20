# Reunião de 31/08 — contexto consolidado para migração

A demonstração do firstglobal-ops forneceu a referência funcional de Filming, autenticação, pager e acesso de mentores. O trabalho passa a ser integrado no fgc-app, preservando o legado como fonte de consulta.

As propostas iniciais foram refinadas pelas [decisões D01–D74](FGC-MVP-DECISOES.md). O escopo vigente está no [PRD](fgc-mvp/PRD.md) e no [catálogo de paridade](fgc-mvp/migracao-escopo-paridade.md); arquitetura e interfaces seguem [T01–T05](fgc-mvp/contratos-tecnicos.md) e [design-system.md](design-system.md).

Prioridades preservadas: simplicidade para operação no evento, separação de permissões, confiabilidade e tratamento honesto de falhas de conexão. A carga inicial segue D72; não transportar histórico operacional do legado.

As descrições funcionais do protótipo que não integram o MVP e as propostas técnicas substituídas foram removidas deste resumo para que não sejam interpretadas como requisitos de migração.
