import type { User } from '@fgc/contracts'
import { filterUsers, paginate, parseAccessCsv } from './admin'

describe('parseAccessCsv', () => {
  it('parses plain, bracketed and quoted role lists', () => {
    const rows = parseAccessCsv(
      'A@x.test, filmmaker\nb@x.test, [judge,judgeAdvisor]\nc@x.test,"admin"\n\n',
    )
    expect(rows.map((r) => [r.email, r.roles, r.error])).toEqual([
      ['a@x.test', ['filmmaker'], undefined],
      ['b@x.test', ['judge', 'judgeAdvisor'], undefined],
      ['c@x.test', ['admin'], undefined],
    ])
  })
  it('never rewrites the email and still unwraps quoted or bracketed roles', () => {
    const rows = parseAccessCsv(
      'D\'Arcy@x.test, [judge, \'judgeAdvisor\']\no\'neil@x.test,"filmmaker"\nq@x.test, "admin"',
    )
    expect(rows.map((r) => [r.email, r.roles, r.error])).toEqual([
      ["d'arcy@x.test", ['judge', 'judgeAdvisor'], undefined],
      ["o'neil@x.test", ['filmmaker'], undefined],
      ['q@x.test', ['admin'], undefined],
    ])
  })
  it('flags invalid rows', () => {
    const rows = parseAccessCsv(
      'nope, judge\na@x.test\na@x.test, boss\na@x.test, admin, judge',
    )
    expect(rows.map((r) => r.error)).toEqual([
      'Invalid email address',
      'Add at least one role',
      'Unknown role: boss',
      'Admin and judging roles cannot be combined',
    ])
  })
})

describe('filterUsers and paginate', () => {
  const users: User[] = Array.from({ length: 31 }, (_, i) => ({
    id: String(i),
    email: `u${i}@x.test`,
    name: i === 3 ? 'Zed' : null,
    roles: i % 2 ? ['judge'] : ['filmmaker'],
    version: 1,
  }))
  it('filters by name, email and role', () => {
    expect(filterUsers(users, { name: 'zed', email: '', role: '' })).toHaveLength(1)
    expect(filterUsers(users, { name: '', email: 'u1', role: 'judge' }).length).toBe(6)
  })
  it('clamps pages to 15 per page', () => {
    expect(paginate(users, 1).items).toHaveLength(15)
    expect(paginate(users, 3).items).toHaveLength(1)
    expect(paginate(users, 9).page).toBe(3)
    expect(paginate([], 1).pages).toBe(1)
  })
})
