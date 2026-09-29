import type { Participation } from '@fgc/contracts'

/** ISO 3166-1 alpha-3 -> alpha-2 (complete), plus XKX/XK for Kosovo used by FIRST. */
const ALPHA3: Record<string, string> = {
  AFG: 'AF',
  ALA: 'AX',
  ALB: 'AL',
  DZA: 'DZ',
  ASM: 'AS',
  AND: 'AD',
  AGO: 'AO',
  AIA: 'AI',
  ATA: 'AQ',
  ATG: 'AG',
  ARG: 'AR',
  ARM: 'AM',
  ABW: 'AW',
  AUS: 'AU',
  AUT: 'AT',
  AZE: 'AZ',
  BHS: 'BS',
  BHR: 'BH',
  BGD: 'BD',
  BRB: 'BB',
  BLR: 'BY',
  BEL: 'BE',
  BLZ: 'BZ',
  BEN: 'BJ',
  BMU: 'BM',
  BTN: 'BT',
  BOL: 'BO',
  BES: 'BQ',
  BIH: 'BA',
  BWA: 'BW',
  BVT: 'BV',
  BRA: 'BR',
  IOT: 'IO',
  BRN: 'BN',
  BGR: 'BG',
  BFA: 'BF',
  BDI: 'BI',
  CPV: 'CV',
  KHM: 'KH',
  CMR: 'CM',
  CAN: 'CA',
  CYM: 'KY',
  CAF: 'CF',
  TCD: 'TD',
  CHL: 'CL',
  CHN: 'CN',
  CXR: 'CX',
  CCK: 'CC',
  COL: 'CO',
  COM: 'KM',
  COG: 'CG',
  COD: 'CD',
  COK: 'CK',
  CRI: 'CR',
  CIV: 'CI',
  HRV: 'HR',
  CUB: 'CU',
  CUW: 'CW',
  CYP: 'CY',
  CZE: 'CZ',
  DNK: 'DK',
  DJI: 'DJ',
  DMA: 'DM',
  DOM: 'DO',
  ECU: 'EC',
  EGY: 'EG',
  SLV: 'SV',
  GNQ: 'GQ',
  ERI: 'ER',
  EST: 'EE',
  SWZ: 'SZ',
  ETH: 'ET',
  FLK: 'FK',
  FRO: 'FO',
  FJI: 'FJ',
  FIN: 'FI',
  FRA: 'FR',
  GUF: 'GF',
  PYF: 'PF',
  ATF: 'TF',
  GAB: 'GA',
  GMB: 'GM',
  GEO: 'GE',
  DEU: 'DE',
  GHA: 'GH',
  GIB: 'GI',
  GRC: 'GR',
  GRL: 'GL',
  GRD: 'GD',
  GLP: 'GP',
  GUM: 'GU',
  GTM: 'GT',
  GGY: 'GG',
  GIN: 'GN',
  GNB: 'GW',
  GUY: 'GY',
  HTI: 'HT',
  HMD: 'HM',
  VAT: 'VA',
  HND: 'HN',
  HKG: 'HK',
  HUN: 'HU',
  ISL: 'IS',
  IND: 'IN',
  IDN: 'ID',
  IRN: 'IR',
  IRQ: 'IQ',
  IRL: 'IE',
  IMN: 'IM',
  ISR: 'IL',
  ITA: 'IT',
  JAM: 'JM',
  JPN: 'JP',
  JEY: 'JE',
  JOR: 'JO',
  KAZ: 'KZ',
  KEN: 'KE',
  KIR: 'KI',
  PRK: 'KP',
  KOR: 'KR',
  KWT: 'KW',
  KGZ: 'KG',
  LAO: 'LA',
  LVA: 'LV',
  LBN: 'LB',
  LSO: 'LS',
  LBR: 'LR',
  LBY: 'LY',
  LIE: 'LI',
  LTU: 'LT',
  LUX: 'LU',
  MAC: 'MO',
  MDG: 'MG',
  MWI: 'MW',
  MYS: 'MY',
  MDV: 'MV',
  MLI: 'ML',
  MLT: 'MT',
  MHL: 'MH',
  MTQ: 'MQ',
  MRT: 'MR',
  MUS: 'MU',
  MYT: 'YT',
  MEX: 'MX',
  FSM: 'FM',
  MDA: 'MD',
  MCO: 'MC',
  MNG: 'MN',
  MNE: 'ME',
  MSR: 'MS',
  MAR: 'MA',
  MOZ: 'MZ',
  MMR: 'MM',
  NAM: 'NA',
  NRU: 'NR',
  NPL: 'NP',
  NLD: 'NL',
  NCL: 'NC',
  NZL: 'NZ',
  NIC: 'NI',
  NER: 'NE',
  NGA: 'NG',
  NIU: 'NU',
  NFK: 'NF',
  MKD: 'MK',
  MNP: 'MP',
  NOR: 'NO',
  OMN: 'OM',
  PAK: 'PK',
  PLW: 'PW',
  PSE: 'PS',
  PAN: 'PA',
  PNG: 'PG',
  PRY: 'PY',
  PER: 'PE',
  PHL: 'PH',
  PCN: 'PN',
  POL: 'PL',
  PRT: 'PT',
  PRI: 'PR',
  QAT: 'QA',
  REU: 'RE',
  ROU: 'RO',
  RUS: 'RU',
  RWA: 'RW',
  BLM: 'BL',
  SHN: 'SH',
  KNA: 'KN',
  LCA: 'LC',
  MAF: 'MF',
  SPM: 'PM',
  VCT: 'VC',
  WSM: 'WS',
  SMR: 'SM',
  STP: 'ST',
  SAU: 'SA',
  SEN: 'SN',
  SRB: 'RS',
  SYC: 'SC',
  SLE: 'SL',
  SGP: 'SG',
  SXM: 'SX',
  SVK: 'SK',
  SVN: 'SI',
  SLB: 'SB',
  SOM: 'SO',
  ZAF: 'ZA',
  SGS: 'GS',
  SSD: 'SS',
  ESP: 'ES',
  LKA: 'LK',
  SDN: 'SD',
  SUR: 'SR',
  SJM: 'SJ',
  SWE: 'SE',
  CHE: 'CH',
  SYR: 'SY',
  TWN: 'TW',
  TJK: 'TJ',
  TZA: 'TZ',
  THA: 'TH',
  TLS: 'TL',
  TGO: 'TG',
  TKL: 'TK',
  TON: 'TO',
  TTO: 'TT',
  TUN: 'TN',
  TUR: 'TR',
  TKM: 'TM',
  TCA: 'TC',
  TUV: 'TV',
  UGA: 'UG',
  UKR: 'UA',
  ARE: 'AE',
  GBR: 'GB',
  USA: 'US',
  UMI: 'UM',
  URY: 'UY',
  UZB: 'UZ',
  VUT: 'VU',
  VEN: 'VE',
  VNM: 'VN',
  VGB: 'VG',
  VIR: 'VI',
  WLF: 'WF',
  ESH: 'EH',
  YEM: 'YE',
  ZMB: 'ZM',
  ZWE: 'ZW',
  XKX: 'XK',
}
const ALPHA2 = new Set(Object.values(ALPHA3))
let namesToCode: Map<string, string> | undefined
/** English country name -> alpha-2, so teams imported with a country name still match. */
function codeFromName(name: string): string | undefined {
  if (!namesToCode) {
    namesToCode = new Map()
    try {
      const display = new Intl.DisplayNames(['en'], { type: 'region' })
      for (const code of ALPHA2) {
        const label = display.of(code)
        if (label && label !== code) namesToCode.set(label.toUpperCase(), code)
      }
    } catch {
      // Intl.DisplayNames unavailable: codes still work, names are not resolved.
    }
  }
  return namesToCode.get(name.trim().toUpperCase())
}
/** Canonical alpha-2 for a code (alpha-2 or alpha-3) or English name; undefined if unknown. */
export function normalizeCountry(value: string): string | undefined {
  const key = value.trim().toUpperCase()
  if (ALPHA2.has(key)) return key
  return ALPHA3[key] ?? codeFromName(key)
}
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
