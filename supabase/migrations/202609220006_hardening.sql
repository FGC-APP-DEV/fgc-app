begin;
alter table judging.panels add check(length(trim(name)) between 1 and 80);
alter table judging.observations add check(length(trim(notes)) between 1 and 10000);
alter table judging.flags add check(reason is null or length(reason)<=500);
alter table judging.flags add check(type<>'other' or coalesce(length(trim(reason)),0)>0);
alter table judging.participations add check(withdrawal_reason is null or length(withdrawal_reason)<=500);
alter table core.teams add check(length(trim(name)) between 1 and 2000);
alter table core.teams add check(length(trim(country)) between 1 and 2000);
alter table private.push_devices add check(token ~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$');
create index observations_author on judging.observations(author_id);
create index participants_panel on judging.participations(panel_id);
create index pages_recipient_due on messaging.pages(event_id,team_id,scheduled_for,id);
create index deliveries_due on private.deliveries(next_attempt_at,id) where status='queued';
create index sessions_team on private.mentor_sessions(event_id,team_id);
create index devices_session on private.push_devices(session_id);
create function api.health_check() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from core.events where active) $$;
drop policy cycle_read on judging.cycles;
create policy cycle_read on judging.cycles for select to authenticated using((state='active' and event_id=private.event_id() and not private.has_role('admin') and (private.has_role('judge') or private.has_role('judgeAdvisor'))) or private.audit_access(id));
drop policy users_read on core.users;
create policy users_read on core.users for select to authenticated using(id=private.actor() or private.has_role('admin') or private.has_role('judgeAdvisor') or exists(select 1 from judging.observations o where o.author_id=core.users.id and private.judging_access(o.cycle_id,o.panel_id)) or exists(select 1 from judging.members m where m.user_id=core.users.id and private.judging_access(m.cycle_id,m.panel_id)));
create function private.require_judging() returns void language plpgsql security definer set search_path='' as $$ begin if private.has_role('admin') or not(private.has_role('judge') or private.has_role('judgeAdvisor')) then raise exception 'FORBIDDEN';end if;end $$;
create function private.require_enabled() returns void language plpgsql security definer set search_path='' as $$ begin if not private.staff_enabled() then raise exception 'FORBIDDEN';end if;end $$;
create function private.require_pages(source_area text) returns void language plpgsql security definer set search_path='' as $$ begin perform private.require_enabled();if source_area='judges' then perform private.require_judging();elsif source_area='filming' then perform private.require_role('filmmaker');elsif source_area is not null then raise exception 'VALIDATION_ERROR';end if;end $$;
create function private.require_team_read(t uuid) returns void language plpgsql security definer set search_path='' as $$ declare c uuid;begin perform private.require_judging();select id into c from judging.cycles where event_id=private.event_id() and state='active';if c is not null and not exists(select 1 from judging.participations where cycle_id=c and team_id=t and private.judging_access(c,panel_id)) then raise exception 'NOT_FOUND';end if;end $$;
-- Invoker wrappers reject roles even when the underlying relation is empty.
do $$ declare f record;guard text;args text;begin
 for f in select p.oid,p.proname,pg_get_function_identity_arguments(p.oid) identity_args,pg_get_function_arguments(p.oid) definition_args,p.proargnames from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='api' and p.proname in ('me','schedule','teams_list','pages_list','panels_list','participations_list','observations_list','judging_audit','tracker','categories_list','items_list') loop
  guard:=case when f.proname='me' then 'private.actor()' when f.proname in ('schedule','teams_list') then 'private.require_enabled()' when f.proname='pages_list' then 'private.require_pages(p_source_area)' when f.proname='observations_list' then 'private.require_team_read(p_team)' when f.proname='judging_audit' then 'private.require_role(''judgeAdvisor'')' when f.proname in ('tracker','categories_list','items_list') then 'private.require_role(''filmmaker'')' else 'private.require_judging()' end;
  args:=coalesce(array_to_string(f.proargnames,','),'');
  execute format('alter function api.%I(%s) set schema private',f.proname,f.identity_args);
  execute format('create function api.%I(%s) returns jsonb language plpgsql security invoker set search_path='''' as $f$ begin perform %s; return private.%I(%s); end $f$',f.proname,f.definition_args,guard,f.proname,args);
 end loop;
end $$;
create function api.judging_cycle() returns jsonb language plpgsql security invoker set search_path='' as $$ declare r jsonb;begin perform private.require_judging();select jsonb_build_object('id',id,'version',version,'state',state) into r from judging.cycles where state='active' and event_id=private.event_id();return r;end $$;
create function api.judges_list(p_limit integer default 50,p_after uuid default null) returns jsonb language plpgsql security invoker set search_path='' as $$ declare r jsonb;begin perform private.require_role('judgeAdvisor');select coalesce(jsonb_agg(jsonb_build_object('id',u.id,'email',u.email,'name',u.name,'panelId',m.panel_id,'version',coalesce(m.version,0)) order by u.id),'[]'::jsonb) into r from(select * from core.users where (p_after is null or id>p_after) and private.eligible_judge(id) order by id limit greatest(1,least(p_limit,100))) u left join judging.members m on m.user_id=u.id and exists(select 1 from judging.cycles where id=m.cycle_id and state='active');return r;end $$;
create function private.eligible_judge(u uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from core.user_event_roles where event_id=private.event_id() and user_id=u and role='judge') and not exists(select 1 from core.user_event_roles where event_id=private.event_id() and user_id=u and role='admin') $$;
create function api.item_toggle(p_input jsonb,p_key uuid) returns jsonb language sql security definer set search_path='' as $$ select private.filming_command('item_update',p_input,p_key) $$;
create function api.shot_mark(p_input jsonb,p_key uuid) returns jsonb language sql security definer set search_path='' as $$ select private.filming_command('shot_put',p_input,p_key) $$;
create table private.mentor_rate_limits(bucket text primary key,window_start timestamptz not null,hits integer not null,cooldown_until timestamptz);
alter table private.mentor_rate_limits enable row level security;alter table private.mentor_rate_limits force row level security;
create policy command_access on private.mentor_rate_limits to fgc_command using(true) with check(true);
grant select,insert,update,delete on private.mentor_rate_limits to fgc_command;
-- Returns allowed=false rather than raising so rejected attempts are committed.
create function api.mentor_rate_limit(p_ip_hash text,p_installation_id uuid,p_digest text) returns boolean language plpgsql security definer set search_path='' as $$ declare b text;cap integer;win interval;rowdata private.mentor_rate_limits;allowed boolean:=true;n integer;begin
 if p_ip_hash !~ '^[0-9a-f]{64}$' or p_digest !~ '^[0-9a-f]{64}$' or p_installation_id is null then return false;end if;
 for n in 1..4 loop
  b:=case n when 1 then 'ip:'||p_ip_hash when 2 then 'install:'||p_installation_id::text when 3 then 'digest:'||p_digest else 'event:'||private.event_id()::text end;
  cap:=case n when 1 then 5 when 2 then 20 when 3 then 20 else 1000 end;win:=case when n=2 then interval '1 hour' else interval '1 minute' end;
  insert into private.mentor_rate_limits values(b,now(),0,null) on conflict do nothing;
  select * into rowdata from private.mentor_rate_limits where bucket=b for update;
  if rowdata.cooldown_until>now() then allowed:=false;
  else
   if rowdata.window_start+win<=now() then rowdata.hits:=0;rowdata.window_start:=now();end if;
   rowdata.hits:=rowdata.hits+1;
   if rowdata.hits>cap then allowed:=false;end if;
   update private.mentor_rate_limits set hits=rowdata.hits,window_start=rowdata.window_start,cooldown_until=case when rowdata.hits>cap then now()+interval '15 minutes' end where bucket=b;
  end if;
 end loop;return allowed;end $$;
-- ISO alpha-2 allowlist. Input country names must already be mapped in preview.
create function private.valid_import_row(r jsonb) returns boolean language sql immutable set search_path='' as $$ select jsonb_typeof(r)='object' and coalesce(length(trim(r->>'officialId')),0) between 1 and 2000 and coalesce(length(trim(r->>'name')),0) between 1 and 2000 and coalesce(r->>'country','')=any(string_to_array('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW',' ')) $$;
commit;
