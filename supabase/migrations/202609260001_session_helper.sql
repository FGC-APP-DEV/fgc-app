begin;
-- Managed Supabase does not let the migration role grant USAGE on schema auth to
-- fgc_command (the GRANT in migration 001 is a silent no-op there), so functions
-- owned by fgc_command cannot call auth.uid()/auth.jwt() or read auth.sessions.
-- This helper is the only code that touches auth. It is created by the migration
-- role, which can reach auth, and is deliberately NOT reassigned to fgc_command.
create or replace function private.session_actor() returns uuid language plpgsql stable security definer set search_path='' as $$ declare u uuid:=auth.uid(); s uuid; begin
 begin s:=(auth.jwt()->>'session_id')::uuid; exception when others then raise exception 'UNAUTHENTICATED'; end;
 if u is null or s is null or not exists(select 1 from auth.sessions where id=s and user_id=u and (not_after is null or not_after>now())) then raise exception 'UNAUTHENTICATED'; end if;
 return u; end $$;
revoke all on function private.session_actor() from public,anon,authenticated,service_role;
grant execute on function private.session_actor() to fgc_command;
-- Same contract as before (live session required, then a provisioned user); only
-- the auth access moved into the helper. CREATE OR REPLACE keeps owner and grants.
create or replace function private.actor() returns uuid language plpgsql stable security definer set search_path='' as $$ declare u uuid:=private.session_actor(); begin
 if not exists(select 1 from core.users where id=u) then raise exception 'FORBIDDEN'; end if; return u; end $$;
commit;
