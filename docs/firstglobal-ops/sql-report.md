# SQL persistence implementation report

Implemented on 2026-09-22 for the approved clean migration. No real database,
legacy data, paid service, deployment, push or production deletion was touched.

## Implemented and verified locally

Versioned migrations create `core`, `judging`, `filming`, `messaging`, `private`,
`audit`, and the exclusively exposed `api` schema. Forced RLS, a restricted
NOLOGIN command owner, fixed search paths and minimum function grants separate
staff JWT calls from mentor/auth/worker service-only calls. Every protected staff
operation checks live `auth.sessions.session_id` and current database roles.
Admin wins a deny over combined Judging roles.

Judging mutations serialize against the cycle row used by closure, validate
entity versions and current panel access before replay, and store only hash plus
metadata receipts. Panel membership/leadership, one panel per judge/team,
transfers preserving authorship, single editable observation, independent flags,
withdrawal/reactivation, evaluation history and double-confirmation closure are
implemented transactionally. Closure intents expire after five minutes.

Mentor code/session TTL is seven days from each respective issuance. Regeneration
increments the code version and revokes sessions and devices atomically. Tokens
and codes are received only as server-generated hashes/HMAC digests. Mentor
reads project only the session's team; first response wins under page-row lock
and a unique constraint. Pager/outbox creation is atomic, future messages are
hidden until due, responses cancel pending delivery, workers use leases and at
most five attempts, and authorization is checked again immediately before send.

Imports persist a 30-minute actor-bound preview, validate rows again in SQL,
reject conflicting duplicate identities and invalid country codes, preserve
leading zeroes and never overwrite a previously imported team. Commit is one
row transaction, so valid records remain independently importable.

Purge starts at +23h and cascades through Judging messages, receipts and audit
data, including the cycle itself. Global identities, teams and Filming remain.
Only timestamp, routine version and outcome remain as a 30-day purge receipt.

## Executed verification

Command from the application repository:

```powershell
node supabase/tests/run-pglite.mjs C:/Users/jvoli/AppData/Local/Temp/fgc-sql-harness/node_modules/@electric-sql/pglite/dist/index.js
```

All eight migrations applied to a disposable PostgreSQL/PGlite database,
including the separately implemented authentication migration. All three SQL suites
passed. `domain.sql` verifies admin deny on RPC and tables, direct-write deny,
leader creation, membership transfer, role-filtered reads, version conflict,
idempotent replay/payload mismatch, immediate access loss after transfer,
preserved old-panel authorship, completion/reopen/history, multiple flags,
closure replay, operational emptiness, temporary audit, session revocation and
purge preserving Filming. `mentor_import.sql` verifies Filming versions, secret
one-time issuance, mentor RPC isolation, own-team projection without notes,
scheduling, first response/replay, cancellation, independent code/session
expiry, regeneration, push revocation, rate limiting, SQL import validation and
non-overwriting reimport.

`scheduled_replay.sql` verifies that a newly submitted past schedule is rejected,
then creates a future pager and lets its scheduled instant pass in real time.
The same key/payload returns the exact original receipt without another page;
the same past schedule with a new key is rejected. Revoking the actor's role
still denies replay. Scheduling validation runs after current authorization and
receipt lookup, so manual retries remain valid after the scheduled instant.

These are real SQL execution tests with synthetic Auth functions, not tests of
a real Supabase project, PostgREST, physical retention, push delivery or two
simultaneously active PostgreSQL connections. Those checks remain unverified.

## RPC integration contract

All staff mutations below take `(p_input jsonb, p_key uuid)` and return
`{commandId,entityId,resultingVersion,outcome,committedAt}`. Keys must be UUIDs.
Domain exceptions use canonical error messages with SQLSTATE P0001; SQL
constraint errors must also map to safe 400/409 errors. Responses contain no
notes. Observation mutation input uses `text`; Filming shot input uses `notes`.

