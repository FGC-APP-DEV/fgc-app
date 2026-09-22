begin;
create function private.judging_command(op text,p jsonb,k uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid:=private.actor(); c uuid; r jsonb; i uuid; v integer; t judging.participations; panel judging.panels; obs judging.observations; member judging.members; fl judging.flags; target judging.panels; intent private.closure_intents; uid uuid;
begin
 perform private.require_judging();
 if op='judging_close' then
  perform private.require_role('judgeAdvisor');
  select cy.id into c from private.receipts rc join judging.cycles cy on cy.id=rc.cycle_id where rc.actor_id=a and rc.operation=op and rc.key=k and cy.state='closed' and cy.purge_due_at>now() for update of cy;
  if c is not null then r:=private.replay(a,op,k,p);return r;end if;
 end if;
 c:=private.lock_cycle();
 if op not in ('observation_put','observation_delete','evaluation_complete','evaluation_reopen') then perform private.require_role('judgeAdvisor'); end if;
 if op in ('observation_put','observation_delete','evaluation_complete','evaluation_reopen','participation_remove','team_transfer','team_withdraw','team_reactivate','flag_put','flag_delete') then
  select * into t from judging.participations where cycle_id=c and team_id=(p->>'teamId')::uuid for update;
  if t.id is null or not private.judging_access(c,t.panel_id) then raise exception 'NOT_FOUND'; end if;
  select * into panel from judging.panels where id=t.panel_id;
 end if;
 if op in ('observation_put','observation_delete') then
  perform private.require_role('judge');
  if t.panel_id is distinct from (p->>'panelId')::uuid or not exists(select 1 from judging.members where cycle_id=c and panel_id=t.panel_id and user_id=a) then raise exception 'NOT_FOUND'; end if;
  if t.state<>'active' or t.evaluation_state<>'pending' then raise exception 'STATE_CONFLICT'; end if;
 end if;
 if op='evaluation_complete' and (panel.leader_id is distinct from a or not private.has_role('judge')) then raise exception 'FORBIDDEN'; end if;
 if op='evaluation_reopen' and not private.has_role('judgeAdvisor') and panel.leader_id is distinct from a then raise exception 'FORBIDDEN'; end if;
 -- Authorization above is repeated even for immutable command replays.
 r:=private.replay(a,op,k,p); if r is not null then return r; end if;
 case op
 when 'panel_create' then
  i:=gen_random_uuid(); uid:=(p->>'leaderId')::uuid;
  if not (p->'judgeIds' ? uid::text) then raise exception 'VALIDATION_ERROR'; end if;
  insert into judging.panels(id,cycle_id,name,leader_id) values(i,c,p->>'name',uid);
  for uid in select value::uuid from jsonb_array_elements_text(p->'judgeIds') loop
   if not exists(select 1 from core.user_event_roles where event_id=private.event_id() and user_id=uid and role='judge') or exists(select 1 from core.user_event_roles where event_id=private.event_id() and user_id=uid and role='admin') then raise exception 'FORBIDDEN'; end if;
   insert into judging.members(cycle_id,panel_id,user_id) values(c,i,uid);
  end loop; v:=1;
 when 'panel_leader' then
  select * into panel from judging.panels where cycle_id=c and id=(p->>'panelId')::uuid for update;
  if panel.id is null then raise exception 'NOT_FOUND'; end if;
  perform private.assert_version(panel.version,(p->>'expectedVersion')::integer);
  if not exists(select 1 from judging.members where cycle_id=c and panel_id=panel.id and user_id=(p->>'leaderId')::uuid) then raise exception 'STATE_CONFLICT'; end if;
  update judging.panels set leader_id=(p->>'leaderId')::uuid,version=version+1 where id=panel.id returning id,version into i,v;
 when 'panel_members' then
  select * into panel from judging.panels where cycle_id=c and id=(p->>'panelId')::uuid for update;
  if panel.id is null then raise exception 'NOT_FOUND';end if;
  perform private.assert_version(panel.version,(p->>'expectedVersion')::integer);
  if not (p->'judgeIds' ? panel.leader_id::text) then raise exception 'STATE_CONFLICT';end if;
  for uid in select value::uuid from jsonb_array_elements_text(p->'judgeIds') loop
   if not exists(select 1 from core.user_event_roles where event_id=private.event_id() and user_id=uid and role='judge') or exists(select 1 from core.user_event_roles where event_id=private.event_id() and user_id=uid and role='admin') then raise exception 'FORBIDDEN';end if;
   if exists(select 1 from judging.members where cycle_id=c and user_id=uid and panel_id<>panel.id) then raise exception 'STATE_CONFLICT';end if;
   insert into judging.members(cycle_id,panel_id,user_id) values(c,panel.id,uid) on conflict(cycle_id,user_id) do nothing;
  end loop;
  delete from judging.members where cycle_id=c and panel_id=panel.id and not (p->'judgeIds' ? user_id::text);
  update judging.panels set version=version+1 where id=panel.id returning id,version into i,v;
 when 'panel_team' then
  select * into panel from judging.panels where cycle_id=c and id=(p->>'panelId')::uuid for update;
  select * into t from judging.participations where cycle_id=c and team_id=(p->>'teamId')::uuid for update;
  if panel.id is null or t.id is null then raise exception 'NOT_FOUND';end if;
  perform private.assert_version(panel.version,(p->>'expectedVersion')::integer);
  if t.panel_id is not null then raise exception 'STATE_CONFLICT';end if;
  update judging.participations set panel_id=panel.id,version=version+1 where id=t.id;
  update judging.panels set version=version+1 where id=panel.id returning id,version into i,v;
 when 'panel_delete' then
  select * into panel from judging.panels where cycle_id=c and id=(p->>'panelId')::uuid for update;
  if panel.id is null then raise exception 'NOT_FOUND'; end if;
  perform private.assert_version(panel.version,(p->>'expectedVersion')::integer);
  if exists(select 1 from judging.participations where panel_id=panel.id) or exists(select 1 from judging.observations where panel_id=panel.id) then raise exception 'STATE_CONFLICT'; end if;
  i:=panel.id; v:=panel.version+1; delete from judging.panels where id=i;
 when 'judge_transfer' then
  select * into member from judging.members where cycle_id=c and user_id=(p->>'judgeId')::uuid for update;
  select * into target from judging.panels where cycle_id=c and id=(p->>'targetPanelId')::uuid for update;
  if member.panel_id is distinct from (p->>'sourcePanelId')::uuid or target.id is null then raise exception 'NOT_FOUND'; end if;
  perform private.assert_version(member.version,(p->>'expectedVersion')::integer);
  select version into v from judging.panels where id=member.panel_id;perform private.assert_version(v,(p->>'sourceVersion')::integer);
  perform private.assert_version(target.version,(p->>'targetVersion')::integer);
  if exists(select 1 from judging.panels where id=member.panel_id and leader_id=member.user_id) then raise exception 'STATE_CONFLICT'; end if;
  update judging.members set panel_id=target.id,version=version+1 where cycle_id=c and user_id=member.user_id returning user_id,version into i,v;
  update judging.panels set version=version+1 where id in (member.panel_id,target.id);
 when 'participation_add' then
  insert into judging.participations(cycle_id,team_id,panel_id) values(c,(p->>'teamId')::uuid,(p->>'panelId')::uuid) returning id,version into i,v;
 when 'participation_remove' then
  perform private.assert_version(t.version,(p->>'expectedVersion')::integer);
  if t.evaluation_state<>'pending' or t.has_history or exists(select 1 from judging.observations where cycle_id=c and team_id=t.team_id) then raise exception 'STATE_CONFLICT'; end if;
  i:=t.id;v:=t.version+1;delete from judging.participations where id=i;
 when 'team_transfer' then
  perform private.assert_version(t.version,(p->>'expectedVersion')::integer);
  select * into target from judging.panels where cycle_id=c and id=(p->>'targetPanelId')::uuid for update;
  if target.id is null or t.panel_id is distinct from (p->>'sourcePanelId')::uuid then raise exception 'NOT_FOUND'; end if;
  perform private.assert_version(target.version,(p->>'targetVersion')::integer);
  if t.evaluation_state<>'pending' or exists(select 1 from judging.observations where cycle_id=c and team_id=t.team_id) then raise exception 'STATE_CONFLICT'; end if;
  select version into v from judging.panels where id=t.panel_id;perform private.assert_version(v,(p->>'sourceVersion')::integer);
  update judging.participations set panel_id=target.id,version=version+1 where id=t.id returning id,version into i,v;
  update judging.panels set version=version+1 where id in (t.panel_id,target.id);
 when 'observation_put','observation_delete' then
  select * into obs from judging.observations where cycle_id=c and team_id=t.team_id and panel_id=t.panel_id and author_id=a for update;
  perform private.assert_version(coalesce(obs.version,0),(p->>'expectedVersion')::integer);
  if op='observation_delete' then
   if obs.id is null then raise exception 'NOT_FOUND'; end if;
   i:=obs.id;v:=obs.version+1;delete from judging.observations where id=i;
  elsif obs.id is null then
   insert into judging.observations(cycle_id,team_id,panel_id,author_id,notes) values(c,t.team_id,t.panel_id,a,p->>'text') returning id,version into i,v;
  else update judging.observations set notes=p->>'text',version=version+1,updated_at=now() where id=obs.id returning id,version into i,v; end if;
 when 'evaluation_complete','evaluation_reopen','team_withdraw','team_reactivate' then
  perform private.assert_version(t.version,(p->>'expectedVersion')::integer);
  if op='evaluation_complete' and (t.state<>'active' or t.evaluation_state<>'pending' or coalesce((p->>'confirmed')::boolean,false)=false) then raise exception 'STATE_CONFLICT'; end if;
  if op='evaluation_reopen' and t.evaluation_state<>'evaluated' then raise exception 'STATE_CONFLICT'; end if;
  if op='team_withdraw' and coalesce(length(trim(p->>'reason')),0)=0 then raise exception 'VALIDATION_ERROR'; end if;
  update judging.participations set evaluation_state=case op when 'evaluation_complete' then 'evaluated' when 'evaluation_reopen' then 'pending' else evaluation_state end,has_history=has_history or op='evaluation_complete',state=case op when 'team_withdraw' then 'withdrawn' when 'team_reactivate' then 'active' else state end,withdrawal_reason=case when op='team_withdraw' then p->>'reason' else withdrawal_reason end,version=version+1 where id=t.id returning id,version into i,v;
 when 'flag_put','flag_delete' then
  select * into fl from judging.flags where cycle_id=c and team_id=t.team_id and type=p->>'type' for update;
  perform private.assert_version(coalesce(fl.version,0),(p->>'expectedVersion')::integer);
  if op='flag_delete' then if fl.id is null then raise exception 'NOT_FOUND'; end if; i:=fl.id;v:=fl.version+1;delete from judging.flags where id=i;
  elsif fl.id is null then insert into judging.flags(cycle_id,team_id,type,reason,author_id) values(c,t.team_id,p->>'type',p->>'reason',a) returning id,version into i,v;
  else update judging.flags set reason=p->>'reason',version=version+1,author_id=a where id=fl.id returning id,version into i,v; end if;
 when 'closure_intent' then
  select version into v from judging.cycles where id=c;perform private.assert_version(v,(p->>'expectedVersion')::integer);
  if coalesce((p->>'confirmed')::boolean,false)=false then raise exception 'VALIDATION_ERROR'; end if;
  insert into private.closure_intents(cycle_id,actor_id) values(c,a) returning id into i; v:=1;
 when 'judging_close' then
  select * into intent from private.closure_intents where id=(p->>'token')::uuid and cycle_id=c and actor_id=a for update;
  if intent.id is null or intent.used_at is not null or intent.expires_at<=now() then raise exception 'STATE_CONFLICT'; end if;
  select version into v from judging.cycles where id=c; perform private.assert_version(v,(p->>'expectedVersion')::integer);
  update private.closure_intents set used_at=now() where id=intent.id;
  update judging.cycles set state='closed',closed_at=now(),purge_due_at=now()+interval '24 hours',closed_by=a,version=version+1 where id=c returning id,version into i,v;
  update messaging.pages set cancelled_at=now() where cycle_id=c;
  update private.deliveries set status='cancelled',lease_until=null where page_id in(select id from messaging.pages where cycle_id=c) and status in ('queued','leased');
 else raise exception 'VALIDATION_ERROR'; end case;
 return private.receipt(a,op,k,p,i,v,c);
end $$;
-- Every exposed command is narrowly named; the generic dispatcher is private.
do $$ declare op text; begin foreach op in array array['panel_create','panel_leader','panel_members','panel_team','panel_delete','judge_transfer','participation_add','participation_remove','team_transfer','observation_put','observation_delete','evaluation_complete','evaluation_reopen','team_withdraw','team_reactivate','flag_put','flag_delete','closure_intent','judging_close'] loop execute format('create function api.%I(p_input jsonb,p_key uuid) returns jsonb language sql security definer set search_path='''' as $f$ select private.judging_command(%L,p_input,p_key) $f$',op,op); end loop; end $$;
commit;

