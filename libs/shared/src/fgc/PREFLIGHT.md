# Pre-flight report (api.first.global)

Run on 2026-10-08 from the Claude Code cloud session that built this module. That sandbox
only allows outbound HTTPS to an allow-list, and `api.first.global` is not on it, so **no step
reached the API** and the outcome rule below is provisional. Please re-run the table from a
machine or from the deployed runtime and update this file.

| Step | Action                                                        | UTC time             | Result                                                                                  |
| ---- | ------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| 1    | `curl "https://api.first.global/v1?excludeMatchDetails=true"` | 2026-10-08T02:59:12Z | No HTTP status: `CONNECT tunnel failed, response 403` (sandbox egress policy). 0 bytes. |
| 2    | Same with `excludeMatchDetails=false`, and the bare URL       | 2026-10-08T02:59:12Z | Same proxy 403 for both. 0 bytes.                                                       |
| 3    | Step 1 with `Origin`/`Referer` of `results.first.global`      | not run              | Blocked by the same policy.                                                             |
| 4    | Browser console `fetch` on the app origin (CORS)              | not run              | Needs a browser and network access. **Owner to run.**                                   |
| 5    | Step 1 from the deployed runtime                              | not run              | **Owner to run** after deploy.                                                          |
| 6    | `/swagger`, `/openapi.json`, `/docs`, ...                     | not run              | Blocked.                                                                                |
| 7    | Search the `results.first.global` bundle                      | not run              | Needs a browser. **Owner to run.**                                                      |
| 8    | Request headers (`Authorization`, API key)                    | not run              | Needs a browser. **Owner to run.**                                                      |

## Outcome rule applied

Nothing proved a header, proxy or credential is needed, so the module follows the default path:
a plain browser `GET` with `excludeMatchDetails=true`, no extra headers and **no proxy route**
(`results.first.global` calls the same endpoint from the browser). If step 4 shows a CORS
block or step 3 an Origin check, route the call through the backend and put the headers in
`FGC_API_CONFIG`. No credential was seen; none must be committed.

PR note: the API needs the `excludeMatchDetails=true` parameter (per the spec's observations);
headers and a proxy are unverified.

## Acceptance items not verifiable here

- #2 (185 teams from the full response), #16 with the real snapshot and #20 (deployed smoke test)
  need the owner's full capture and network access. The unit tests cover the same logic on a
  synthetic sample.
