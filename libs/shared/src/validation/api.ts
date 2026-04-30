import { z } from 'zod'

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
})

export const updateEvaluationInputSchema = z.object({
  teamId: z.string().min(1),
  judgeId: z.string().uuid(),
  status: z.string().min(1),
  scores: z.record(z.string(), z.number()).optional(),
  notes: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginInputSchema>
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationInputSchema>
