import type { Participation } from '@fgc/contracts'
import { ALPHA2, ALPHA3, normalizeCountry } from '@fgc/shared'

export { normalizeCountry } from '@fgc/shared'
// Unknown values compare as themselves so nothing is silently normalised away.
const countryKey = (value: string) =>
  normalizeCountry(value) ?? value.trim().toUpperCase()

/** Splits a free-text conflict cell into unique upper-case country codes. */
export function parseConflicts(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map((v) => v.toUpperCase()),
    ),
  ]
}

/**
 * Validates a conflict cell: every entry must be a known ISO 3166 code (alpha-2 or
 * alpha-3). Returns canonical alpha-2 codes and the entries that were not recognised.
 */
export function validateConflicts(text: string): { codes: string[]; invalid: string[] } {
  const codes: string[] = []
  const invalid: string[] = []
  for (const entry of parseConflicts(text)) {
    const code = ALPHA2.has(entry) || ALPHA3[entry] ? normalizeCountry(entry) : undefined
    if (code) {
      if (!codes.includes(code)) codes.push(code)
    } else invalid.push(entry)
  }
  return { codes, invalid }
}

/** Whether a conflict code names the team's country (by code, alpha-3 or name). */
export function conflictsWithTeam(
  conflicts: readonly string[],
  team: { country: string; countryCode: string },
): boolean {
  const own = new Set([countryKey(team.countryCode), countryKey(team.country)])
  return conflicts.some((c) => own.has(countryKey(c)))
}

export interface JudgeLike {
  id: string
  name: string | null
  email: string
  panelId: string | null
  conflict: string[]
}
interface PanelLike {
  id: string
  leaderId: string | null
}

/** Distinct country labels of the teams currently in a panel, sorted. */
export function panelCountries(panelId: string, teams: readonly Participation[]) {
  return [
    ...new Set(teams.filter((t) => t.panelId === panelId).map((t) => t.team.country)),
  ].sort((a, b) => a.localeCompare(b))
}

/** Conflict codes of a judge that hit a team of the given panel (empty = eligible). */
export function judgeConflictsWithPanel(
  judge: Pick<JudgeLike, 'conflict'>,
  panelId: string,
  teams: readonly Participation[],
): string[] {
  return [
    ...new Set(
      judge.conflict.filter((code) =>
        teams.some((t) => t.panelId === panelId && conflictsWithTeam([code], t.team)),
      ),
    ),
  ]
}

/** Interview progress of a panel: evaluated of active teams. */
export function panelProgress(panelId: string, teams: readonly Participation[]) {
  const own = teams.filter((t) => t.panelId === panelId)
  const active = own.filter((t) => t.participationStatus === 'active')
  return {
    evaluated: active.filter((t) => t.evaluationStatus === 'evaluated').length,
    active: active.length,
    total: own.length,
  }
}

/**
 * Spreads judges evenly over the panels without putting a judge on a panel that
 * holds a team from one of their conflict countries. Panel leaders stay where they
 * are; the most constrained judges are placed first, each on the smallest eligible
 * panel. Judges that fit nowhere are returned in `unplaced`.
 */
export function distributeJudges(
  judges: readonly JudgeLike[],
  panels: readonly PanelLike[],
  teams: readonly Participation[],
): { assignments: Record<string, string[]>; unplaced: string[] } {
  const assignments: Record<string, string[]> = {}
  const leaderIds = new Set<string>()
  for (const p of panels) {
    assignments[p.id] = p.leaderId ? [p.leaderId] : []
    if (p.leaderId) leaderIds.add(p.leaderId)
  }
  const blocked = (j: JudgeLike, panelId: string) =>
    judgeConflictsWithPanel(j, panelId, teams).length > 0
  const label = (j: JudgeLike) => j.name ?? j.email
  const movable = judges
    .filter((j) => !leaderIds.has(j.id))
    .map((j) => ({ j, options: panels.filter((p) => !blocked(j, p.id)).length }))
    .sort((a, b) => a.options - b.options || label(a.j).localeCompare(label(b.j)))
  const unplaced: string[] = []
  for (const { j } of movable) {
    const target = panels
      .filter((p) => !blocked(j, p.id))
      .sort((a, b) => assignments[a.id].length - assignments[b.id].length)[0]
    if (target) assignments[target.id].push(j.id)
    else unplaced.push(j.id)
  }
  return { assignments, unplaced }
}

/** Panels whose judges (leader included) have no conflict with the team's country. */
export function panelsForTeam<P extends { id: string; judgeIds: string[] }>(
  team: Participation,
  panels: readonly P[],
  judges: readonly Pick<JudgeLike, 'id' | 'conflict'>[],
): P[] {
  return panels.filter(
    (p) =>
      !judges.some(
        (j) => p.judgeIds.includes(j.id) && conflictsWithTeam(j.conflict, team.team),
      ),
  )
}
