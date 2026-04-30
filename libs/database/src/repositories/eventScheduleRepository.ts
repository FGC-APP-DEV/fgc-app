import { asc } from 'drizzle-orm'
import { db } from '../client'
import { eventSchedule } from '../schema'

export async function listEventSchedule() {
  return db.select().from(eventSchedule).orderBy(asc(eventSchedule.sortOrder))
}
