import { eq } from 'drizzle-orm'
import { db } from '../client'
import { teams } from '../schema'

export async function listTeams() {
  return db.select().from(teams).orderBy(teams.id)
}

export async function getTeamById(id: string) {
  const rows = await db.select().from(teams).where(eq(teams.id, id)).limit(1)
  return rows[0] ?? null
}
