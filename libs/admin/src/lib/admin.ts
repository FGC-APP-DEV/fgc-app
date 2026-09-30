import { roleSchema, type Role, type User } from '@fgc/contracts'

export const ROLES = roleSchema.options as readonly Role[]
export const PAGE_SIZE = 15

export interface AccessRow {
  line: number
  email: string
  roles: Role[]
  error?: string
}

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/

/**
 * Parses "email, role1, role2" lines. Roles may also be wrapped as
 * `email, [role1,role2]` or `email, "role1,role2"`. Blank lines are ignored.
 */
export function parseAccessCsv(text: string): AccessRow[] {
  const rows: AccessRow[] = []
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim()
    if (!line) return
    // The email is the first field and is never rewritten; only the role
    // fields have quotes and brackets unwrapped.
    const [first = '', ...rest] = line.split(/[,;]/)
    const email = first.trim().toLowerCase()
    const parts = rest
      .join(',')
      .replace(/[[\]"']/g, '')
      .split(/[,;]/)
      .map((part) => part.trim())
      .filter(Boolean)
    const roles: Role[] = []
    const unknown: string[] = []
    for (const token of parts.flatMap((part) => part.split(/\s+/))) {
      const role = ROLES.find((r) => r.toLowerCase() === token.toLowerCase())
      if (!role) unknown.push(token)
      else if (!roles.includes(role)) roles.push(role)
    }
    let error: string | undefined
    if (!EMAIL.test(email)) error = 'Invalid email address'
    else if (unknown.length) error = `Unknown role: ${unknown.join(', ')}`
    else if (!roles.length) error = 'Add at least one role'
    else if (
      roles.includes('admin') &&
      (roles.includes('judge') || roles.includes('judgeAdvisor'))
    )
      error = 'Admin and judging roles cannot be combined'
    rows.push({ line: index + 1, email, roles, error })
  })
  return rows
}

export function filterUsers(
  users: User[],
  filters: { name: string; email: string; role: Role | '' },
): User[] {
  const name = filters.name.trim().toLowerCase()
  const email = filters.email.trim().toLowerCase()
  return users.filter(
    (u) =>
      (!name || (u.name ?? '').toLowerCase().includes(name)) &&
      (!email || u.email.toLowerCase().includes(email)) &&
      (!filters.role || u.roles.includes(filters.role)),
  )
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, page), pages)
  return {
    pages,
    page: current,
    items: items.slice((current - 1) * size, current * size),
  }
}
