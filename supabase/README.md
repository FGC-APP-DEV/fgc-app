# New-project SQL persistence

Migrations target a new Supabase project. They do not import legacy operational
data and must not be pointed at the legacy database. `api` is the only exposed
schema; copy that setting to the managed project as well as local configuration.
Staff RPC calls preserve their Supabase JWT. Service credentials are restricted
to the named mentor, authentication and worker RPCs in migration 009.

The command owner `fgc_command` is NOLOGIN, NOINHERIT and has no BYPASSRLS.
Application tables have forced RLS; only this role has a command policy.
Staff have read policies and no direct table writes. `private.actor()` checks
the JWT's live `auth.sessions` row, not just its signature or metadata roles.

## Disposable verification

The application does not depend on PGlite. Install it in a disposable directory
and pass its entrypoint to the harness:

```powershell
node supabase/tests/run-pglite.mjs C:/path/to/node_modules/@electric-sql/pglite/dist/index.js
```

The harness creates an in-memory PostgreSQL instance, synthetic Supabase Auth
schema and roles, applies every migration in lexical order and executes each
SQL test inside a rolled-back fixture transaction. It does not use network
credentials. The SQL suites can also run against an isolated Supabase test
project after creating suitable synthetic Auth identities; never run fixtures
against production. PGlite does not validate PostgREST or simultaneous sessions.

## Provisioning still required

Provision exactly one active `core.events` row and its initial active
`judging.cycles` row plus approved configuration/teams. Bootstrap the first
approved administrator with infrastructure credentials, never a public RPC.
The first authenticated sign-in provisions internal user identity through the
service-only `staff_provision` command. No demo identity or role is seeded.

Configure `pg_cron` + `pg_net` in the actual Supabase project to call the
authenticated internal worker endpoint each minute. Store the endpoint and
credential in Vault, never in this repository or a cron SQL literal. The worker
must call `delivery_claim`, then `delivery_authorize` immediately before each
external send, and `delivery_finish` with the provider result and `p_attempt`
from the authorization result. Null authorization skips sending and finishing;
expired or replaced attempts cannot update the current lease. Only send the
generic title/body and random delivery ID returned by the authorization RPC.
It must also call `purge_due` and auth cleanup independently of client traffic.
The network call occurs outside the transaction: an already-authorized push can
be in flight at closure, so opening it must reauthenticate and refetch.

`purge_due` starts deleting at closure + 23 hours. RLS stops audit reads at
closure + 24 hours regardless of worker health. Monitor failures and retries;
expired read access is not evidence of deletion. Test the deployed scheduler,
multi-connection races, volume/latency and failure alerts before real use.
Managed backups, logs and all other copies require a separately verified
24-hour physical-deletion policy. These migrations do not prove that guarantee.

A nonexecuted provisioning template is available at [operations/scheduler.sql](operations/scheduler.sql). It separates SQL cleanup from the HTTP delivery worker so API downtime does not prevent database cleanup. Validate on synthetic data and configure failure alerts before operational acceptance.

