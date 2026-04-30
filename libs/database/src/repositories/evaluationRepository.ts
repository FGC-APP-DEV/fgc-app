import { and, eq } from 'drizzle-orm'
import { db } from '../client'
import { evaluations } from '../schema'

export async function listEvaluationsForTeam(teamId: string) {
  return db.select().from(evaluations).where(eq(evaluations.teamId, teamId))
}

export async function upsertEvaluation(input: {
  teamId: string
  judgeId: string
  status: string
  scores?: Record<string, number>
  notes?: string | null
}) {
  const existing = await db
    .select()
    .from(evaluations)
    .where(
      and(
        eq(evaluations.teamId, input.teamId),
        eq(evaluations.judgeId, input.judgeId),
      ),
    )
    .limit(1)

  if (existing[0]) {
    const [row] = await db
      .update(evaluations)
      .set({
        status: input.status,
        scores: input.scores ?? existing[0].scores,
        notes: input.notes ?? existing[0].notes,
        updatedAt: new Date(),
      })
      .where(eq(evaluations.id, existing[0].id))
      .returning()
    return row
  }

  const [row] = await db
    .insert(evaluations)
    .values({
      teamId: input.teamId,
      judgeId: input.judgeId,
      status: input.status,
      scores: input.scores ?? null,
      notes: input.notes ?? null,
    })
    .returning()
  return row
}
