import { createHmac, randomUUID } from 'node:crypto'
import type { MockGateway } from './gateway'

export interface MockAccount {
  email: string
  name: string
  roles: string[]
  note: string
}
export const accounts: MockAccount[] = [
  {
    email: 'admin@fgc.test',
    name: 'Ada Admin',
    roles: ['admin'],
    note: 'Access, imports, mentor codes. Denied Judging.',
  },
  {
    email: 'ja@fgc.test',
    name: 'Jamie Advisor',
    roles: ['judgeAdvisor'],
    note: 'Judge advisor: panels, closure, audit.',
  },
  {
    email: 'judge1@fgc.test',
    name: 'Jo Judge',
    roles: ['judge'],
    note: 'Panel A leader.',
  },
  {
    email: 'judge2@fgc.test',
    name: 'Jules Judge',
    roles: ['judge'],
    note: 'Panel A member.',
  },
  {
    email: 'judge3@fgc.test',
    name: 'Jin Judge',
    roles: ['judge'],
    note: 'Panel B leader.',
  },
  {
    email: 'judge4@fgc.test',
    name: 'Jay Judge',
    roles: ['judge'],
    note: 'Panel B member.',
  },
  {
    email: 'film@fgc.test',
    name: 'Fran Filmmaker',
    roles: ['filmmaker'],
    note: 'Filming tracker and pager.',
  },
  {
    email: 'multi@fgc.test',
    name: 'Max Multi',
    roles: ['filmmaker', 'judge'],
    note: 'Filming + Judging (no panel yet).',
  },
  {
    email: 'admin-judge@fgc.test',
    name: 'Alex Both',
    roles: ['admin', 'judge'],
    note: 'Mixed role: the admin deny wins over Judging.',
  },
]
/** Approved by an administrator but never signed in: shows as pending access. */
export const pendingEmails = ['newcomer@fgc.test']

const countries = [
  ['BR', 'Brazil'],
  ['US', 'United States'],
  ['KE', 'Kenya'],
  ['JP', 'Japan'],
  ['DE', 'Germany'],
  ['AU', 'Australia'],
  ['IN', 'India'],
  ['MX', 'Mexico'],
  ['NG', 'Nigeria'],
  ['FR', 'France'],
  ['KR', 'South Korea'],
  ['AR', 'Argentina'],
  ['EG', 'Egypt'],
  ['CA', 'Canada'],
  ['IT', 'Italy'],
  ['CN', 'China'],
  ['ZA', 'South Africa'],
  ['GB', 'United Kingdom'],
  ['CO', 'Colombia'],
  ['SG', 'Singapore'],
  ['GH', 'Ghana'],
  ['ES', 'Spain'],
  ['NZ', 'New Zealand'],
  ['CL', 'Chile'],
] as const
export const mentorCodes = [
  { official: '001', code: 'MOCKMENTOR001' },
  { official: '002', code: 'MOCKMENTOR002' },
  { official: '003', code: 'MOCKMENTOR003' },
]

/**
 * Loads a demonstration event through the real SQL (direct inserts only for the
 * identities and reference data; everything else goes through api.* commands so
 * versions, receipts and authorization are the production ones).
 */
