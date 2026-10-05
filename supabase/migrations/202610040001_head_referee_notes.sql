begin;
-- Temporary and transaction-scoped, same as 202609290001: lets non-superuser roles hand function
-- ownership to fgc_command. Revoked before commit, so final ACLs are unchanged.
grant create on schema private, api to fgc_command;

-- Head referee: a new staff role that reads every team's Judging annotations and writes its own
-- "refs notes" topic per team, which the judges of that team's panel can read.
do $$ declare c record; begin
 for c in select conrelid::regclass t,conname from pg_constraint where contype='c' and conrelid in ('core.user_event_roles'::regclass,'core.approved_emails'::regclass) and pg_get_constraintdef(oid) like '%judgeAdvisor%' loop
  execute format('alter table %s drop constraint %I',c.t,c.conname);
 end loop;
end $$;
alter table core.user_event_roles add constraint user_event_roles_role_check check(role in ('admin','judge','judgeAdvisor','filmmaker','headReferee'));
alter table core.approved_emails add constraint approved_emails_roles_check check(roles <@ array['admin','judge','judgeAdvisor','filmmaker','headReferee']::text[]);

-- Same body as 202609220005 with headReferee accepted and kept apart from the admin role.
create or replace function api.access_grant(p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare a uuid:=private.require_role('admin');e uuid:=private.event_id();em text:=lower(trim(p_input->>'email'));rs text[];oldrs text[];u core.users;v integer;r jsonb;approval_id uuid;begin
 perform 1 from core.events where id=e for update;
 r:=private.replay(a,'access_grant',p_key,p_input);if r is not null then return r;end if;
 select array_agg(value) into rs from jsonb_array_elements_text(p_input->'roles');rs:=coalesce(rs,'{}'::text[]);
 if not rs <@ array['admin','judge','judgeAdvisor','filmmaker','headReferee']::text[] or coalesce(p_input->>'mode','') not in ('add','replace') or coalesce(em,'') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'VALIDATION_ERROR';end if;
 select * into u from core.users where email=em for update;
 if u.id is not null then select coalesce(array_agg(role),'{}'::text[]) into oldrs from core.user_event_roles where event_id=e and user_id=u.id;v:=u.version;
 else select roles,version into oldrs,v from core.approved_emails where event_id=e and email=em for update;end if;
 perform private.assert_version(coalesce(v,0),coalesce((p_input->>'expectedVersion')::integer,0));
 if p_input->>'mode'='add' then select coalesce(array_agg(distinct x),'{}'::text[]) into rs from unnest(rs||coalesce(oldrs,'{}'::text[])) x;end if;
 if 'admin'=any(rs) and rs && array['judge','judgeAdvisor','headReferee']::text[] then raise exception 'FORBIDDEN';end if;
 -- An administrator cannot shed admin and promote themselves into Judging.
 if u.id=a and rs && array['judge','judgeAdvisor','headReferee']::text[] then raise exception 'FORBIDDEN';end if;
 insert into core.approved_emails(event_id,email,roles,version) values(e,em,rs,coalesce(v,0)+1) on conflict(event_id,email) do update set roles=excluded.roles,version=excluded.version returning id into approval_id;
 if u.id is not null then delete from core.user_event_roles where event_id=e and user_id=u.id;insert into core.user_event_roles(event_id,user_id,role) select e,u.id,unnest(rs);update core.users set version=version+1 where id=u.id;end if;
 return private.receipt(a,'access_grant',p_key,p_input,coalesce(u.id,approval_id),coalesce(v,0)+1);end $$;

create table judging.referee_notes(id uuid primary key default gen_random_uuid(),cycle_id uuid not null,team_id uuid not null,author_id uuid not null references core.users,notes text not null check(length(notes)<=20000),version integer not null default 1,updated_at timestamptz not null default now(),unique(cycle_id,team_id,author_id),foreign key(cycle_id,team_id) references judging.participations(cycle_id,team_id) on delete cascade);
alter table judging.referee_notes enable row level security;
alter table judging.referee_notes force row level security;
create policy command_access on judging.referee_notes to fgc_command using(true) with check(true);
grant select,insert,update,delete on judging.referee_notes to fgc_command;
-- No direct client reads: staff go through the api.referee_* functions below.
revoke all on judging.referee_notes from public,anon,authenticated;

create function private.require_head_referee() returns void language plpgsql security definer set search_path='' as $$ begin if private.has_role('admin') or not private.has_role('headReferee') then raise exception 'FORBIDDEN'; end if; end $$;
alter function private.require_head_referee() owner to fgc_command;
grant execute on function private.require_head_referee() to fgc_command;

-- Every team of the active cycle with its panel, all judges' annotations and the refs notes.
create function api.referee_annotations() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c uuid;
begin
 perform private.require_head_referee();
 select id into c from judging.cycles where event_id=private.event_id() and state='active';
 if c is null then return '[]'::jsonb; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('teamId',t.id,'officialId',t.official_id,'teamName',t.name,'country',t.country,'panelId',p.id,'panelName',p.name,
   'observations',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'authorId',o.author_id,'authorName',coalesce(u.name,u.email),'panelId',o.panel_id,'teamId',o.team_id,'text',o.notes,'version',o.version,'updatedAt',o.updated_at) order by o.updated_at desc,o.id) from judging.observations o join core.users u on u.id=o.author_id where o.cycle_id=c and o.team_id=t.id),'[]'::jsonb),
   'notes',coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'authorId',n.author_id,'authorName',coalesce(u.name,u.email),'teamId',n.team_id,'text',n.notes,'version',n.version,'updatedAt',n.updated_at) order by n.updated_at desc,n.id) from judging.referee_notes n join core.users u on u.id=n.author_id where n.cycle_id=c and n.team_id=t.id),'[]'::jsonb))
   order by t.country,t.name,t.id)
  from judging.participations pa join core.teams t on t.id=pa.team_id left join judging.panels p on p.id=pa.panel_id and p.cycle_id=pa.cycle_id where pa.cycle_id=c),'[]'::jsonb);
