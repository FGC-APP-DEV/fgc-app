# FGC — competition operations

Nx/npm workspace for the approved firstglobal-ops migration: React Native Web,
Express REST `/api/v1`, Supabase SQL/Auth and Expo SDK57 Android/iOS.

**Migration remains in progress.** See [execution status](docs/firstglobal-ops/execution-status.md)
for verified checks, incomplete parity and external acceptance requirements.
Canonical product/design decisions live in the parent workspace `contexts/`.

## Local setup

Use Node >=22.13.0 and run commands from this repository. Install locked packages
with `npm ci`. Copy `.env.local.example` to `.env.local` and fill provisioned
server values. The API reads this file; the browser never receives service keys.
There is no passwordless demo login or local Drizzle database path. To explore the
complete app **without any external service**, use the mock environment below.

The new Supabase project must be configured from `supabase/migrations` in order
(see [Applying migrations](#applying-migrations)). Expose only `api`. Configure Auth email templates/SMTP, active event, initial
administrator preapproval and Step & Repeat template using the approved event
information. Read [SQL report](docs/firstglobal-ops/sql-report.md) and
[Auth setup](docs/firstglobal-ops/auth-report.md) before provisioning.
Do not use real Judging content until the physical 24-hour retention requirement
is proven for the database, backups, logs and copies.

## Applying migrations

Nothing applies migrations automatically: the app and the API never run them and CI
only verifies them against in-memory PostgreSQL (PGlite). Apply them by hand, in
order, to the Supabase project.

1. **Back up first.** Take a backup (Dashboard → Database → Backups) and note the
   last applied migration.
2. **Find what is pending.** Compare `supabase/migrations/*.sql` (lexical order) with
   `select version, name from supabase_migrations.schema_migrations order by 1;`.
   Only apply files that are not registered yet.
3. **Apply each pending file, oldest first**, either
   - in the **SQL Editor**: paste the whole file and run it (each file is meant to run
     as one transaction), then register it with
     `insert into supabase_migrations.schema_migrations (version, name) values ('<timestamp>', '<name>');`; or
   - with the **CLI**: `supabase link --project-ref <ref>` then `supabase db push`.
4. **Verify**: re-run the `schema_migrations` query, exercise the affected flows in
   the app, and check the Supabase logs for permission errors.

Things to know:

- The Supabase `postgres` role is **not** a superuser, unlike the PGlite role used by
  `npm run test:sql`. A migration that hands function ownership to `fgc_command`
  needs `grant create on schema private to fgc_command` (and a `revoke` afterwards)
  inside the same transaction, as `202609290001` does; otherwise it fails with
  `permission denied for schema private`. Preferably also run the SQL tests as a
  non-superuser role.
- The `auth` and `security_finalize` migrations are registered in Supabase as
  `20260925151407` and `20260925151415` but live in the repository as
  `202609220008` and `202609220009`. Until reconciled, `supabase db push` will try to
  apply them again: run `supabase migration repair --status reverted 20260925151407 20260925151415`
  and `supabase migration repair --status applied 202609220008 202609220009`, or
  rename the files to the registered versions.
- There is a single Supabase project (no staging). For risky migrations use a
  Supabase branch or a temporary project and run the SQL tests plus the e2e flows
  against it first. Check why the `main` Supabase branch shows `MIGRATIONS_FAILED`
  before relying on Supabase Preview.
- CI (`.github/workflows/migration.yml`) runs on pull requests and on pushes to
  `main` and `develop`; it runs on Windows with Node 24 and Edge, so a Linux/Node 22
  run can differ.

## Mock environment (no Supabase, SMTP or devices needed)

```powershell
npm run dev:mock
```

Open http://localhost:3000. The mock API (`apps/fgc-api/src/mock`) runs the real
SQL migrations on in-memory PostgreSQL (PGlite) and the real REST API and auth
router, seeded with synthetic data: 24 teams, two judging panels, an
observation, a flag, Filming shots and shot-list items, three mentor codes and
pending pagers. Only the identity provider is replaced: every account signs in
with code `123456`, and no email is sent. The login screen shows a **Mock
accounts** panel for one-tap sign-in (admin, judge advisor, judges, filmmaker,
mixed-role users, mentor codes). Data resets whenever the process restarts.
Details and limits: [docs/mock-development.md](docs/mock-development.md).

## Development and verification

```powershell
npm run dev:api
npm run dev:web
npm run dev:mobile
npm run dev:mock
npm run typecheck
npm test
npm run test:e2e
npm run build
npm exec -- nx run fgc-mobile:export
```

Web uses port 3000 and proxies `/api` and `/health` to API port 4000. Check existing
listeners before starting a server. The API refuses startup if required secrets
are absent. It never runs migrations or seeds on startup.

For native development, configure `apps/fgc-mobile/.env.local` with a reachable
`EXPO_PUBLIC_API_BASE_URL` including `/api/v1`; device localhost is not the
workstation. Supply actual bundle identifiers, scheme/domain and EAS project in
the Expo environment. `fgc-mobile:start-go` is for compatible UI checks;
`fgc-mobile:start-dev-client` and installed builds are needed for push and links.
`fgc-mobile:export` compiles bundles only, without signing or publishing.

### Android test build (EAS, push enabled)

Run from `apps/fgc-mobile`. `eas.json` has `development` (dev client) and `preview`
(standalone APK, no Metro needed; use it for demos). Both internal-distribution APKs.

1. `npx eas-cli login`. Create the project with `npx eas-cli init`; because
   `app.config.ts` is dynamic, init cannot write the ID back and may end with
   `Cannot read properties of undefined (reading 'projectId')` even though the
   project was created. Read the ID from the project page on expo.dev.
   `app.config.ts` takes `extra.eas.projectId` only from the **local** environment, so
   export it in the shell before every project-scoped EAS command (`eas env:create`,
   `eas credentials`, `eas build`): `export FGC_EAS_PROJECT_ID=<id>` (PowerShell:
   `$env:FGC_EAS_PROJECT_ID="<id>"`). Storing it only as a remote EAS variable is not enough.
2. Create EAS env vars per environment (`eas env:create`): `FGC_EAS_PROJECT_ID`
   (so cloud builds get it too), `FGC_APP_SCHEME`, and `GOOGLE_SERVICES_JSON` as a **file** variable holding the
   Firebase `google-services.json` (git-ignored, never commit it).
   `FGC_ANDROID_PACKAGE` is set in `eas.json` (`mobile.test.alertmvp`) and must equal
   the package in `google-services.json`.
3. `npx eas-cli credentials` -> Android -> upload the FCM V1 service account key.
4. `npx eas-cli build --profile preview --platform android`, then install the APK
   on a physical device.
5. Trigger a push manually:
   `curl -fsS -X POST -H "Authorization: Bearer $WORKER_SECRET" https://<api>/internal/tick`

Unit/HTTP tests use synthetic data. `fgc-web:e2e` runs two Playwright projects in
Edge: `contract` (static server on 127.0.0.1:3000, intercepted API) and
`fullstack` (127.0.0.1:3100: real UI, REST API and SQL on the mock stack). Neither
is acceptance against real Supabase/SMTP/devices. The SQL harness executes actual migrations
in disposable PGlite with synthetic Supabase Auth functions. Its invocation and
limitations are documented in the SQL report.

An external scheduler must call authenticated `POST /internal/tick`. The worker
rechecks delivery authorization, sends generic content only, and runs due purge.
Do not replace the scheduler with an in-process timer. Production scheduler,
Vault configuration and monitoring still need operational verification.

## Boundaries

Shared `contracts` define strict inputs, capabilities, DTOs and receipts.
`api-client` never silently retries writes. Client feature libraries consume
`auth`, `contracts` and `ui`; app shells compose features and platform adapters.
`server` owns HTTP/auth/import/worker orchestration; `database` owns Supabase
transport. Versioned SQL owns transactions, permissions and current-session checks.

No commit, PR or deployment is implied by local verification. Required device,
Supabase, security and full parity gates remain listed in the execution status.
