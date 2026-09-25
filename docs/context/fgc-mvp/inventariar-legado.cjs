// Inventário documental somente leitura do legado; não executa código da aplicação.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const workspace = [path.resolve(__dirname, '../..'), path.resolve(__dirname, '../../../..')].find(p => fs.existsSync(path.join(p, 'firstglobal-ops/prisma/schema.prisma')));
if (!workspace) throw new Error('Execute no workspace com firstglobal-ops disponível.');
const legacy = path.join(workspace, 'firstglobal-ops');
const gitArgs = ['-c', `safe.directory=${legacy.replaceAll('\\','/')}`];
const files = cp.execFileSync('git', [...gitArgs, 'ls-files', '-z'], { cwd: legacy, encoding: 'utf8' }).split('\0').filter(Boolean).sort();
const revision = cp.execFileSync('git', [...gitArgs, 'rev-parse', 'HEAD'], { cwd: legacy, encoding: 'utf8' }).trim();
const domains = {admin:'admin',judges:'judging',filming:'filming',mentor:'mentor','pit-admin':'pit-admin',announcement:'messaging','page-team':'messaging',pages:'messaging',announcements:'messaging',locator:'teams',schedule:'schedule',ui:'ui',supabase:'auth'};
function assignment(p) {
  if (/src\/(lib\/schedule|components\/judges\/match-list|lib\/judges\/match-list|components\/mentor\/(matches-view|schedule-view|day-picker)|app\/api\/cron\/sync-matches)|prisma\/sync-(matches|rankings|teams)|prisma\/seed-mock-schedule/.test(p)) return ['programação','backlog: libs/schedule; MVP: link externo','adiar','D05–D06: horários integrados e sync não entram no MVP; preservar fonte sem ativar.'];
  if (/src\/(lib\/announcements|components\/announcement|components\/mentor\/mentor-announcements-list|app\/pit-admin\/page|components\/pit-admin\/pit-admin-tabs)/.test(p)) return ['fora do escopo','referência futura de Pit Admin/anúncios','adiar','Escopo confirmado: Filming/Judging e dependências; não migrar módulo completo.'];
  if (p==='src/lib/auth.ts'||p.startsWith('src/lib/supabase/')) return ['auth','libs/auth/src + libs/server/src/auth + apps/fgc-api/src','adaptar','Supabase Auth; separar cliente/servidor; sem bypass admin em Judging; contrato T02/T03 em contratos-tecnicos.md.'];
  if (p==='src/lib/db.ts') return ['dados','supabase/migrations + acesso Supabase tipado','substituir','Eliminar cliente Prisma; não introduzir Drizzle.'];
  if (p==='src/components/pit-admin/mentor-codes-panel.tsx') return ['admin','libs/admin/src/components/mentor-codes-panel.tsx','adaptar','Tela mínima do administrador conforme D70/D71; sem módulo Pit Admin.'];
  if (p==='src/components/locator/team-map.tsx') return ['ui','libs/ui/src/components/TeamMap.tsx','adaptar','Apresentação sem acesso a dados; shells compõem dados autorizados; design-system.md.'];
  if (p.startsWith('src/components/')) {
    const rest=p.slice(15), [folder,...tail]=rest.split('/'), domain=domains[folder]||'shared';
    return [domain, `libs/${domain}/src/components/${tail.join('/')}`, 'adaptar', 'Reescrever DOM/Next/Tailwind em RN/RN Web; preservar fluxo conforme catálogo.'];
  }
  if (p.startsWith('src/lib/')) {
    const rest=p.slice(8), folder=rest.split('/')[0], domain=domains[folder]||'shared';
    const body=fs.readFileSync(path.join(legacy,p),'utf8');
    const server=/prisma|next\/headers|use server|node:crypto/.test(body);
    return [domain, server ? `libs/server/src/${domain}/${rest.split("/").slice(1).join("/") || rest}` : `libs/${domain}/src/${rest.split("/").slice(1).join("/") || rest}`, 'adaptar', server ? 'Casos de uso em @fgc/server; REST em apps/fgc-api; SQL/RPC em @fgc/database e supabase/migrations; contratos T01/T04.' : 'Reutilizar lógica pura conforme contratos T01/T04; tipos públicos em @fgc/contracts e utilitários em @fgc/shared.'];
  }
  if (p==='src/proxy.ts') return ['auth','libs/auth/src/session + shells web/mobile','substituir','Refresh/cookies Next viram adaptadores por plataforma; contrato T02/T03 em contratos-tecnicos.md.'];
  if (p.startsWith('src/app/')) {
    const rest=p.slice(8), domain=domains[rest.split('/')[0]]||'auth';
    if (p.endsWith('route.ts')) return ['server',`apps/fgc-api/src/${rest.replace(/\/route.ts$/,'')}.ts`,'adaptar','Health/cron autenticados; sync de horários permanece evolução conforme D05–D06.'];
    if (p.endsWith('actions.ts')) return [domain,`libs/server/src/auth/${rest}`,'adaptar','Separar comando seguro de navegação Next; protocolo REST/sessão T01/T02.'];
    if (p.endsWith('page.tsx')) return [domain,`libs/${domain}/src/screens/${rest.replace(/\/page.tsx$/,'')}.tsx + apps/fgc-{web,mobile}`,'adaptar','Registrar rota em cada shell; ajustar Judging e horários às decisões atuais.'];
    return ['shell','apps/fgc-web + apps/fgc-mobile + libs/ui','adaptar','Separar layout/metadados/PWA web de assets, tema e configuração nativa.'];
  }
  if (p==='prisma/schema.prisma') return ['dados','supabase/migrations/*.sql + libs/database/src/database.types.ts','substituir','Todos os modelos mapeados em modelos-legado.md; sem Prisma/Drizzle no destino.'];
  if (p.startsWith('prisma/migrations/')) return ['dados','arquivo de referência do legado; novas migrations SQL Supabase','referência','Não reaplicar migrations Prisma sobre o destino; extrair relações/constraints necessárias.'];
  if (p.startsWith('prisma/')) return ['dados',`supabase/seed.sql ou tools/migration/${path.basename(p)}`,'adaptar','Separar fixtures de dados reais; sync externo posterior; atribuição de roles não permite bypass.'];
  if (p.startsWith('public/')) return ['assets',`apps/fgc-web/public/${p.slice(7)} ou libs/ui/src/assets/${path.basename(p)}`,'avaliar','Preservar assets usados; logos de template só com necessidade confirmada; conferir resolução/licença.'];
  if (p==='.env.example') return ['configuração','exemplos por app e Supabase','adaptar','Somente nomes de variáveis; segredos exclusivamente no servidor.'];
  if (/\.md$/.test(p)) return ['documentação','contexts/fgc-mvp + documentação da migração','referência','Preservar origem; regras atuais prevalecem sobre instruções históricas.'];
  return ['configuração','configuração Nx/RN/Supabase equivalente','substituir','Não copiar setup Next/Prisma ou lockfile para o monorepo; verificar necessidade individual.'];
}
const rows=files.map((p,i)=>{const [domain,target,action,adaptation]=assignment(p); return {id:`AR-${String(i+1).padStart(3,'0')}`,source:p,domain,target,action,adaptation};});
const lines=['# Mapa por arquivo — firstglobal-ops → fgc-app','',`Base: \`${revision}\`. ${rows.length} arquivos rastreados pelo Git. Gerado de fontes locais; não contém dados ou segredos do ambiente.`, '', 'Destinos seguem T01–T04 em contratos-tecnicos.md; os pacotes serão materializados na implementação. O catálogo M01–M30 define inclusão/exclusão. Caminhos indicam responsabilidade, sem impor correspondência de um arquivo por arquivo. Interface segue ../design-system.md.', '', '| ID | Origem | Domínio | Destino proposto | Ação | Adaptação |','| --- | --- | --- | --- | --- | --- |',...rows.map(r=>`| ${r.id} | \`${r.source}\` | ${r.domain} | \`${r.target}\` | ${r.action} | ${r.adaptation} |`)];
fs.writeFileSync(path.join(__dirname,'mapa-arquivos.md'),lines.join('\n')+'\n');
fs.writeFileSync(path.join(__dirname,'mapa-arquivos.json'),JSON.stringify({revision,files:rows},null,2)+'\n');
const symbolLines=['# Símbolos e validações extraídos do legado','','Índice da origem para rastreabilidade; símbolos não aprovam funcionalidades. Implementar apenas M01–M30 conforme T01–T04.',''];
let symbolCount=0;
for (const p of files.filter(p=>/^src\//.test(p)&&/\.(ts|tsx)$/.test(p))) {
  const body=fs.readFileSync(path.join(legacy,p),'utf8');
  const hits=body.split(/\r?\n/).flatMap((line,i)=>/^export\s|^const \w+(Input|Schema)\s*=|requireRole\(/.test(line.trim()) ? [`- L${i+1}: \`${line.trim().replace(/`/g,"'")}\``]:[]);
  if(hits.length){symbolCount+=hits.length;symbolLines.push(`## ${p}`,'',...hits,'');}
}
fs.writeFileSync(path.join(__dirname,'simbolos-legado.md'),symbolLines.join('\n'));
const schema=fs.readFileSync(path.join(legacy,'prisma/schema.prisma'),'utf8');
const models=[...schema.matchAll(/^(model|enum) (\w+) \{([\s\S]*?)^\}/gm)];
const schemaFor = n => /^(Judge|Panel|TeamEvaluation|TeamAward|AwardKey)/.test(n)?'judging':/^(Filming|TeamShot)/.test(n)?'filming':/^(Page|Announcement)/.test(n)?'messaging':/^Mentor/.test(n)?'private':/^(Match|Ranking|Schedule)/.test(n)?'schedule':n==='AuditLog'?'audit':'core';
const md=['# Modelos, campos e constraints do legado','','Extração integral dos blocos Prisma para referência; destino SQL Supabase proposto, não migration executável.','', '| Modelo/enum | Destino proposto | Tratamento |','| --- | --- | --- |'];
for(const [,kind,name,body] of models){ const table=body.match(/@@map\("([^"]+)"\)/)?.[1]||name; let status='Preservar semântica; adaptar SQL/RLS/FKs.';
if(name==='TeamEvaluation')status='Converter em observações; sem round/prêmios; manter autoria e painel.';
if(name==='JudgePanel')status='Adicionar líder obrigatório e ciclo de Judging; remover award.';
if(name==='PanelMember')status='Unicidade juiz/ciclo; líder deve ser membro.';
if(name==='PanelTeamAssignment')status='Separar participação, estado e flags; sem round.';
if(name==='PanelTeamStatus')status='Substituir por pending/evaluated + active/withdrawn.';
if(name==='TeamAwardCandidacy'||name==='AwardKey')status='Fora do MVP aprovado; não migrar para uso operacional.';
if(/^(Match|Ranking|Schedule)/.test(name))status='Mapeado para evolução; link provisório continua no MVP.';
if(name==='ProductionInterview')status='Modelo existe sem módulo completo; não criar produto especulativo.';
if(name==='Announcement'||name==='AnnouncementRead')status='Fora do recorte atual; preservar fonte para evolução, sem migrar anúncios completos.';
if(name==='TeamResource')status='Estrutura legada inventariada; upload/portfolio não aprovado no MVP, ativação adiada.';
const excluded=/^(Match|Ranking|Schedule)/.test(name)||['TeamAwardCandidacy','AwardKey','ProductionInterview','Announcement','AnnouncementRead','TeamResource'].includes(name);
md.push(`| ${name} (${kind}) | \`${excluded ? 'sem destino operacional no MVP' : schemaFor(name)+'.'+table}\` | ${status} |`);}
for(const [,kind,name,body] of models)md.push('',`## ${name}`,'','```prisma',`${kind} ${name} {${body}}`,'```');
fs.writeFileSync(path.join(__dirname,'modelos-legado.md'),md.join('\n')+'\n');
console.log(JSON.stringify({files:rows.length,models:models.filter(m=>m[1]==='model').length,enums:models.filter(m=>m[1]==='enum').length,symbolsAndGuards:symbolCount,revision}));
