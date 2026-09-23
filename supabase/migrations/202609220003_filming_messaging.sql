begin;
create function private.filming_command(op text,p jsonb,k uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare a uuid:=private.require_role('filmmaker');e uuid:=private.event_id();r jsonb;i uuid;v integer;s filming.shots;item filming.items;begin
 perform 1 from core.events where id=e for update;
 r:=private.replay(a,op,k,p);if r is not null then return r;end if;
 case op
 when 'category_create' then insert into filming.categories(event_id,name,description) values(e,p->>'name',p->>'description') returning id,version into i,v;
 when 'item_create' then insert into filming.items(event_id,category_id,title,created_by) values(e,(p->>'categoryId')::uuid,p->>'title',a) returning id,version into i,v;
 when 'item_update','item_delete' then
  select * into item from filming.items where event_id=e and id=(p->>'itemId')::uuid for update;if item.id is null then raise exception 'NOT_FOUND';end if;
  perform private.assert_version(item.version,(p->>'expectedVersion')::integer);
  if op='item_delete' then i:=item.id;v:=item.version+1;delete from filming.items where id=i;
  else update filming.items set done_at=case when (p->>'done')::boolean then now() end,done_by=case when (p->>'done')::boolean then a end,version=version+1 where id=item.id returning id,version into i,v;end if;
 when 'shot_put','shot_clear' then
  select * into s from filming.shots where event_id=e and template_id=(p->>'templateId')::uuid and team_id=(p->>'teamId')::uuid for update;
  perform private.assert_version(coalesce(s.version,0),(p->>'expectedVersion')::integer);
  if s.id is null then insert into filming.shots(event_id,template_id,team_id,status,notes,captured_by,captured_at) values(e,(p->>'templateId')::uuid,(p->>'teamId')::uuid,case when op='shot_clear' then 'pending' else p->>'status' end,case when op<>'shot_clear' then p->>'notes' end,a,now()) returning id,version into i,v;
  else update filming.shots set status=case when op='shot_clear' then 'pending' else p->>'status' end,notes=case when op<>'shot_clear' then p->>'notes' end,captured_by=a,captured_at=now(),version=version+1 where id=s.id returning id,version into i,v;end if;
 else raise exception 'VALIDATION_ERROR';end case;
 return private.receipt(a,op,k,p,i,v);
end $$;
do $$ declare op text;begin foreach op in array array['category_create','item_create','item_update','item_delete','shot_put','shot_clear'] loop execute format('create function api.%I(p_input jsonb,p_key uuid) returns jsonb language sql security definer set search_path='''' as $f$ select private.filming_command(%L,p_input,p_key) $f$',op,op);end loop;end $$;
create function api.page_create(p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare a uuid:=private.actor();e uuid:=private.event_id();c uuid;t judging.participations;r jsonb;i uuid;begin
 if p_input->>'sourceArea'='judges' then c:=private.lock_cycle();select * into t from judging.participations where cycle_id=c and team_id=(p_input->>'teamId')::uuid;if t.id is null or not private.judging_access(c,t.panel_id) then raise exception 'NOT_FOUND';end if;
 elsif p_input->>'sourceArea'='filming' then perform private.require_role('filmmaker');else raise exception 'VALIDATION_ERROR';end if;
 r:=private.replay(a,'page_create',p_key,p_input);if r is not null then return r;end if;
 -- Time is a creation precondition, not a condition for an authorized replay.
 if p_input->>'scheduledFor' is not null and (p_input->>'scheduledFor')::timestamptz<=clock_timestamp() then raise exception 'VALIDATION_ERROR';end if;
 insert into messaging.pages(event_id,cycle_id,team_id,source_area,message,sender_id,scheduled_for,expires_at) values(e,c,(p_input->>'teamId')::uuid,p_input->>'sourceArea',p_input->>'message',a,coalesce((p_input->>'scheduledFor')::timestamptz,now()),(p_input->>'expiresAt')::timestamptz) returning id into i;
 insert into private.deliveries(page_id,device_id,next_attempt_at) select i,d.id,coalesce((p_input->>'scheduledFor')::timestamptz,now()) from private.push_devices d join private.mentor_sessions s on s.id=d.session_id join private.mentor_codes mc on mc.event_id=s.event_id and mc.team_id=s.team_id where d.active and s.event_id=e and s.team_id=(p_input->>'teamId')::uuid and s.revoked_at is null and s.expires_at>now() and mc.version=s.code_version;
 return private.receipt(a,'page_create',p_key,p_input,i,1,c);end $$;
create function api.mentor_code_issue(p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare a uuid:=private.require_role('admin');e uuid:=private.event_id();t uuid:=(p_input->>'teamId')::uuid;r jsonb;v integer;begin
 perform 1 from core.events where id=e for update;
 if coalesce(p_input->>'digest','') !~ '^[0-9a-f]{64}$' then raise exception 'VALIDATION_ERROR';end if;
 if p_key is null then raise exception 'VALIDATION_ERROR';end if;
 perform pg_advisory_xact_lock(hashtextextended(a::text||'mentor_code_issue'||p_key::text,0));
 if exists(select 1 from private.receipts where actor_id=a and operation='mentor_code_issue' and key=p_key) then raise exception 'SECRET_ALREADY_ISSUED';end if;
 select version into v from private.mentor_codes where event_id=e and team_id=t for update;perform private.assert_version(coalesce(v,0),(p_input->>'expectedVersion')::integer);
 insert into private.mentor_codes(event_id,team_id,digest) values(e,t,p_input->>'digest') on conflict(event_id,team_id) do update set digest=excluded.digest,version=private.mentor_codes.version+1,issued_at=now(),expires_at=now()+interval '7 days' returning version into v;
 update private.mentor_sessions set revoked_at=now() where event_id=e and team_id=t and revoked_at is null;
 update private.push_devices set active=false where session_id in(select id from private.mentor_sessions where event_id=e and team_id=t);
 return private.receipt(a,'mentor_code_issue',p_key,p_input,t,v);end $$;
create function private.mentor(h text) returns private.mentor_sessions language plpgsql security definer set search_path='' as $$ declare s private.mentor_sessions;begin
 select ms.* into s from private.mentor_sessions ms join private.mentor_codes c on c.event_id=ms.event_id and c.team_id=ms.team_id and c.version=ms.code_version where ms.token_hash=h and ms.revoked_at is null and ms.expires_at>now() and ms.event_id=private.event_id() for update of ms;
 if s.id is null then raise exception 'UNAUTHENTICATED';end if;return s;end $$;
create function api.mentor_redeem(p_digest text,p_token_hash text) returns jsonb language plpgsql security definer set search_path='' as $$ declare c private.mentor_codes;s private.mentor_sessions;begin
 if p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'VALIDATION_ERROR';end if;
 select * into c from private.mentor_codes where event_id=private.event_id() and digest=p_digest and expires_at>now() for update;
 if c.team_id is null then raise exception 'UNAUTHENTICATED';end if;
 insert into private.mentor_sessions(event_id,team_id,code_version,token_hash) values(c.event_id,c.team_id,c.version,p_token_hash) returning * into s;
 return jsonb_build_object('sessionId',s.id,'teamId',s.team_id,'eventId',s.event_id,'expiresAt',s.expires_at);end $$;
create function api.mentor_logout(p_token_hash text) returns void language plpgsql security definer set search_path='' as $$ declare s private.mentor_sessions:=private.mentor(p_token_hash);begin update private.mentor_sessions set revoked_at=now() where id=s.id;update private.push_devices set active=false where session_id=s.id;end $$;
create function api.mentor_device_put(p_token_hash text,p_input jsonb) returns uuid language plpgsql security definer set search_path='' as $$ declare s private.mentor_sessions:=private.mentor(p_token_hash);i uuid;begin
 -- Registration can add an outbox row; share closure's cycle lock first.
 perform 1 from judging.cycles where event_id=s.event_id and state='active' for update;
 insert into private.push_devices(session_id,installation_id,token,platform,active) values(s.id,(p_input->>'installationId')::uuid,p_input->>'token',p_input->>'platform',coalesce(p_input->>'permission'='granted',false)) on conflict(installation_id) do update set session_id=excluded.session_id,token=excluded.token,platform=excluded.platform,active=excluded.active returning id into i;
 update private.deliveries set status='cancelled',lease_until=null where device_id=i and status in ('queued','leased') and (not coalesce(p_input->>'permission'='granted',false) or page_id in(select id from messaging.pages where team_id<>s.team_id or event_id<>s.event_id));
 if p_input->>'permission'='granted' then insert into private.deliveries(page_id,device_id,next_attempt_at) select p.id,i,greatest(now(),p.scheduled_for) from messaging.pages p where p.team_id=s.team_id and p.event_id=s.event_id and p.cancelled_at is null and (p.expires_at is null or p.expires_at>now()) and (p.cycle_id is null or exists(select 1 from judging.cycles where id=p.cycle_id and state='active')) and not exists(select 1 from messaging.responses where page_id=p.id) on conflict(page_id,device_id) do nothing;end if;
 return i;end $$;
create function api.mentor_device_delete(p_token_hash text,p_installation_id uuid) returns void language plpgsql security definer set search_path='' as $$ declare s private.mentor_sessions:=private.mentor(p_token_hash);begin update private.push_devices set active=false where session_id=s.id and installation_id=p_installation_id;end $$;
create function api.mentor_respond(p_token_hash text,p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$ declare s private.mentor_sessions:=private.mentor(p_token_hash);pg messaging.pages;r jsonb;begin
 select * into pg from messaging.pages where id=(p_input->>'pageId')::uuid and event_id=s.event_id and team_id=s.team_id;
 if pg.cycle_id is not null then perform 1 from judging.cycles where id=pg.cycle_id and state='active' for update;if not found then raise exception 'NOT_FOUND';end if;end if;
 select * into pg from messaging.pages where id=pg.id and scheduled_for<=now() and cancelled_at is null and (expires_at is null or expires_at>now()) for update;
 if pg.id is null then raise exception 'NOT_FOUND';end if;
 if p_input->>'response' not in ('On our way','ETA ~10 min','Can''t come now') or p_input->>'response' is null then raise exception 'VALIDATION_ERROR';end if;
 r:=private.replay(s.id,'mentor_respond',p_key,p_input);if r is not null then return r;end if;
 if exists(select 1 from messaging.responses where page_id=pg.id) then raise exception 'STATE_CONFLICT';end if;
 perform private.assert_version(pg.version,(p_input->>'expectedVersion')::integer);
 insert into messaging.responses(page_id,session_id,response) values(pg.id,s.id,p_input->>'response');
 update messaging.pages set version=version+1 where id=pg.id;
 update private.deliveries set status='cancelled',lease_until=null where page_id=pg.id and status in ('queued','leased');
 -- Mentor is not a core user: receipt belongs to cycle but no staff audit entry.
 r:=jsonb_build_object('commandId',p_key,'entityId',pg.id,'resultingVersion',pg.version+1,'outcome','updated','committedAt',now());
 insert into private.receipts(actor_id,operation,key,payload_hash,result,cycle_id) values(s.id,'mentor_respond',p_key,encode(sha256(convert_to(p_input::text,'UTF8')),'hex'),r,pg.cycle_id);return r;end $$;
commit;


