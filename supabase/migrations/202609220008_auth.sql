-- T02: server-only authentication bridge. No direct client table access.
create table private.staff_auth_attempts (
  id uuid primary key,
  email text not null,
  platform text not null check (platform in ('web','mobile')),
  challenge text not null check (length(challenge)=43),
  destination text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create table private.auth_exchanges (
  ticket_hash text primary key,
  challenge text not null,
  platform text not null check (platform in ('web','mobile')),
  ciphertext text not null,
  expires_at timestamptz not null
);
create table private.auth_rate_limits (
  key text primary key,
  count integer not null,
  expires_at timestamptz not null
);
create index on private.staff_auth_attempts(expires_at);
create index on private.auth_exchanges(expires_at);
create index on private.auth_rate_limits(expires_at);

alter table private.staff_auth_attempts enable row level security;
alter table private.staff_auth_attempts force row level security;
alter table private.auth_exchanges enable row level security;
alter table private.auth_exchanges force row level security;
alter table private.auth_rate_limits enable row level security;
alter table private.auth_rate_limits force row level security;
create policy command_access on private.staff_auth_attempts to fgc_command using(true) with check(true);
create policy command_access on private.auth_exchanges to fgc_command using(true) with check(true);
create policy command_access on private.auth_rate_limits to fgc_command using(true) with check(true);
revoke all on private.staff_auth_attempts, private.auth_exchanges, private.auth_rate_limits from public, anon, authenticated, service_role;
grant select,insert,update,delete on private.staff_auth_attempts, private.auth_exchanges, private.auth_rate_limits to fgc_command;

create function api.staff_auth_create_attempt(p_attempt jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
  if (p_attempt->>'expiresAt')::timestamptz > clock_timestamp()+interval '10 minutes 5 seconds' then
    raise exception 'VALIDATION_ERROR';
  end if;
  insert into private.staff_auth_attempts(id,email,platform,challenge,destination,expires_at)
  values ((p_attempt->>'id')::uuid, p_attempt->>'email', p_attempt->>'platform', p_attempt->>'challenge', p_attempt->>'destination', (p_attempt->>'expiresAt')::timestamptz);
end $$;
create function api.staff_auth_get_attempt(p_id uuid) returns jsonb
language sql security definer set search_path='' as $$
  select jsonb_build_object('id',id,'email',email,'platform',platform,'challenge',challenge,'destination',destination,'expiresAt',expires_at)
  from private.staff_auth_attempts where id=p_id and consumed_at is null and expires_at>clock_timestamp();
$$;
create function api.staff_auth_consume_attempt(p_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare found_id uuid;
begin
  update private.staff_auth_attempts set consumed_at=clock_timestamp()
  where id=p_id and consumed_at is null and expires_at>clock_timestamp() returning id into found_id;
  return found_id is not null;
end $$;
create function api.staff_auth_create_exchange(p_exchange jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
  if (p_exchange->>'expiresAt')::timestamptz > clock_timestamp()+interval '65 seconds' then raise exception 'VALIDATION_ERROR'; end if;
  insert into private.auth_exchanges(ticket_hash,challenge,platform,ciphertext,expires_at)
  values(p_exchange->>'ticketHash',p_exchange->>'challenge',p_exchange->>'platform',p_exchange->>'ciphertext',(p_exchange->>'expiresAt')::timestamptz);
end $$;
create function api.staff_auth_consume_exchange(p_hash text,p_challenge text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare value private.auth_exchanges;
begin
  -- Validate PKCE before deleting: a wrong verifier must not consume the legitimate ticket.
  delete from private.auth_exchanges where ticket_hash=p_hash and challenge=p_challenge and expires_at>clock_timestamp() returning * into value;
  if not found then return null; end if;
  return jsonb_build_object('ticketHash',value.ticket_hash,'challenge',value.challenge,'platform',value.platform,'ciphertext',value.ciphertext,'expiresAt',value.expires_at);
end $$;
create function api.staff_auth_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare hits integer;
begin
  if p_limit<1 or p_limit>10000 or p_seconds<1 or p_seconds>86400 or length(p_key)<>64 then raise exception 'VALIDATION_ERROR'; end if;
  insert into private.auth_rate_limits as existing(key,count,expires_at) values(p_key,1,clock_timestamp()+make_interval(secs=>p_seconds))
  on conflict(key) do update set
    count=case when existing.expires_at<=clock_timestamp() then 1 else least(existing.count+1,p_limit+1) end,
    expires_at=case when existing.expires_at<=clock_timestamp() then clock_timestamp()+make_interval(secs=>p_seconds) else existing.expires_at end
  returning count into hits;
  return hits<=p_limit;
end $$;
create function api.staff_auth_cleanup() returns void
language plpgsql security definer set search_path='' as $$
begin
  delete from private.auth_exchanges where expires_at<=clock_timestamp();
  delete from private.staff_auth_attempts where expires_at<=clock_timestamp();
  delete from private.auth_rate_limits where expires_at<=clock_timestamp();
end $$;

-- The final security migration also enforces this whitelist, independently.
alter function api.staff_auth_create_attempt(jsonb) owner to fgc_command;
alter function api.staff_auth_get_attempt(uuid) owner to fgc_command;
alter function api.staff_auth_consume_attempt(uuid) owner to fgc_command;
alter function api.staff_auth_create_exchange(jsonb) owner to fgc_command;
alter function api.staff_auth_consume_exchange(text,text) owner to fgc_command;
alter function api.staff_auth_rate_limit(text,integer,integer) owner to fgc_command;
alter function api.staff_auth_cleanup() owner to fgc_command;
revoke all on function api.staff_auth_create_attempt(jsonb), api.staff_auth_get_attempt(uuid), api.staff_auth_consume_attempt(uuid), api.staff_auth_create_exchange(jsonb), api.staff_auth_consume_exchange(text,text), api.staff_auth_rate_limit(text,integer,integer), api.staff_auth_cleanup() from public, anon, authenticated;
grant execute on function api.staff_auth_create_attempt(jsonb), api.staff_auth_get_attempt(uuid), api.staff_auth_consume_attempt(uuid), api.staff_auth_create_exchange(jsonb), api.staff_auth_consume_exchange(text,text), api.staff_auth_rate_limit(text,integer,integer), api.staff_auth_cleanup() to service_role;
