import type { Participation } from '@fgc/contracts'
import {
  conflictsWithTeam,
  distributeJudges,
  judgeConflictsWithPanel,
  normalizeCountry,
  panelProgress,
  panelsForTeam,
  validateConflicts,
  parseConflicts,
} from './panel-planning'

const team = (
  id: string,
  code: string,
  panelId: string | null,
  evaluated = false,
): Participation =>
  ({
    id,
    teamId: id,
    panelId,
    evaluationStatus: evaluated ? 'evaluated' : 'pending',
    participationStatus: 'active',
    hasHistory: false,
    version: 1,
    flags: [],
    team: { id, officialId: id, name: id, country: code, countryCode: code, version: 1 },
  }) as Participation
const judge = (id: string, conflict: string[] = []) => ({
  id,
  name: id,
  email: `${id}@fgc.test`,
  panelId: null,
  conflict,
})

test('conflict cells parse into unique upper-case codes and match alpha-2/alpha-3', () => {
  expect(parseConflicts('bra, br;US  us')).toEqual(['BRA', 'BR', 'US'])
  const brazil = { country: 'BR', countryCode: 'BR' }
  expect(conflictsWithTeam(['BRA'], brazil)).toBe(true)
  expect(conflictsWithTeam(['br'], brazil)).toBe(true)
  expect(conflictsWithTeam(['USA'], brazil)).toBe(false)
  expect(conflictsWithTeam(['Brazil'], { country: 'Brazil', countryCode: 'BR' })).toBe(
    true,
  )
})

test('a judge conflicts with a panel only when it holds a team of that country', () => {
  const teams = [team('a', 'BR', 'p1'), team('b', 'US', 'p2')]
  expect(judgeConflictsWithPanel({ conflict: ['BRA'] }, 'p1', teams)).toEqual(['BRA'])
  expect(judgeConflictsWithPanel({ conflict: ['BRA'] }, 'p2', teams)).toEqual([])
})

test('distribution balances panels, respects conflicts and keeps leaders in place', () => {
  const teams = [team('a', 'BR', 'p1'), team('b', 'US', 'p2'), team('c', 'JP', 'p3')]
  const panels = [
    { id: 'p1', leaderId: 'lead1' },
    { id: 'p2', leaderId: null },
    { id: 'p3', leaderId: null },
  ]
  const judges = [
    judge('lead1'),
    judge('j1', ['BR']),
    judge('j2', ['US']),
    judge('j3', ['JP']),
    judge('j4'),
    judge('j5'),
    judge('j6'),
  ]
  const { assignments, unplaced } = distributeJudges(judges, panels, teams)
  expect(unplaced).toEqual([])
  expect(assignments.p1).toContain('lead1')
  expect(assignments.p1).not.toContain('j1')
  expect(assignments.p2).not.toContain('j2')
  expect(assignments.p3).not.toContain('j3')
  const sizes = Object.values(assignments).map((ids) => ids.length)
  expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
  expect(Object.values(assignments).flat().sort()).toEqual(judges.map((j) => j.id).sort())
})

test('a judge who conflicts with every panel is reported as unplaced', () => {
  const teams = [team('a', 'BR', 'p1')]
  const { assignments, unplaced } = distributeJudges(
    [judge('j1', ['BR'])],
    [{ id: 'p1', leaderId: null }],
    teams,
  )
  expect(unplaced).toEqual(['j1'])
  expect(assignments.p1).toEqual([])
})

test('panel progress counts evaluated of active teams', () => {
  const teams = [
    team('a', 'BR', 'p1', true),
    team('b', 'US', 'p1'),
    team('c', 'JP', 'p2'),
  ]
  expect(panelProgress('p1', teams)).toEqual({ evaluated: 1, active: 2, total: 2 })
})

test('the ISO table is complete: any alpha-3 (e.g. AFG) matches its alpha-2 team', () => {
  const afghanistan = { country: 'AF', countryCode: 'AF' }
  expect(conflictsWithTeam(['AFG'], afghanistan)).toBe(true)
  expect(conflictsWithTeam(['AFG'], { country: 'Afghanistan', countryCode: '' })).toBe(
    true,
  )
  expect(normalizeCountry('TUV')).toBe('TV')
  expect(normalizeCountry('XKX')).toBe('XK')
  expect(normalizeCountry('ZWE')).toBe('ZW')
})

test('unsupported conflict codes are rejected instead of silently ignored', () => {
  expect(validateConflicts('bra, AFG, us')).toEqual({
    codes: ['BR', 'AF', 'US'],
    invalid: [],
  })
  expect(validateConflicts('BRA, XYZ, Q')).toEqual({
    codes: ['BR'],
    invalid: ['XYZ', 'Q'],
  })
})

test('team division only offers panels without a conflicting judge (leaders included)', () => {
  const t = team('a', 'BR', null)
  const panels = [
    { id: 'p1', judgeIds: ['lead', 'j1'] },
    { id: 'p2', judgeIds: ['j2'] },
    { id: 'p3', judgeIds: [] as string[] },
  ]
  const judges = [
    { id: 'lead', conflict: ['BRA'] },
    { id: 'j1', conflict: [] },
    { id: 'j2', conflict: [] },
  ]
  expect(panelsForTeam(t, panels, judges).map((p) => p.id)).toEqual(['p2', 'p3'])
  const onlyBlocked = [{ id: 'p1', judgeIds: ['lead'] }]
  expect(panelsForTeam(t, onlyBlocked, judges)).toEqual([])
})

test('transfer destinations exclude panels holding a team of a conflict country', () => {
  const teams = [team('a', 'BR', 'p1'), team('b', 'US', 'p2')]
  const j = { conflict: ['USA'] }
  expect(judgeConflictsWithPanel(j, 'p1', teams)).toEqual([])
  expect(judgeConflictsWithPanel(j, 'p2', teams)).toEqual(['USA'])
})
