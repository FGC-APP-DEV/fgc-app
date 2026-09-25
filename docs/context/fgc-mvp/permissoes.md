# Permissões — Judging e cadastro compartilhado

Fonte: [D01–D74](../FGC-MVP-DECISOES.md). Role, vínculo atual, autoria e estado da
equipe devem ser verificados no servidor a cada operação, além da interface.
Líder é uma atribuição dentro do painel, não uma role global adicional.

| Operação | Administrador | JA | Juiz | Líder |
| --- | --- | --- | --- | --- |
| Conceder roles/acesso | Sim | Não | Não | Não |
| Importar cadastro global | Sim | Não | Não | Não |
| Emitir/regenerar código de mentor (D70) | Sim, tela mínima própria | Não | Não | Não |
| Incluir equipe importada em Judging | Não | Sim | Não | Não |
| Criar/gerir painel e designar líder | Não | Sim | Não | Não |
| Transferir juiz ou equipe | Não | Sim, com restrições | Não | Não |
| Consultar observações/avaliações | Não | Todos os painéis | Próprio painel atual | Próprio painel atual |
| Criar observações | Não | Não concedido apenas por ser JA | Equipe ativa e pendente do painel | Como juiz |
| Editar/excluir observações | Não | Não concedido apenas por ser JA | Só próprias, painel atual, equipe ativa e pendente | Como juiz |
| Concluir avaliação | Não | Não, salvo se for líder | Não | Sim, com confirmação |
| Reabrir avaliação | Não | Sim | Não | Sim |
| Retirar/reativar/sinalizar equipe | Não | Sim | Não | Não |
| Encerrar Judging e iniciar prazo de descarte | Não | Sim, duas confirmações | Não | Não |
| Consultar auditoria temporária após encerramento | Não | Sim, somente antes do limite de 24h | Não | Não |

Para o administrador, todas as operações de Judging desta matriz são proibidas
(D62); “Não concedido” em sua coluna significa proibição explícita. Ele gerencia
acessos e importa o cadastro global, sem acesso às informações e funções de Judging.
Não copiar o bypass de admin/superadmin do legado. Negar no servidor leituras
e mutações; ocultar telas não basta. Combinações conflitantes de roles não podem
liberar esse acesso nem permitir autoatribuição para contornar a restrição.
Judge não tem acesso ao Pit Admin por ser Judge (D03).

## Invariantes

- Uma observação editável por juiz/equipe/painel (D68); cardinalidade não amplia permissão de escrita.
- Várias sinalizações informativas simultâneas (D69); retirada permanece estado separado.
- Emissão/regeneração de códigos de mentor é exclusiva do administrador (D70); role Filming isolada não concede essa operação. D71: código 7 dias, sessão 7 dias a partir do resgate; regeneração revoga sessões/vínculos push anteriores.
- Painel nasce com um líder que é um de seus juízes. Um juiz e uma equipe pertencem a no máximo um painel por vez.
- JA só remove/transfere o líder após substituí-lo por outro membro do painel.
- Transferência de juiz remove acesso ao painel anterior, inclusive às próprias observações antigas; elas permanecem no painel de origem.
- Equipe só é transferida pendente e sem observações. Painel só é excluído sem equipes e sem observações.
- Equipe com histórico não é removida: fica retirada, preservando histórico até o encerramento. Apenas JA reativa.
- Conclusão é por equipe/painel, não por juiz. Reabrir não torna equipe retirada ativa automaticamente.
- O JA encerra Judging mediante duas confirmações. Os dashboards operacionais ficam vazios; somente o JA pode consultar a auditoria temporária. Todos os dados de Judging e suas cópias devem ser eliminados permanentemente até 24 horas após o encerramento. Contas, roles, cadastro global e dados independentes de outros módulos permanecem. O prazo é fixo, não renovável por consulta ou retry. A configuração de backups/logs ainda precisa comprovar esse limite.
