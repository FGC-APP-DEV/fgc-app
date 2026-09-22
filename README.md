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
There is no passwordless demo login or local Drizzle database path.

The new Supabase project must be configured from `supabase/migrations` in order.
Expose only `api`. Configure Auth email templates/SMTP, active event, initial
administrator preapproval and Step & Repeat template using the approved event
information. Read [SQL report](docs/firstglobal-ops/sql-report.md) and
[Auth setup](docs/firstglobal-ops/auth-report.md) before provisioning.
Do not use real Judging content until the physical 24-hour retention requirement
is proven for the database, backups, logs and copies.

## Development and verification

```powershell
npm run dev:api
npm run dev:web
npm run dev:mobile
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

Unit/HTTP tests use synthetic data. `fgc-web:e2e` launches a temporary static
server on 127.0.0.1:3000 and Edge via Playwright, with an intercepted API; it is
not a real backend acceptance test. The SQL harness executes actual migrations
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
