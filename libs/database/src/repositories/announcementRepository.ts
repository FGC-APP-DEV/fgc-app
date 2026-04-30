import { desc } from 'drizzle-orm'
import { db } from '../client'
import { announcements } from '../schema'

export async function listAnnouncements() {
  return db.select().from(announcements).orderBy(desc(announcements.createdAt))
}
