# Render Cron Job for `/internal/tick` (pending)

Without this job nothing delivers push notifications; the worker only runs when called.

1. Render dashboard -> New -> Cron Job, same repository.
2. Schedule `* * * * *` (every minute).
3. Command:
   `curl -fsS -X POST -H "Authorization: Bearer $WORKER_SECRET" https://fgc-api-ajvq.onrender.com/internal/tick`
4. Env var `WORKER_SECRET` on the cron job = the same value as on the API web service (min 32 chars).
5. The API web service must not be on the free tier (it sleeps and the tick fails).
6. Use Trigger Run once and confirm `200 {"status":"processed"}` in the logs. A wrong secret returns 403.

Leave `TRUST_PROXY_HOPS` unset (the safe default: no proxy is trusted). Do not set it while clients
reach the API through different paths: the web app goes Vercel -> Render (`vercel.json` rewrites)
but the APK in `apps/fgc-mobile/eas.json` calls Render directly. Express trusts a fixed number of
nearest hops, so a count measured on the longer Vercel route would let a client-supplied
`X-Forwarded-For` become `req.ip` on the shorter direct route and bypass the auth and mentor-redemption
IP rate limits. Only set it after every client uses the same chain (for example point
`EXPO_PUBLIC_API_BASE_URL` at the Vercel domain), then count the infrastructure IPs after the user IP
in `X-Forwarded-For` in the Render logs, set `TRUST_PROXY_HOPS` to that number, and re-check that
`req.ip` is the real client IP from both web and the APK. For the controlled demo, leaving it unset is fine.

Do not also enable the pg_cron job in `supabase/operations/scheduler.sql`; pick one scheduler.
