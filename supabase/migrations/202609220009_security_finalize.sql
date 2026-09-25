begin;
-- No PUBLIC EXECUTE defaults, including internal helpers and future migrations.
revoke all on all functions in schema api,private from public,anon,authenticated,service_role;
alter default privileges in schema api revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;
grant usage on schema api to authenticated,service_role;
do $$ declare f record;begin
 for f in select p.oid,n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('api','private') loop
  execute format('alter function %I.%I(%s) owner to fgc_command',f.nspname,f.proname,f.args);
  if f.nspname='api' then
   if f.proname like 'staff_auth_%' or f.proname in ('health_check','staff_provision','mentor_rate_limit','mentor_redeem','mentor_logout','mentor_device_put','mentor_device_delete','mentor_respond','mentor_me','mentor_pages','mentor_filming','delivery_claim','delivery_authorize','delivery_finish','purge_due') then
    execute format('grant execute on function api.%I(%s) to service_role',f.proname,f.args);
   else execute format('grant execute on function api.%I(%s) to authenticated',f.proname,f.args);end if;
  elsif f.proname in ('actor','event_id','has_role','require_role','require_judging','require_enabled','require_pages','require_team_read','staff_enabled','judging_access','audit_access','eligible_judge','page_delivery_status','me','schedule','teams_list','pages_list','panels_list','participations_list','observations_list','judging_audit','tracker','categories_list','items_list') then
   execute format('grant execute on function private.%I(%s) to authenticated',f.proname,f.args);
  end if;
 end loop;
end $$;
revoke all on all tables in schema private from anon,authenticated,service_role;
revoke insert,update,delete,truncate,references,trigger on all tables in schema core,judging,filming,messaging,audit from anon,authenticated,service_role;
-- Supabase project config MUST expose only api (not public/domain/private).
notify pgrst,'reload schema';
commit;