export async function seed(mock: MockGateway, mentorSecret: string) {
  const { db } = mock
  const event = randomUUID()
  await db.query(
    `insert into core.events(id,name,active,schedule_url) values($1,'FIRST Global Challenge (mock data)',true,'https://example.com/fgc-schedule')`,
    [event],
  )
  const ids = new Map<string, string>()
  for (const a of accounts) {
    const id = randomUUID()
    ids.set(a.email, id)
    await db.query('insert into auth.users(id,email) values($1,$2)', [id, a.email])
    await db.query('insert into core.users(id,email,name) values($1,$2,$3)', [
      id,
      a.email,
      a.name,
    ])
    for (const role of a.roles)
      await db.query(
        'insert into core.user_event_roles(event_id,user_id,role) values($1,$2,$3)',
        [event, id, role],
      )
    await db.query(
      'insert into core.approved_emails(event_id,email,roles) values($1,$2,$3)',
      [event, a.email, a.roles],
    )
  }
  await db.query(
    'insert into core.approved_emails(event_id,email,roles) values($1,$2,$3)',
    [event, pendingEmails[0], ['filmmaker']],
  )
  for (const [i, [country, name]] of countries.entries())
    await db.query('insert into core.teams(official_id,name,country) values($1,$2,$3)', [
      String(i + 1).padStart(3, '0'),
      `Team ${name}`,
      country,
    ])
  for (const [n, d] of [
    ['Step & Repeat', 'Team photo at the backdrop'],
    ['Robot portrait', 'Robot on the competition field'],
    ['Team interview', 'Short interview in the pit'],
  ] as const)
    await db.query(
      'insert into filming.templates(event_id,name,description) values($1,$2,$3)',
      [event, n, d],
    )
  await db.query('insert into judging.cycles(event_id) values($1)', [event])

  const teams = (
    await db.query<{ id: string; official_id: string }>(
      'select id,official_id from core.teams order by official_id',
    )
  ).rows
  const session = async (email: string) => {
    const started = await mock.startSession(email, 10 * 365 * 86_400_000)
    return mock.asIdentity({ userId: started.userId, sessionId: started.sessionId })
  }
  const userId = (email: string) => ids.get(email) as string
  const key = () => randomUUID()

  const ja = await session('ja@fgc.test')
  await ja.rpc('panel_create', {
    p_input: {
      name: 'Panel A',
      leaderId: userId('judge1@fgc.test'),
      judgeIds: [userId('judge1@fgc.test'), userId('judge2@fgc.test')],
    },
    p_key: key(),
  })
  await ja.rpc('panel_create', {
    p_input: {
      name: 'Panel B',
      leaderId: userId('judge3@fgc.test'),
      judgeIds: [userId('judge3@fgc.test'), userId('judge4@fgc.test')],
    },
    p_key: key(),
  })
  const panels = (await ja.rpc('panels_list', {})) as {
    id: string
    name: string
    version: number
  }[]
  const panel = (name: string) =>
    panels.find((p) => p.name === name) as {
      id: string
      version: number
    }
  const assign = async (name: string, from: number, to: number) => {
    let version = panel(name).version
    for (const t of teams.slice(from, to)) {
      await ja.rpc('participation_add', { p_input: { teamId: t.id }, p_key: key() })
      await ja.rpc('panel_team', {
        p_input: { teamId: t.id, panelId: panel(name).id, expectedVersion: version },
        p_key: key(),
      })
      version += 1
    }
  }
  await assign('Panel A', 0, 6)
  await assign('Panel B', 6, 12)
  const judge1 = await session('judge1@fgc.test')
  await judge1.rpc('observation_put', {
    p_input: {
      teamId: teams[0].id,
      panelId: panel('Panel A').id,
      expectedVersion: 0,
      text: 'Strong robot design and clear team roles. Follow up on the outreach project.',
    },
    p_key: key(),
  })
  await ja.rpc('flag_put', {
    p_input: { teamId: teams[1].id, type: 'absent', expectedVersion: 0 },
    p_key: key(),
  })

  const film = await session('film@fgc.test')
  const templates = (
    await db.query<{ id: string }>('select id from filming.templates order by name')
  ).rows
  await film.rpc('shot_mark', {
    p_input: {
      teamId: teams[0].id,
      templateId: templates[2].id,
      expectedVersion: 0,
      status: 'captured',
      notes: 'Great energy, all six members present.',
    },
    p_key: key(),
  })
  await film.rpc('shot_mark', {
    p_input: {
      teamId: teams[1].id,
      templateId: templates[2].id,
      expectedVersion: 0,
      status: 'skipped',
      notes: 'Team was in a match.',
    },
    p_key: key(),
  })
  await film.rpc('category_create', {
    p_input: { name: 'Opening ceremony', description: 'Must-have moments' },
    p_key: key(),
  })
  const categories = (await film.rpc('categories_list', {})) as { id: string }[]
  for (const title of ['Parade of nations', 'Wide shot of the arena', 'Flag ceremony'])
    await film.rpc('item_create', {
      p_input: { categoryId: categories[0].id, title },
      p_key: key(),
    })

  const admin = await session('admin@fgc.test')
  for (const m of mentorCodes) {
    const team = teams.find((t) => t.official_id === m.official) as { id: string }
    const digest = createHmac('sha256', mentorSecret).update(m.code).digest('hex')
    await admin.rpc('mentor_code_issue', {
      p_input: { teamId: team.id, expectedVersion: 0, digest },
      p_key: key(),
    })
  }
  await film.rpc('page_create', {
    p_input: {
      teamId: teams[0].id,
      sourceArea: 'filming',
      message: 'Please come to the Step & Repeat backdrop now.',
    },
    p_key: key(),
  })
  await ja.rpc('page_create', {
    p_input: {
      teamId: teams[2].id,
      sourceArea: 'judges',
      message: 'Judges are ready for your interview.',
    },
    p_key: key(),
  })
}
