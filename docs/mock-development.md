# Mock development environment

`npm run dev:mock` starts the API and the web dev server together. Nothing external
is contacted and nothing is persisted.

## What is real and what is replaced

| Layer                                               | In mock mode                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Web/mobile UI, shared libs                          | Real                                                                                            |
| REST API (validation, versions, idempotency, roles) | Real                                                                                            |
| SQL: schemas, RLS, RPC functions, receipts, purge   | Real migrations, run on in-memory PGlite                                                        |
| Supabase Auth (email OTP, JWT, sessions)            | Replaced by `apps/fgc-api/src/mock/auth.ts`: opaque tokens and a live row in `auth.sessions`    |
| Email                                               | Not sent; the code is always `123456` (printed in the API console and listed at `/__mock/info`) |
| Push delivery, scheduler, SMTP, hosting             | Not exercised                                                                                   |

The mock is development-only: `createApi` mounts `/__mock` only when `development`
is true, the account picker renders only when `FGC_MOCK=1` (web) or
`EXPO_PUBLIC_FGC_MOCK=1` (mobile) is set at build time, and the production entry
point (`apps/fgc-api/src/main.ts`) never imports it.

## Seeded data

| Account                           | Roles                     | Use it to see                                          |
| --------------------------------- | ------------------------- | ------------------------------------------------------ |
| admin@fgc.test                    | admin                     | access approval, imports, mentor codes; Judging denied |
| ja@fgc.test                       | judgeAdvisor              | panels, transfers, flags, closure and temporary audit  |
| judge1@fgc.test / judge3@fgc.test | judge                     | leaders of Panel A / Panel B (complete evaluations)    |
| judge2@fgc.test / judge4@fgc.test | judge                     | panel members                                          |
| film@fgc.test                     | filmmaker                 | tracker, map, shot list, pager                         |
| multi@fgc.test                    | filmmaker + judge         | launcher with two modules; judge without a panel       |
| admin-judge@fgc.test              | admin + judge             | admin deny wins over Judging                           |
| newcomer@fgc.test                 | approved, never signed in | pending access and first-login profile                 |
| MOCKMENTOR001-003                 | mentor codes              | teams 001-003 with pagers, shots and responses         |

Any other address is rejected like an unapproved email. Approve new addresses in
Administration to try the first-login flow.

## Mobile

Run the mock API on a LAN-reachable host and point Expo at it:

```powershell
npm run dev:mock:api
$env:EXPO_PUBLIC_API_BASE_URL = "http://<workstation-ip>:4000/api/v1"
$env:EXPO_PUBLIC_FGC_MOCK = "1"
npm run dev:mobile
```

Expo Go is enough for these UI/flow checks. Push notifications, universal links
and signed builds still need real credentials and devices (see the migration
execution status).

## Automated use

`npm run test:e2e` starts the same mock stack on port 3100 (static build served by
the API) for the `fullstack` Playwright project. Those specs share one in-memory
database, so they are written to be additive; `zz-closure.spec.ts` runs last
because closing Judging is irreversible within a run.
