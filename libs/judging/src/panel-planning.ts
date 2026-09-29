import type { Participation } from '@fgc/contracts'

/** ISO 3166 alpha-3 -> alpha-2, so JAs may write conflicts as "BRA" or "BR". */
const ALPHA3: Record<string, string> = {
  ARG: 'AR',
  AUS: 'AU',
  AUT: 'AT',
  BEL: 'BE',
  BRA: 'BR',
  CAN: 'CA',
  CHE: 'CH',
  CHL: 'CL',
  CHN: 'CN',
  COL: 'CO',
  DEU: 'DE',
  DNK: 'DK',
  EGY: 'EG',
  ESP: 'ES',
  FIN: 'FI',
  FRA: 'FR',
  GBR: 'GB',
  GHA: 'GH',
  GRC: 'GR',
  IDN: 'ID',
  IND: 'IN',
  IRL: 'IE',
  ISR: 'IL',
  ITA: 'IT',
  JPN: 'JP',
  KEN: 'KE',
  KOR: 'KR',
  MEX: 'MX',
  MYS: 'MY',
  NGA: 'NG',
  NLD: 'NL',
  NOR: 'NO',
  NZL: 'NZ',
  PER: 'PE',
  PHL: 'PH',
  POL: 'PL',
  PRT: 'PT',
  RUS: 'RU',
  SAU: 'SA',
  SGP: 'SG',
  SWE: 'SE',
  THA: 'TH',
  TUR: 'TR',
  UKR: 'UA',
  USA: 'US',
  VNM: 'VN',
  ZAF: 'ZA',
}
const countryKey = (value: string) => {
  const key = value.trim().toUpperCase()
  return ALPHA3[key] ?? key
}

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