| RPC | Fields in p_input |
| --- | --- |
| profile_update | name, expectedVersion |
| access_grant | email (one per call), roles, mode, expectedVersion |
| panel_create | name, leaderId, judgeIds |
| panel_leader | panelId, leaderId, expectedVersion |
| panel_members | panelId, judgeIds (full replacement), expectedVersion |
| panel_team | panelId, teamId, expectedVersion (panel) |
| panel_delete | panelId, expectedVersion |
| judge_transfer | judgeId, sourcePanelId, targetPanelId, expectedVersion (membership), sourceVersion, targetVersion |
| participation_add | teamId; optional panelId supported |
| participation_remove | teamId, expectedVersion (participation) |
| team_transfer | teamId, sourcePanelId, targetPanelId, expectedVersion (participation), sourceVersion, targetVersion |
| observation_put / observation_delete | teamId, panelId, expectedVersion; put includes text |
| evaluation_complete | teamId, expectedVersion, confirmed=true |
| evaluation_reopen / team_reactivate | teamId, expectedVersion |
| team_withdraw | teamId, expectedVersion, reason |
| flag_put / flag_delete | teamId, type (absent/online/other), expectedVersion; put includes reason |
| closure_intent | expectedVersion (cycle), confirmed=true; receipt entityId is the short-lived token |
| judging_close | token, expectedVersion (cycle) |
| category_create | name; optional description |
| item_create | categoryId, title |
| item_toggle / item_delete | itemId, expectedVersion; toggle includes done |
| shot_mark / shot_clear | teamId, templateId, expectedVersion; mark includes status and notes |
| page_create | teamId, sourceArea, message, optional scheduledFor |
| mentor_code_issue | teamId, expectedVersion, digest (server HMAC); replay returns SECRET_ALREADY_ISSUED |
| import_preview | inputHash, rows (normalized preview) |
| import_row_commit | previewId, row, expectedVersion |

`me()`, `schedule()`, `judging_cycle()`, `judging_audit()` and
`mentor_codes_list()` are unpaged staff reads. `teams_list`, `users_list`,
`judges_list`, `panels_list`, `participations_list`, `categories_list`,
`items_list`, `tracker`, `pages_list` accept `p_limit` (50 default, 100 max)
and `p_after` (UUID, null first page). Teams additionally accepts `p_search`;
pages accepts `p_source_area`. HTTP owns opaque cursor encoding. Tracker returns
`{teams,templates}`; other lists return arrays. `observations_list(p_team uuid)`
rejects a team outside the current panel with NOT_FOUND. `import_read(p_id uuid)`
returns the preview plus row results. `judges_list` returns membership `version`
and `panelId` for transfer controls. `judging_cycle` returns `{id,version,state}`
or null after closure. `mentor_codes_list` never returns a digest.

Service-only functions:

- `staff_provision(p_auth_user_id,p_email)` derives roles from approved emails.
- `health_check()` returns whether an active event has been provisioned.
- `mentor_rate_limit(p_ip_hash,p_installation_id,p_digest)` returns boolean;
  HTTP must reject false, keeping the committed counter. Limits are 5/min IP,
  20/hour installation, 20/min digest and 1000/min event, with 15-minute cooldown.
- `mentor_redeem(p_digest,p_token_hash)` returns sessionId/teamId/eventId/expiresAt.
- `mentor_me(p_token_hash)`, `mentor_filming(p_token_hash)`,
  `mentor_logout(p_token_hash)` derive team from the current valid session.
- `mentor_pages(p_token_hash,p_installation_id,p_limit,p_after)` returns due
  authorized pages and per-installation deliveryId.
- `mentor_respond(p_token_hash,p_input,p_key)` uses pageId/response/expectedVersion.
- `mentor_device_put(p_token_hash,p_input)` takes installationId/token/platform/
  permission (granted/denied); `mentor_device_delete(p_token_hash,p_installation_id)`.
- `delivery_claim(p_limit)` returns claimed delivery UUIDs, 60-second leases.
- `delivery_authorize(p_id)` returns `{deliveryId,token,title,body}` or null.
- `delivery_finish(p_id,p_accepted,p_invalid_token=false)` records provider result.
- `purge_due()` performs eligible deletion and expired-preview cleanup.
- `staff_auth_*` functions are described by the authentication implementer.

## Integration/operational follow-up

The HTTP closure-intent response must expose receipt.entityId as `token` if its
UI expects a token field. Removal route currently maps :id to teamId; callers
must send the official internal team UUID, not the participation UUID.
Deploy pg_cron/pg_net + Vault and the internal worker endpoint; configure only
api as an exposed schema. Validate live PostgREST auth/session behavior,
multi-connection races and volume. Confirm physical deletion across managed
backups/logs/copies within 24 hours before any real Judging data. No migration or
PGlite success constitutes that evidence.
