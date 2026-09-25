-- Provisioning template, deliberately NOT an automatic migration.
-- Run only on the new provisioned project after enabling pg_cron/pg_net/Vault.
-- Populate Vault through the deployment secret channel, not SQL checked into Git:
--   fgc_worker_url: exact HTTPS URL including /internal/tick
--   fgc_worker_secret: the API WORKER_SECRET, at least 32 characters.
-- Source pattern: https://supabase.com/docs/guides/functions/schedule-functions
begin;
do $$
begin
  if not exists(select 1 from vault.decrypted_secrets where name='fgc_worker_url' and decrypted_secret ~ '^https://[^ ]+/internal/tick$') then
    raise exception 'Configure the exact HTTPS worker URL in Vault first';
  end if;
  if not exists(select 1 from vault.decrypted_secrets where name='fgc_worker_secret' and length(decrypted_secret)>=32) then
    raise exception 'Configure the worker credential in Vault first';
  end if;
end $$;
select cron.schedule('fgc-private-cleanup','* * * * *',
  $$select api.purge_due(); select api.staff_auth_cleanup();$$);
select cron.schedule('fgc-pager-worker','* * * * *',$job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='fgc_worker_url'),
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name='fgc_worker_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$job$);
commit;
-- Verify cron.job_run_details and pg_net response status without printing secrets.
-- HTTP enqueue success is not API success; alert on non-2xx/timeout and stale runs.
-- Prove cleanup on synthetic closed cycles while API is stopped: direct SQL job
-- must keep purging independently. Backups/logs/copies need separate proof.
