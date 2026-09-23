# Firstglobal operations migration execution

Approved scope: ../context/fgc-mvp/SPEC.md, PRD.md, contratos-tecnicos.md,
migracao-escopo-paridade.md and canonical ../../../contexts. User authorized
end-to-end execution on 2026-09-21 and requested confirmations be recorded for
the end. No production migration, deletion, publishing or paid services.

## Execution ledger

- [ ] 1. Contracts and workspace: typed REST schemas, client, Nx package boundaries,
     meaningful test targets. Verify envelopes, validation and failed requests.
- [ ] 2. SQL persistence: isolated schemas, RLS and transactional commands for
     identity, teams, Filming, Judging, pager, mentor and closure. Verify role
     denials, versions, replay, transfers, expiry and first-response races.
- [ ] 3. Server: Supabase identity/session adapters, REST composition and domain
     operations; remove demo authentication and public GraphQL. Verify API behavior
     with synthetic fixtures; real SQL checks must be distinguished from mocks.
- [ ] 4. Clients: authorized launcher, staff/mentor login, admin/imports, Filming,
     Judging, messaging, mentor and schedule through shared RN UI. Verify errors,
     unsaved drafts, empty states and role isolation.
- [ ] 5. Expo: inspect available SDK matrix; migrate entry/config/Metro, secure
     storage and notification adapters; preserve web. Validate dependency graph,
     compile/export, then record device/distribution checks separately.
- [ ] 6. Integration: unit, API, browser e2e, typecheck, builds and lint;
     independent review and final per-M-ID evidence/pending register.

## Interfaces and ownership

Contracts uses Zod and shared only; api-client depends on contracts/shared.
Feature packages depend on ui/auth/api-client/contracts/shared, never each other.
Shells compose features and messaging. Server/database are server-only.
SQL exposed schema is api; domain schemas are not exposed. Staff calls preserve
the verified Supabase JWT. Mentor and worker use narrow service-only functions.
Mutation receipts contain no notes; reads fetch current authorized state.

## Preflight findings / rulings

- Existing Git tree is clean on docs/add-agentic-context; preserve firstglobal-ops.
- Existing static inventory maps 150 files and M01–M30; use its dispositions
  rather than enabling excluded modules (round 2, awards, Pit Admin, production).
- Documents are approved implementation requirements, not proof of functionality.
- External provisioning is recorded in execution-status.md; keep local synthetic
  verification independent from SMTP, hosts, devices, store accounts and retention.
- Root owns shared manifests/config/contracts/client/integration. Delegated SQL
  work owns only supabase and database source; no concurrent shared-file edits.

## Review focus

Admin plus judging roles must still deny access; expired/revoked sessions must
fail direct RPC; retries after transfer must reauthorize; closure races must not
resurrect notes or notifications; transient network failure must preserve drafts
without automatic retries. Tests must cover these, not only happy-path rendering.
