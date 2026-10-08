import snapshotData from './teams.snapshot.json'

/**
 * FGC teams derived from api.first.global. The API has no teams endpoint and no team names:
 * teams exist only as match participants, so they are de-duplicated by `teamKey` and named
 * after their country. Framework-agnostic: no UI, no storage, `fetch` is injectable.
 */
export interface FgcTeam {
  teamKey: number
  /** FIRST country tag, e.g. "BRA". Not ISO alpha-3 ("CHI" is Chile). */
  code: string
  /** Lowercase 2-letter code, e.g. "br". */
  iso2: string
  /** English country name, e.g. "Brazil". */
  name: string
}

export interface FgcTeamsResult {
  teams: FgcTeam[]
  source: 'live' | 'snapshot'
  /** ISO timestamp of the live fetch, or of the snapshot. */
  fetchedAt: string
}

export interface FgcApiConfig {
  url: string
  query: Record<string, string>
  /** Only if pre-flight shows they are required. Browsers forbid Origin/Referer. */
  headers?: Record<string, string>
}

export interface FgcTeamsSnapshot {
  generatedAt: string
  teams: FgcTeam[]
}

export interface FetchTeamsOptions {
  signal?: AbortSignal
  forceRefresh?: boolean
  /** Default true. */
  allowSnapshotFallback?: boolean
  config?: Partial<FgcApiConfig>
  /** Injectable for tests. */
  fetchImpl?: typeof fetch
  /** Injectable for tests; defaults to the bundled `teams.snapshot.json`. */
  snapshot?: FgcTeamsSnapshot
}

export class FgcApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'FgcApiError'
  }
}

export class FgcEmptyDataError extends Error {
  constructor(message = 'The FGC API returned no teams') {
    super(message)
    this.name = 'FgcEmptyDataError'
  }
}

/** The API answers an empty payload to the bare URL, so the parameter is always sent. */
export const FGC_API_CONFIG: FgcApiConfig = {
  url: 'https://api.first.global/v1',
  query: { excludeMatchDetails: 'true' },
}

export const FGC_TEAMS_CACHE_TTL_MS = 10 * 60 * 1000
const REQUEST_TIMEOUT_MS = 15_000

/** Names for codes `Intl.DisplayNames` rejects or does not know in every runtime. */
const NAME_OVERRIDES: Record<string, string> = {
  xk: 'Kosovo',
}

function regionName(names: Intl.DisplayNames | null, iso2: string): string | undefined {
  const override = NAME_OVERRIDES[iso2]
  if (override) return override
  try {
    const name = names?.of(iso2.toUpperCase())
    // Unknown regions come back as the code itself.
    return name && name.toUpperCase() !== iso2.toUpperCase() ? name : undefined
  } catch {
    return undefined
  }
}

function createDisplayNames(): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' })
  } catch {
    return null
  }
}

const byName = (a: FgcTeam, b: FgcTeam) =>
  a.name.localeCompare(b.name, 'en') || a.teamKey - b.teamKey

/** Pure: derives the unique, name-sorted teams from an API payload. Bad entries are skipped. */
export function extractTeams(payload: unknown): FgcTeam[] {
  const matches = (payload as { matches?: unknown } | null | undefined)?.matches
  if (!Array.isArray(matches)) return []
  const names = createDisplayNames()
  const seen = new Map<number, FgcTeam>()
  for (const match of matches) {
    const participants = (match as { participants?: unknown } | null)?.participants
    if (!Array.isArray(participants)) continue
    for (const participant of participants) {
      const p = participant as Record<string, unknown> | null
      if (!p || typeof p !== 'object') continue
      const { teamKey, country, countryCode } = p
      if (typeof teamKey !== 'number' || !Number.isFinite(teamKey)) continue
      if (typeof country !== 'string' || typeof countryCode !== 'string') continue
      if (seen.has(teamKey)) continue
      const code = country.trim().toUpperCase()
      const iso2 = countryCode.trim().toLowerCase()
      if (!code) continue
      seen.set(teamKey, { teamKey, code, iso2, name: regionName(names, iso2) ?? code })
    }
  }
  return [...seen.values()].sort(byName)
}

const fold = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ')

/** Lower is better: 0 exact, 1 prefix, 2 contains, -1 no match. */
function score(team: FgcTeam, q: string): number {
  const name = fold(team.name)
  const code = fold(team.code)
  const iso2 = fold(team.iso2)
  if (name === q || code === q || iso2 === q) return 0
  if (name.startsWith(q) || code.startsWith(q)) return 1
  if (name.includes(q)) return 2
  return -1
}

