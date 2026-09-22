# FGC migration — execution status

Updated 2026-09-22. **In progress; not production ready and not fully accepted.**
Approved scope: workspace `contexts/fgc-mvp/migracao-escopo-paridade.md` and D01–D74/T01–T05. Design: workspace `contexts/design-system.md`.

## Implemented

- Shared REST contracts, versioned/idempotent commands and per-request Supabase identity.
- Staff email code/link flow, PKCE, memory-only web access tokens, refresh cookie, mobile SecureStore, live role authorization and admin Judging deny.
- Filming tracker/capture/shot list, admin access and mentor codes, multiformat import preview/partial commit, Judging panels/observations/status/closure/audit, pager, mentor responses, external schedule placeholder.
- Eight SQL migrations with RLS, restricted command owner, receipt replay checks, outbox and purge routines.
- Expo SDK57 configuration and notification adapter; native shell registration is wired to the mentor device API.
- Root shells consume the shared modules. Source-consumed Nx libraries have typecheck targets; application builds produce executable artifacts.

## Executed evidence

- `fgc-web:build`: passed.
- `fgc-api:build`: passed, after allowing local esbuild ancestor-directory resolution outside the restricted process sandbox.
- `fgc-web:typecheck`, `fgc-api:typecheck`, `fgc-mobile:typecheck`: passed before the latest auth hardening; final rerun pending.
- `fgc-mobile:export`: passed for web, iOS and Android including Hermes bytecode. This is **not** an installed or signed-device test.
- Unit/HTTP run for contracts, api-client, auth, server, judging, messaging and notifications: 39 tests passed before additional auth/notification tests. Latest module counts/results are in implementation reports; consolidated rerun pending.
- Eight migrations and three PostgreSQL/PGlite suites passed with synthetic Supabase Auth fixtures. See `sql-report.md`; no real Supabase or multi-connection concurrency proof.
- Three browser tests passed in Edge at 390×844 with an intercepted synthetic API: mixed-role admin launcher, versioned Filming capture with notes, mentor response. Test process teardown stalled under the restricted Windows process sandbox; resolving before treating target as passed.

## Remaining implementation / verification

- Complete final integration review, formatting/lint and consolidated regression run.
- Retire unused GraphQL/Apollo/Drizzle demo files and references; update startup/configuration documentation.
- Expand browser coverage for imports, Judging/unsaved observations and multi-tab session behavior.
- Verify complete legacy map interaction/visual parity. Current map supports all-team display, selection, scroll and zoom buttons; original gesture/landmark parity is not established.
- Complete OpenAPI artifact, boundary enforcement and operational scheduler wiring/instructions.
- Real Supabase/PostgREST, simultaneous database races, SMTP, notification delivery, app/universal links and installed Android/iOS acceptance remain unverified.

## Confirmations / external evidence to revisit

- Official team sample and schedule URL (placeholder remains approved).
- New Supabase project, organization SMTP, HTTPS web/API and callback domains.
- Apple/Google permissions, actual bundle identifiers, signing, EAS project and test devices.
- Physical deletion of Judging across backups/logs/copies within 24 hours and operational alert recipient. Do not ingest real Judging content before this evidence exists.

No legacy/production data was moved or deleted. No deployment, PR, commit or push performed. Source implementation and synthetic tests do not establish end-to-end operational acceptance.
