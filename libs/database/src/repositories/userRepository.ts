import { eq, inArray } from 'drizzle-orm'
import { db } from '../client'
import { users } from '../schema'

export async function listUsersByRole(
  roles: Array<'judge' | 'judgeAdvisor' | 'mentor' | 'public'>,
) {
  return db.select().from(users).where(inArray(users.role, roles))
}

export async function listJudges() {
  return db.select().from(users).where(eq(users.role, 'judge'))
}

export async function getUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return rows[0] ?? null
}
