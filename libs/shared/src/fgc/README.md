# FGC teams data (`api.first.global`)

Framework-agnostic module that derives the FGC 2026 teams from the public results API and
filters them by country name or FIRST tag. The API has no teams endpoint: teams are the
de-duplicated `matches[].participants[]`, named after their country (`Intl.DisplayNames` on
`countryCode`, never on `country`, which is FIRST's own tag: `CHI` is Chile).

```ts
import { fetchTeams, filterTeams } from '@fgc/shared'

const { teams, matches, source } = await fetchTeams() // source: 'live' | 'snapshot'
matchesForTeam(matches, 23) // that team's matches: time, field, alliances
filterTeams(teams, 'Brazil') // by name, tag (prefix) or ISO-2 code; accent/case-insensitive
```

- The request always sends `excludeMatchDetails=true` (the bare URL returned empty arrays);
  URL, query and headers live in `FGC_API_CONFIG` and can be overridden per call.
- The live list is cached for 2 minutes (the schedule and scores change during the event); `forceRefresh: true` bypasses it and concurrent
  callers share one request. Empty or failed results are never cached.
- Empty data rejects with `FgcEmptyDataError`; network, non-200 and invalid JSON reject with
  `FgcApiError` (`status` when known). With `allowSnapshotFallback` (default) a non-empty
  bundled snapshot is returned instead, with `source: 'snapshot'`.
- UI: `TeamSearch` (`@fgc/ui`) is on the signed-out landing page and, once signed in, under
  the **Teams** navigation item. Nothing is listed until the user types.

## Snapshot

`teams.snapshot.json` is generated from the owner's full API capture:

```sh
npx tsx scripts/build-fgc-teams-snapshot.ts [path/to/fgc-v1-snapshot.json]
```

The default input is `fixtures/fgc-v1-snapshot.json` in this folder. **The capture has not been
supplied yet, so the committed snapshot is empty and the fallback is inactive**: failures surface
as errors until it is generated. `fixtures/sample-matches.json` is a small synthetic sample used
only by the unit tests.

See [PREFLIGHT.md](./PREFLIGHT.md) for the API reachability report.
