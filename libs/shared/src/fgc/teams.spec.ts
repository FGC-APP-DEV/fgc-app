import fixture from './fixtures/sample-matches.json'
import realMatch from './fixtures/real-match-1.json'
import {
  FgcApiError,
  FgcEmptyDataError,
  extractMatches,
  extractTeams,
  formatMatchTime,
  flagEmoji,
  fetchTeams,
  filterTeams,
  matchesForTeam,
  resetFgcTeamsCache,
  type FgcTeam,
  type FgcTeamsSnapshot,
} from './teams'

const teams = extractTeams(fixture)
const emptyPayload = {
  matches: [],
  rankings: [],
  round_robin: [],
  finals: [],
  alliances_round_robin: [],
  alliances_finals: [],
  awards: [],
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status })
const snapshot: FgcTeamsSnapshot = {
  generatedAt: '2026-10-07T08:01:57.000Z',
  teams: [{ teamKey: 9, code: 'ARG', iso2: 'ar', name: 'Argentina' }],
}
const team = (code: string) => teams.find((t) => t.code === code) as FgcTeam

beforeEach(() => resetFgcTeamsCache())

describe('extractTeams', () => {
  it('de-duplicates by teamKey and sorts by name', () => {
    expect(teams).toHaveLength(11)
    expect(teams.filter((t) => t.teamKey === 23)).toHaveLength(1)
    const names = teams.map((t) => t.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')))
  })
  it('names teams from countryCode, not from the FIRST tag', () => {
    expect(team('BRA')).toMatchObject({ teamKey: 23, iso2: 'br', name: 'Brazil' })
    expect(team('CHI').name).toBe('Chile')
    expect(team('GER').name).toBe('Germany')
    expect(team('KOS').name).toBe('Kosovo')
  })
  it('does not throw on an invalid region code and falls back to the code', () => {
    expect(team('HPE')).toMatchObject({ teamKey: 78, name: 'HPE' })
  })
  it('skips malformed participants and tolerates a malformed payload', () => {
    const payload = {
      matches: [
        null,
        { participants: 'nope' },
        {
          participants: [
            null,
            { teamKey: '5', country: 'BRA', countryCode: 'br' },
            { teamKey: 6, country: 7, countryCode: 'br' },
            { teamKey: 7, country: 'ARG' },
            { teamKey: 8, country: 'ARG', countryCode: 'ar' },
          ],
        },
      ],
    }
    expect(extractTeams(payload).map((t) => t.teamKey)).toEqual([8])
    for (const bad of [null, undefined, 3, 'x', {}, { matches: {} }])
      expect(extractTeams(bad)).toEqual([])
  })
})

describe('filterTeams', () => {
  it('finds a country by name, ignoring case and surrounding whitespace', () => {
    expect(filterTeams(teams, 'Brazil').map((t) => t.teamKey)).toEqual([23])
    expect(filterTeams(teams, '  bRaZiL ')).toEqual(filterTeams(teams, 'Brazil'))
  })
  it('puts the exact tag or ISO code match first', () => {
    expect(filterTeams(teams, 'BRA')[0].teamKey).toBe(23)
    expect(filterTeams(teams, 'br')[0].teamKey).toBe(23)
  })
  it('matches inside the name', () => {
    expect(filterTeams(teams, 'korea').map((t) => t.teamKey)).toContain(93)
    expect(filterTeams(teams, 'turk').map((t) => t.teamKey)).toContain(170)
  })
  it('ignores accents on both sides', () => {
    expect(filterTeams(teams, 'cote').map((t) => t.code)).toEqual(['CIV'])
    expect(filterTeams(teams, 'CÔTE')).toHaveLength(1)
  })
  it('ranks exact, then prefix, then contains, ties by name', () => {
    const list: FgcTeam[] = [
      { teamKey: 1, code: 'XXX', iso2: 'xx', name: 'Congo (Brazzaville)' },
      { teamKey: 2, code: 'AAA', iso2: 'aa', name: 'Bra' },
      { teamKey: 3, code: 'BRA', iso2: 'br', name: 'Brazil' },
      { teamKey: 4, code: 'BRB', iso2: 'bb', name: 'Brabant' },
    ]
    expect(filterTeams(list, 'bra').map((t) => t.teamKey)).toEqual([2, 3, 4, 1])
  })
  it('returns everything for an empty query and nothing for a miss', () => {
    expect(filterTeams(teams, '')).toEqual(teams)
    expect(filterTeams(teams, '   ')).toEqual(teams)
    expect(filterTeams(teams, 'xyz')).toEqual([])
  })
})

describe('fetchTeams', () => {
  it('requests the URL with excludeMatchDetails=true and the configured headers', async () => {
    const fetchImpl = jest.fn(async () => json(fixture))
    const result = await fetchTeams({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      config: { headers: { 'X-Test': '1' } },
    })
    expect(result.source).toBe('live')
    expect(result.teams).toHaveLength(11)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.first.global/v1?excludeMatchDetails=true')
    expect(init.headers).toEqual({ 'X-Test': '1' })
  })
  it('rejects with FgcApiError carrying the status on a non-200', async () => {
    const fetchImpl = (async () => json({}, 500)) as unknown as typeof fetch
    await expect(
      fetchTeams({ fetchImpl, allowSnapshotFallback: false }),
    ).rejects.toMatchObject({ name: 'FgcApiError', status: 500 })
  })
  it('rejects with FgcApiError on invalid JSON and on a network failure', async () => {
    const invalid = (async () => new Response('<html>', { status: 200 })) as typeof fetch
    await expect(
      fetchTeams({ fetchImpl: invalid, allowSnapshotFallback: false }),
    ).rejects.toBeInstanceOf(FgcApiError)
    const down = (async () => {
      throw new TypeError('Failed to fetch')
    }) as typeof fetch
    await expect(
      fetchTeams({ fetchImpl: down, allowSnapshotFallback: false }),
    ).rejects.toBeInstanceOf(FgcApiError)
  })
  it('treats empty data as an error and never caches it', async () => {
    const fetchImpl = jest.fn(async () => json(emptyPayload))
    const opts = {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      allowSnapshotFallback: false,
    }
    await expect(fetchTeams(opts)).rejects.toBeInstanceOf(FgcEmptyDataError)
    await expect(fetchTeams(opts)).rejects.toBeInstanceOf(FgcEmptyDataError)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
  it('falls back to the snapshot on failure or empty data and does not cache it', async () => {
    const fetchImpl = jest.fn(async () => json({}, 500))
    const opts = { fetchImpl: fetchImpl as unknown as typeof fetch, snapshot }
    const failed = await fetchTeams(opts)
    expect(failed).toMatchObject({ source: 'snapshot', fetchedAt: snapshot.generatedAt })
    expect(failed.teams).toEqual(snapshot.teams)
    const empty = await fetchTeams({
      fetchImpl: (async () => json(emptyPayload)) as typeof fetch,
      snapshot,
    })
    expect(empty.source).toBe('snapshot')
    await fetchTeams(opts)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
  it('rethrows the live error when there is no snapshot to fall back to', async () => {
    const fetchImpl = (async () => json({}, 503)) as unknown as typeof fetch
    await expect(
      fetchTeams({ fetchImpl, snapshot: { generatedAt: '', teams: [] } }),
    ).rejects.toMatchObject({ status: 503 })
  })
  it('caches for 2 minutes and forceRefresh bypasses the cache', async () => {
    const fetchImpl = jest.fn(async () => json(fixture))
    const opts = { fetchImpl: fetchImpl as unknown as typeof fetch }
    await fetchTeams(opts)
    await fetchTeams(opts)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    await fetchTeams({ ...opts, forceRefresh: true })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    const now = Date.now()
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now + 2 * 60 * 1000 + 1)
    await fetchTeams(opts)
    clock.mockRestore()
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })
  it('shares one request between concurrent callers', async () => {
    const fetchImpl = jest.fn(async () => json(fixture))
    const opts = { fetchImpl: fetchImpl as unknown as typeof fetch }
    const [a, b] = await Promise.all([fetchTeams(opts), fetchTeams(opts)])
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(a.teams).toEqual(b.teams)
  })
  it('lets one caller abort without breaking the other', async () => {
    const fetchImpl = jest.fn(async () => json(fixture))
    const opts = { fetchImpl: fetchImpl as unknown as typeof fetch }
    const controller = new AbortController()
    const aborted = fetchTeams({ ...opts, signal: controller.signal })
    const other = fetchTeams(opts)
    controller.abort()
    await expect(aborted).rejects.toBeDefined()
    await expect(other).resolves.toMatchObject({ source: 'live' })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

describe('flagEmoji', () => {
  it('maps two letters to a flag and ignores invalid codes', () => {
    expect(flagEmoji('br')).toBe('🇧🇷')
    expect(flagEmoji('KR')).toBe('🇰🇷')
    expect(flagEmoji('10')).toBe('')
    expect(flagEmoji('')).toBe('')
  })
})

describe('extractMatches', () => {
  const [match] = extractMatches(realMatch)
  it('reads the schedule of a real API match', () => {
    expect(match).toMatchObject({
      key: 't2:1',
      id: 1,
      name: 'Ranking Match 1',
      scheduledTime: '2026-10-08T11:15:00.900+09:00',
      field: 1,
      played: true,
      redScore: 72,
      blueScore: 42,
    })
  })
  it('splits the alliances by station, in station order', () => {
    expect(match.red.map((t) => t.code)).toEqual(['SLE', 'ARU', 'AFG'])
    expect(match.blue.map((t) => t.code)).toEqual(['ANG', 'SRB', 'NOR'])
    expect(match.red[0]).toEqual({ teamKey: 150, code: 'SLE', iso2: 'sl' })
  })
  it('has no scores until the match is played, and tolerates missing fields', () => {
    const [unplayed] = extractMatches({
      matches: [
        {
          id: 2,
          played: false,
          redScore: 0,
          blueScore: 0,
          participants: [{ teamKey: 1, country: 'AFG', countryCode: 'af', station: 11 }],
        },
      ],
    })
    expect(unplayed).toMatchObject({
      name: 'Match 2',
      scheduledTime: '',
      field: null,
      redScore: null,
      blueScore: null,
    })
    expect(
      extractMatches({ matches: [{ id: 'x' }, null, { id: 3, participants: [] }] }),
    ).toEqual([])
    expect(extractMatches(null)).toEqual([])
  })
  it('orders matches by time and finds the ones a team plays', () => {
    const at = (id: number, scheduledTime: string, teamKey: number) => ({
      id,
      scheduledTime,
      participants: [{ teamKey, country: 'AFG', countryCode: 'af', station: 11 }],
    })
    const list = extractMatches({
      matches: [
        at(2, '2026-10-08T12:03:00+09:00', 1),
        at(1, '2026-10-08T11:15:00+09:00', 1),
        at(3, '2026-10-08T11:30:00+09:00', 2),
      ],
    })
    expect(list.map((m) => m.id)).toEqual([1, 3, 2])
    expect(matchesForTeam(list, 1).map((m) => m.id)).toEqual([1, 2])
    expect(matchesForTeam(list, 99)).toEqual([])
  })
})

describe('formatMatchTime', () => {
  it('shows the event wall-clock time whatever the viewer time zone', () => {
    expect(formatMatchTime('2026-10-08T11:15:00.900+09:00')).toEqual({
      day: 'Thu',
      time: '11:15',
    })
    expect(formatMatchTime('2026-10-10T00:05:00+09:00')).toEqual({
      day: 'Sat',
      time: '00:05',
    })
  })
  it('returns null for anything else', () => {
    expect(formatMatchTime('')).toBeNull()
    expect(formatMatchTime('soon')).toBeNull()
  })
})
