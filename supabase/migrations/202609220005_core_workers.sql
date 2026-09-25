begin;
create function api.profile_update(p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare a uuid:=private.actor();u core.users;r jsonb;begin select * into u from core.users where id=a for update;r:=private.replay(a,'profile_update',p_key,p_input);if r is not null then return r;end if;perform private.assert_version(u.version,(p_input->>'expectedVersion')::integer);if coalesce(length(trim(p_input->>'name')),0) not between 1 and 120 then raise exception 'VALIDATION_ERROR';end if;update core.users set name=p_input->>'name',version=version+1 where id=a;return private.receipt(a,'profile_update',p_key,p_input,a,u.version+1);end $$;
grant select on core.approved_emails to authenticated;
create policy approved_read on core.approved_emails for select to authenticated using(event_id=private.event_id() and private.has_role('admin'));
create function api.users_list(p_limit integer default 50,p_after uuid default null) returns jsonb language plpgsql security invoker set search_path='' as $$ declare r jsonb;begin perform private.require_role('admin');
 with candidates as(select u.id,u.email,u.name,u.version,coalesce((select jsonb_agg(role order by role) from core.user_event_roles where event_id=private.event_id() and user_id=u.id),'[]'::jsonb) roles from core.users u union all select p.id,p.email,null,p.version,to_jsonb(p.roles) from core.approved_emails p where p.event_id=private.event_id() and not exists(select 1 from core.users where email=p.email)),page as(select * from candidates where p_after is null or id>p_after order by id limit greatest(1,least(p_limit,100))) select coalesce(jsonb_agg(to_jsonb(page) order by id),'[]'::jsonb) into r from page;return r;end $$;
create function api.access_grant(p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare a uuid:=private.require_role('admin');e uuid:=private.event_id();em text:=lower(trim(p_input->>'email'));rs text[];oldrs text[];u core.users;v integer;r jsonb;approval_id uuid;begin
 perform 1 from core.events where id=e for update;
 r:=private.replay(a,'access_grant',p_key,p_input);if r is not null then return r;end if;
 select array_agg(value) into rs from jsonb_array_elements_text(p_input->'roles');rs:=coalesce(rs,'{}'::text[]);
 if not rs <@ array['admin','judge','judgeAdvisor','filmmaker']::text[] or coalesce(p_input->>'mode','') not in ('add','replace') or coalesce(em,'') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'VALIDATION_ERROR';end if;
 select * into u from core.users where email=em for update;
 if u.id is not null then select coalesce(array_agg(role),'{}'::text[]) into oldrs from core.user_event_roles where event_id=e and user_id=u.id;v:=u.version;
 else select roles,version into oldrs,v from core.approved_emails where event_id=e and email=em for update;end if;
 perform private.assert_version(coalesce(v,0),coalesce((p_input->>'expectedVersion')::integer,0));
 if p_input->>'mode'='add' then select coalesce(array_agg(distinct x),'{}'::text[]) into rs from unnest(rs||coalesce(oldrs,'{}'::text[])) x;end if;
 if 'admin'=any(rs) and rs && array['judge','judgeAdvisor']::text[] then raise exception 'FORBIDDEN';end if;
 -- An administrator cannot shed admin and promote themselves into Judging.
 if u.id=a and rs && array['judge','judgeAdvisor']::text[] then raise exception 'FORBIDDEN';end if;
 insert into core.approved_emails(event_id,email,roles,version) values(e,em,rs,coalesce(v,0)+1) on conflict(event_id,email) do update set roles=excluded.roles,version=excluded.version returning id into approval_id;
 if u.id is not null then delete from core.user_event_roles where event_id=e and user_id=u.id;insert into core.user_event_roles(event_id,user_id,role) select e,u.id,unnest(rs);update core.users set version=version+1 where id=u.id;end if;
 return private.receipt(a,'access_grant',p_key,p_input,coalesce(u.id,approval_id),coalesce(v,0)+1);end $$;
-- Service identity provisioning takes the verified Auth UUID; it never accepts roles.
create function api.staff_provision(p_auth_user_id uuid,p_email text) returns void language plpgsql security definer set search_path='' as $$ declare e uuid:=private.event_id();rs text[];begin
 select roles into rs from core.approved_emails where event_id=e and email=lower(trim(p_email));if rs is null then raise exception 'FORBIDDEN';end if;
 insert into core.users(id,email) values(p_auth_user_id,lower(trim(p_email))) on conflict(id) do nothing;
 insert into core.user_event_roles(event_id,user_id,role) select e,p_auth_user_id,unnest(rs) on conflict do nothing;end $$;
create table core.import_runs(id uuid primary key default gen_random_uuid(),actor_id uuid not null references core.users,input_hash text not null,rows jsonb not null,columns jsonb not null default '[]',sheets jsonb,expires_at timestamptz not null default now()+interval '30 minutes',version integer not null default 1);
create table core.import_results(run_id uuid references core.import_runs on delete cascade,row_number integer,result jsonb not null,primary key(run_id,row_number));
alter table core.import_runs enable row level security;alter table core.import_runs force row level security;alter table core.import_results enable row level security;alter table core.import_results force row level security;
create policy command_access on core.import_runs to fgc_command using(true) with check(true);create policy command_access on core.import_results to fgc_command using(true) with check(true);
grant select,insert,update,delete on core.import_runs,core.import_results to fgc_command;
create function api.import_preview(p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare a uuid:=private.require_role('admin');i uuid;r jsonb;begin r:=private.replay(a,'import_preview',p_key,p_input);if r is not null then return r;end if;if jsonb_typeof(p_input->'rows')<>'array' or jsonb_array_length(p_input->'rows')>5000 or jsonb_typeof(coalesce(p_input->'columns','[]'::jsonb))<>'array' or (p_input->'sheets' is not null and jsonb_typeof(p_input->'sheets')<>'array') then raise exception 'VALIDATION_ERROR';end if;insert into core.import_runs(actor_id,input_hash,rows,columns,sheets) values(a,p_input->>'inputHash',p_input->'rows',coalesce(p_input->'columns','[]'::jsonb),p_input->'sheets') returning id into i;return private.receipt(a,'import_preview',p_key,p_input,i,1);end $$;
create function api.import_read(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare a uuid:=private.require_role('admin');r jsonb;begin select jsonb_strip_nulls(jsonb_build_object('id',ir.id,'version',ir.version,'expiresAt',ir.expires_at,'columns',ir.columns,'sheets',ir.sheets,'rows',(select coalesce(jsonb_agg(case when result is null then rowdata else rowdata||jsonb_build_object('status',result->>'status') end order by ord),'[]'::jsonb) from jsonb_array_elements(ir.rows) with ordinality x(rowdata,ord) left join core.import_results cr on cr.run_id=ir.id and cr.row_number=(rowdata->>'row')::integer),'results',coalesce((select jsonb_agg(result order by row_number) from core.import_results where run_id=p_id),'[]'::jsonb))) into r from core.import_runs ir where ir.id=p_id and actor_id=a and expires_at>now();if r is null then raise exception 'NOT_FOUND';end if;return r;end $$;
create function api.import_row_commit(p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare a uuid:=private.require_role('admin');ir core.import_runs;r jsonb;rowdata jsonb;n integer:=(p_input->>'row')::integer;i uuid;outcome text;begin
 select * into ir from core.import_runs where id=(p_input->>'previewId')::uuid and actor_id=a and expires_at>now() for update;if ir.id is null then raise exception 'NOT_FOUND';end if;
 r:=private.replay(a,'import_row_commit',p_key,p_input);if r is not null then return r;end if;perform private.assert_version(ir.version,(p_input->>'expectedVersion')::integer);
 select value into rowdata from jsonb_array_elements(ir.rows) where (value->>'row')::integer=n;
 if rowdata is null or not private.valid_import_row(rowdata) then raise exception 'VALIDATION_ERROR';end if;
 if exists(select 1 from jsonb_array_elements(ir.rows) x where trim(x->>'officialId')=trim(rowdata->>'officialId') and (trim(x->>'name') is distinct from trim(rowdata->>'name') or x->>'country' is distinct from rowdata->>'country')) then raise exception 'VALIDATION_ERROR';end if;
 if exists(select 1 from core.import_results where run_id=ir.id and row_number=n) then raise exception 'DUPLICATE';end if;
 insert into core.teams(official_id,name,country) values(trim(rowdata->>'officialId'),trim(rowdata->>'name'),trim(rowdata->>'country')) on conflict(official_id) do nothing returning id into i;
 outcome:=case when i is null then 'existing' else 'imported' end;if i is null then select id into i from core.teams where official_id=trim(rowdata->>'officialId');end if;
 insert into core.import_results values(ir.id,n,jsonb_build_object('row',n,'status',outcome));return private.receipt(a,'import_row_commit',p_key,p_input,i,1);end $$;
create function api.mentor_codes_list() returns jsonb language plpgsql security definer set search_path='' as $$ declare r jsonb;begin perform private.require_role('admin');select coalesce(jsonb_agg(jsonb_build_object('teamId',team_id,'version',version,'issuedAt',issued_at,'expiresAt',expires_at)),'[]'::jsonb) into r from private.mentor_codes where event_id=private.event_id();return r;end $$;
-- Scheduler calls this service-only RPC. It never discloses provider tokens until
-- a second, immediately-before-send authorization check in delivery_authorize.
create function api.delivery_claim(p_limit integer default 50) returns jsonb language plpgsql security definer set search_path='' as $$ declare ids jsonb;begin
 update private.deliveries d set status='cancelled',lease_until=null where d.status in ('queued','leased') and not exists(select 1 from messaging.pages p join private.push_devices pd on pd.id=d.device_id join private.mentor_sessions s on s.id=pd.session_id join private.mentor_codes c on c.event_id=s.event_id and c.team_id=s.team_id where p.id=d.page_id and pd.active and s.revoked_at is null and s.expires_at>now() and c.version=s.code_version and s.event_id=p.event_id and s.team_id=p.team_id and p.cancelled_at is null and (p.expires_at is null or p.expires_at>now()) and (p.cycle_id is null or exists(select 1 from judging.cycles where id=p.cycle_id and state='active')) and not exists(select 1 from messaging.responses where page_id=p.id));
 update private.deliveries set status='failed',lease_until=null where status='leased' and lease_until<=now() and attempts>=5;
 update private.deliveries set status='queued',lease_until=null where status='leased' and lease_until<=now() and attempts<5;
 with ready as(select d.id from private.deliveries d join messaging.pages p on p.id=d.page_id where d.status='queued' and d.attempts<5 and d.next_attempt_at<=now() and p.scheduled_for<=now() and p.cancelled_at is null and (p.expires_at is null or p.expires_at>now()) and not exists(select 1 from messaging.responses where page_id=p.id) and (p.cycle_id is null or exists(select 1 from judging.cycles where id=p.cycle_id and state='active')) order by d.next_attempt_at,d.id for update of d skip locked limit greatest(1,least(p_limit,100))), claimed as(update private.deliveries d set status='leased',lease_until=now()+interval '60 seconds',attempts=attempts+1 from ready where d.id=ready.id returning d.id) select coalesce(jsonb_agg(id),'[]'::jsonb) into ids from claimed;return ids;end $$;
create function api.delivery_authorize(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare pg messaging.pages;r jsonb;begin
 select p.* into pg from messaging.pages p join private.deliveries d on d.page_id=p.id where d.id=p_id;
 if pg.cycle_id is not null then perform 1 from judging.cycles where id=pg.cycle_id and state='active' for update;if not found then return null;end if;end if;
 select jsonb_build_object('deliveryId',d.id,'attempt',d.attempts,'token',pd.token,'title','FGC','body','You have a new message.') into r from private.deliveries d join messaging.pages p on p.id=d.page_id join private.push_devices pd on pd.id=d.device_id join private.mentor_sessions s on s.id=pd.session_id join private.mentor_codes c on c.event_id=s.event_id and c.team_id=s.team_id where d.id=p_id and d.status='leased' and d.lease_until>now() and pd.active and s.revoked_at is null and s.expires_at>now() and c.version=s.code_version and s.team_id=p.team_id and s.event_id=p.event_id and p.scheduled_for<=now() and p.cancelled_at is null and (p.expires_at is null or p.expires_at>now()) and not exists(select 1 from messaging.responses where page_id=p.id);
 return r;end $$;
create function api.delivery_finish(p_id uuid,p_accepted boolean,p_invalid_token boolean default false,p_attempt integer default null) returns void language plpgsql security definer set search_path='' as $$ declare device uuid;begin
 update private.deliveries set status=case when p_accepted then 'accepted' when attempts>=5 or p_invalid_token then 'failed' else 'queued' end,lease_until=null,next_attempt_at=now()+make_interval(secs=>power(2,attempts)::integer*30) where id=p_id and status='leased' and attempts=p_attempt and lease_until>clock_timestamp() returning device_id into device;
 if device is not null and p_invalid_token then update private.push_devices set active=false where id=device;end if;end $$;
create function api.purge_due() returns void language plpgsql security definer set search_path='' as $$ declare c uuid;begin
 for c in select id from judging.cycles where state='closed' and closed_at+interval '23 hours'<=now() for update loop
  -- Cascades remove all operational rows, messages, deliveries, receipts and audit.
  delete from judging.observations where cycle_id=c;
  delete from judging.participations where cycle_id=c;
  delete from judging.cycles where id=c;
  insert into audit.purge_receipts(routine_version,result) values('20260922-v1','success');
 end loop;
 delete from audit.purge_receipts where purged_at<=now()-interval '30 days';
 delete from core.import_runs where expires_at<=now();
 delete from private.receipts where expires_at<=now();
end $$;
commit;