end $$;
alter function api.referee_annotations() owner to fgc_command;
revoke all on function api.referee_annotations() from public,anon;
grant execute on function api.referee_annotations() to authenticated;

-- Refs notes of one team: the head referee reads any team; judges and judge advisors only the
-- teams they can already read (their own panel; the advisor sees every panel).
create function api.referee_notes_list(p_team uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c uuid;
begin
 if private.has_role('headReferee') and not private.has_role('admin') then null;
 else perform private.require_team_read(p_team); end if;
 select id into c from judging.cycles where event_id=private.event_id() and state='active';
 if c is null then return '[]'::jsonb; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'authorId',n.author_id,'authorName',coalesce(u.name,u.email),'teamId',n.team_id,'text',n.notes,'version',n.version,'updatedAt',n.updated_at) order by n.updated_at desc,n.id) from judging.referee_notes n join core.users u on u.id=n.author_id where n.cycle_id=c and n.team_id=p_team),'[]'::jsonb);
end $$;
alter function api.referee_notes_list(uuid) owner to fgc_command;
revoke all on function api.referee_notes_list(uuid) from public,anon;
grant execute on function api.referee_notes_list(uuid) to authenticated;

create function private.referee_command(op text,p jsonb,k uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid:=private.actor(); c uuid; r jsonb; i uuid; v integer; tid uuid:=(p->>'teamId')::uuid; n judging.referee_notes; txt text:=btrim(coalesce(p->>'text',''));
begin
 perform private.require_head_referee();
 select id into c from judging.cycles where event_id=private.event_id() and state='active' for update;
 if c is null then raise exception 'STATE_CONFLICT'; end if;
 if not exists(select 1 from judging.participations where cycle_id=c and team_id=tid) then raise exception 'NOT_FOUND'; end if;
 r:=private.replay(a,op,k,p); if r is not null then return r; end if;
 select * into n from judging.referee_notes where cycle_id=c and team_id=tid and author_id=a for update;
 if op='referee_note_put' then
  if length(txt) not between 1 and 10000 then raise exception 'VALIDATION_ERROR'; end if;
  if n.id is null then
   perform private.assert_version(0,(p->>'expectedVersion')::integer);
   insert into judging.referee_notes(cycle_id,team_id,author_id,notes) values(c,tid,a,txt) returning id,version into i,v;
  else
   perform private.assert_version(n.version,(p->>'expectedVersion')::integer);
   update judging.referee_notes set notes=txt,version=version+1,updated_at=now() where id=n.id returning id,version into i,v;
  end if;
 elsif op='referee_note_delete' then
  if n.id is null then raise exception 'NOT_FOUND'; end if;
  perform private.assert_version(n.version,(p->>'expectedVersion')::integer);
  i:=n.id; v:=n.version+1; delete from judging.referee_notes where id=n.id;
 else raise exception 'VALIDATION_ERROR'; end if;
 return private.receipt(a,op,k,p,i,v,c);
end $$;
alter function private.referee_command(text,jsonb,uuid) owner to fgc_command;
grant execute on function private.referee_command(text,jsonb,uuid) to fgc_command;
create function api.referee_note_put(p_input jsonb,p_key uuid) returns jsonb language sql security definer set search_path='' as $$ select private.referee_command('referee_note_put',p_input,p_key) $$;
create function api.referee_note_delete(p_input jsonb,p_key uuid) returns jsonb language sql security definer set search_path='' as $$ select private.referee_command('referee_note_delete',p_input,p_key) $$;
alter function api.referee_note_put(jsonb,uuid) owner to fgc_command;
alter function api.referee_note_delete(jsonb,uuid) owner to fgc_command;
revoke all on function api.referee_note_put(jsonb,uuid),api.referee_note_delete(jsonb,uuid) from public,anon;
grant execute on function api.referee_note_put(jsonb,uuid),api.referee_note_delete(jsonb,uuid) to authenticated;
notify pgrst,'reload schema';
revoke create on schema private, api from fgc_command;
commit;
