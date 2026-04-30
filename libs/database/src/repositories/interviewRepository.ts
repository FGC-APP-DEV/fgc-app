import { asc } from 'drizzle-orm'
import { db } from '../client'
import { interviews } from '../schema'

export async function listInterviews() {
  return db.select().from(interviews).orderBy(asc(interviews.scheduleTime))
}