/** Case- and accent-insensitive; exact matches first, then prefix, then contains. */
export function filterTeams(teams: FgcTeam[], query: string): FgcTeam[] {
  const q = fold(query)
  if (!q) return [...teams]
  return teams
    .map((team) => ({ team, rank: score(team, q) }))
    .filter((entry) => entry.rank >= 0)
    .sort((a, b) => a.rank - b.rank || byName(a.team, b.team))
    .map((entry) => entry.team)
}

let cache: { teams: FgcTeam[]; fetchedAt: string; expiresAt: number } | null = null
let inFlight: Promise<{ teams: FgcTeam[]; fetchedAt: string }> | null = null

/** Test helper: forgets the cached list and any in-flight request. */
export function resetFgcTeamsCache() {
  cache = null
  inFlight = null
}

function requestUrl(config: FgcApiConfig) {
  const url = new URL(config.url)
  for (const [key, value] of Object.entries(config.query))
    url.searchParams.set(key, value)
  return url.toString()
}

async function requestLive(
  fetchImpl: typeof fetch,
  config: FgcApiConfig,
): Promise<{ teams: FgcTeam[]; fetchedAt: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetchImpl(requestUrl(config), {
      headers: config.headers,
      signal: controller.signal,
    })
  } catch (e) {
    throw new FgcApiError(
      controller.signal.aborted
        ? 'The FGC API request timed out'
        : `The FGC API could not be reached: ${(e as Error)?.message ?? 'network error'}`,
    )
  } finally {
    clearTimeout(timer)
  }
  if (response.status !== 200)
    throw new FgcApiError(`The FGC API answered ${response.status}`, response.status)
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new FgcApiError('The FGC API returned invalid JSON', response.status)
  }
  const teams = extractTeams(payload)
  if (!teams.length) throw new FgcEmptyDataError()
  return { teams, fetchedAt: new Date().toISOString() }
}

/** Each caller can leave on its own signal without cancelling the request others share. */
function untilAborted<T>(work: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return work
  return new Promise<T>((resolve, reject) => {
    const abort = () =>
      reject(signal.reason ?? new DOMException('The operation was aborted', 'AbortError'))
    if (signal.aborted) {
      work.catch(() => undefined)
      return abort()
    }
    signal.addEventListener('abort', abort, { once: true })
    work.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
  })
}

/**
 * Live teams (cached 10 minutes, shared between concurrent callers), or the bundled snapshot
 * when the live call fails or is empty. Only a successful non-empty live result is cached.
 */
export async function fetchTeams(opts: FetchTeamsOptions = {}): Promise<FgcTeamsResult> {
  const { signal, forceRefresh = false, allowSnapshotFallback = true } = opts
  if (!forceRefresh && cache && cache.expiresAt > Date.now())
    return { teams: cache.teams, source: 'live', fetchedAt: cache.fetchedAt }
  if (!inFlight) {
    const config: FgcApiConfig = {
      ...FGC_API_CONFIG,
      ...opts.config,
      query: { ...FGC_API_CONFIG.query, ...opts.config?.query },
    }
    const request = requestLive(opts.fetchImpl ?? fetch, config)
    const tracked = request
      .then((live) => {
        cache = { ...live, expiresAt: Date.now() + FGC_TEAMS_CACHE_TTL_MS }
        return live
      })
      .finally(() => {
        if (inFlight === tracked) inFlight = null
      })
    inFlight = tracked
  }
  try {
    const live = await untilAborted(inFlight, signal)
    return { teams: live.teams, source: 'live', fetchedAt: live.fetchedAt }
  } catch (e) {
    if (signal?.aborted) throw e
    const snapshot = opts.snapshot ?? (snapshotData as FgcTeamsSnapshot)
    if (allowSnapshotFallback && snapshot.teams.length)
      return {
        teams: [...snapshot.teams].sort(byName),
        source: 'snapshot',
        fetchedAt: snapshot.generatedAt,
      }
    throw e
  }
}

/** Flag emoji from a lowercase ISO 3166-1 alpha-2 code, or '' when the code is not two letters. */
export function flagEmoji(iso2: string): string {
  if (!/^[a-z]{2}$/i.test(iso2)) return ''
  return [...iso2.toLowerCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 97))
    .join('')
}
