begin;
-- Temporary and transaction-scoped, same as 202610040001: lets non-superuser roles replace
-- functions owned by fgc_command. Revoked before commit, so final ACLs are unchanged.
grant create on schema private, api to fgc_command;

-- One role per person. api.access_grant (the only write path for roles) refuses more than one role,
-- including an 'add' that would stack a second role on an existing one, and new or updated
-- approvals can hold at most one. Rows that already hold several roles are left as they are (NOT
-- VALID) until an administrator replaces their role; list them with:
--   select event_id,user_id,array_agg(role) from core.user_event_roles group by 1,2 having count(*)>1;
--   select event_id,email,roles from core.approved_emails where cardinality(roles)>1;
alter table core.approved_emails drop constraint if exists approved_emails_single_role;
alter table core.approved_emails add constraint approved_emails_single_role check(cardinality(roles)<=1) not valid;

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
 -- One role per person: an 'add' on top of a different role is refused, like a list with two roles.
 if cardinality(rs)>1 then raise exception 'VALIDATION_ERROR';end if;
 if 'admin'=any(rs) and rs && array['judge','judgeAdvisor','headReferee']::text[] then raise exception 'FORBIDDEN';end if;
 -- An administrator cannot shed admin and promote themselves into Judging.
 if u.id=a and rs && array['judge','judgeAdvisor','headReferee']::text[] then raise exception 'FORBIDDEN';end if;
 insert into core.approved_emails(event_id,email,roles,version) values(e,em,rs,coalesce(v,0)+1) on conflict(event_id,email) do update set roles=excluded.roles,version=excluded.version returning id into approval_id;
 if u.id is not null then delete from core.user_event_roles where event_id=e and user_id=u.id;insert into core.user_event_roles(event_id,user_id,role) select e,u.id,unnest(rs);update core.users set version=version+1 where id=u.id;end if;
 return private.receipt(a,'access_grant',p_key,p_input,coalesce(u.id,approval_id),coalesce(v,0)+1);end $$;

notify pgrst,'reload schema';
revoke create on schema private, api from fgc_command;
commit;
