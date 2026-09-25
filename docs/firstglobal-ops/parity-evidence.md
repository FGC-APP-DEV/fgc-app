# Migration evidence by approved function

Updated 2026-09-23. This table separates **code transposition** from **operational acceptance**.
Source: canonical workspace `contexts/fgc-mvp/migracao-escopo-paridade.md` (M01–M30), D01–D74 and T01–T05.

Common environments: Windows, Node24, Nx22.7.12; Edge browser390×844; Expo57.0.24/RN0.86.3/React19.2.3. Browser API is intercepted with synthetic fixtures. SQL runs real PostgreSQL/PGlite0.5.8 with synthetic Auth functions. All native flows still require installed-device acceptance. No real staff/team/observation data is used in tests.

| ID | Code disposition and evidence | Remaining acceptance |
| --- | --- | --- |
| M01 | Staff code/link/PKCE/refresh/logout in auth/server; HTTP, provider and two-tab browser tests | Real SMTP/Supabase and mobile links |
| M02 | Required-name screen and versioned profile command | Real identity/profile flow on devices |
| M03 | Role launcher, periodic refresh, memory-only drafts; admin deny and two-tab identity switch browser tests | Full real-session/network matrix |
| M04 | Admin batch add/replace, current per-email versions, pending approvals; SQL contract tests | Browser bulk/role-removal matrix with real users |
| M05 | Tracker, complete-team schematic map, filters, counts; capture browser test and map layout unit tests | Venue location source and full device interaction |
| M06 | Versioned capture/skip/notes/reset; SQL and capture browser tests | Multi-user concurrency/device checks |
| M07 | Categories/items/search/status/toggle/delete; SQL test | Full browser/device shot-list acceptance |
| M08 | Mentor own-team checklist, absent mark is pending; SQL projection test | Installed mentor flow |
| M09 | Panels/members/leader/manual assignments/transfers; SQL authority/history tests | Full browser/device panel management |
| M10 | Automatic distribution and collective reset excluded; no operational route | Confirm exclusion during acceptance |
| M11 | JA role grants excluded; access stays in admin module | Real role matrix |
| M12 | Author-only versioned observations; SQL and browser retry/conflict/navigation tests | Simultaneous Postgres connections/devices |
| M13 | Leader completion/leader-or-advisor reopen; SQL tests | Device confirmations |
| M14 | Independent flags/withdraw/reopen/history/progress; unit and SQL tests | Device state matrix |
| M15 | Awards/round2 excluded; retired demo runtime removed | Confirm no excluded module at acceptance |
| M16 | Immediate/scheduled pager; immutable manual retry body; schedule replay and role SQL tests | Deployed clock/scheduler/volume |
| M17 | Paged authorized history, responses and honest push-provider status; SQL tests | Real request authorization/performance |
| M18 | One-time mentor code issuance/regeneration; SQL expiry/revocation tests | Admin code distribution workflow |
| M19 | Opaque mentor session/cookie/SecureStore, rate limits; SQL expiry/isolation tests | Real IP/proxy configuration and device sessions |
| M20 | First response wins; SQL plus mentor browser response test | Simultaneous two-device/connection race |
| M21 | Foreground20s polling/resume, manual refresh, visible failures; mentor browser | Background/foreground real devices |
| M22 | Legacy landmarks/layout/coordinate semantics, labelled unverified fallback, pan/pinch/zoom, accessible team list;4 map tests | Verified venue positions and device gestures |
| M23 | HTTPS external schedule or approved placeholder | Official URL |
| M24 | Full Pit Admin/announcements excluded from routes/screens | Confirm exclusion |
| M25 | Portfolio/production excluded; legacy repository preserved | Future scope only |
| M26 | Shared light tokens, Inter, RN/RNWeb primitives, focus/touch targets; login/Judging screenshots inspected | Complete accessibility, tablet/desktop and native visual review |
| M27 | XLSX/CSV/TXT/JSON, bounded actual ZIP expansion, mapping, preview, partial import; parser/SQL/browser tests | Official sample and native picker acceptance |
| M28 | Two confirmations, closed dashboards, temporary JA audit, purge/receipts; SQL tests and scheduler template | Deployed job/alerts; physical copies/backups deletion ≤24h |
| M29 | Expo adapter/token renewal/dedup, server outbox/lease authorization; adapter/worker/SQL tests | Physical push permission/delivery/receipts/background |
| M30 | Expo Go/dev-client targets, web/API builds and Android/iOS/web bundle export | Signed builds, Metro-independent install, test distribution/store submission |

The code for these dispositions is present. This table **does not certify full parity or 100% functional deployment**. Operational gates above are not satisfied by mocks, typechecking, exported Hermes bytecode, or local SQL success.
