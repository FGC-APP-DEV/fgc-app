# Render Cron Job for `/internal/tick` (pending)

Without this job nothing delivers push notifications; the worker only runs when called.

1. Render dashboard -> New -> Cron Job, same repository.
2. Schedule `* * * * *` (every minute).
3. Command:
   `curl -fsS -X POST -H "Authorization: Bearer $WORKER_SECRET" https://fgc-api-ajvq.onrender.com/internal/tick`
4. Env var `WORKER_SECRET` on the cron job = the same value as on the API web service (min 32 chars).
5. The API web service must not be on the free tier (it sleeps and the tick fails).
6. Use Trigger Run once and confirm `200 {"status":"processed"}` in the logs. A wrong secret returns 403.

Leave `TRUST_PROXY_HOPS` unset on first deploy. Afterwards, request through the Vercel domain,
count the infrastructure IPs after the user IP in `X-Forwarded-For` in the Render logs, set
`TRUST_PROXY_HOPS` to that number (likely 2), and re-check that `req.ip` is the real client IP.

Do not also enable the pg_cron job in `supabase/operations/scheduler.sql`; pick one scheduler.
