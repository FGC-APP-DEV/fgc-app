# Dependency review — 2026-09-23

The locked dependency audit initially reported78 findings, including7 critical.
Removed obsolete GraphQL/Drizzle/demo dependencies, unused Nx native/React generator
plugins and obsolete dev tooling; aligned Nx22.7.12 and webpack-dev-server5.2.6,
then applied compatible `npm audit fix --ignore-scripts` without `--force`.

Latest registry audit: **26 findings:0 critical,12 high,14 moderate**. These counts
include parent packages affected transitively, not26 independent vulnerabilities.
Raw evidence: [dependency-audit.json](dependency-audit.json).

Remaining leaf advisories involve brace-expansion, image-size, smol-toml, qs and
uuid. Several fixes suggested by npm require major Nx changes or incompatible
Expo/ExcelJS downgrades; these were not forced into the approved SDK migration.
Review/update the relevant transitive versions and verify release-specific
reachability before exposing development services or publishing a release.
This migration does not claim an audit-clean dependency graph.

Build tools are not exposed by the production Express REST API. This distinction
reduces some runtime exposure but is not a blanket dismissal of the advisories.
The parser tests include malformed XLSX, formulas and dishonest ZIP expansion;
those tests do not certify third-party dependency safety.
