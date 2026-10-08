// Regenerates libs/shared/src/fgc/teams.snapshot.json from a saved full API response.
// Usage: npx tsx scripts/build-fgc-teams-snapshot.ts [fixture.json]
// The fixture is the owner's capture of `GET https://api.first.global/v1?excludeMatchDetails=true`.
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTeams } from '../libs/shared/src/fgc/teams'

const fixture = resolve(
  process.argv[2] ?? 'libs/shared/src/fgc/fixtures/fgc-v1-snapshot.json',
)
const output = resolve('libs/shared/src/fgc/teams.snapshot.json')

if (!existsSync(fixture)) {
  console.error(
    `Fixture not found: ${fixture}\nAsk the owner for the full API response; team data is never invented.`,
  )
  process.exit(1)
}
const teams = extractTeams(JSON.parse(readFileSync(fixture, 'utf8')))
if (!teams.length) {
  console.error('The fixture yields no teams; refusing to overwrite the snapshot.')
  process.exit(1)
}
// Stable output: the capture time comes from the fixture file, not from the clock.
const generatedAt = statSync(fixture).mtime.toISOString()
writeFileSync(output, JSON.stringify({ generatedAt, teams }, null, 2) + '\n')
console.log(`Wrote ${teams.length} teams to ${output}`)
