import { GraphQLScalarType, Kind } from 'graphql'
import {
  listAnnouncements,
  listEventSchedule,
  listInterviews,
  listJudges,
  listTeams,
} from '@fgc/database'
import { loginInputSchema } from '@fgc/shared'
import { findUserForLogin, signToken } from '../context'
import type { Context } from '../context'

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize(value: unknown) {
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'string') return value
    return null
  },
  parseValue(value: unknown) {
    if (typeof value === 'string' || typeof value === 'number') return new Date(value)
    return null
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value)
    return null
  },
})

/** Demo progress keyed by judge name (matches seed). */
const JUDGE_PROGRESS: Record<
  string,
  { completed: number; total: number; status: string }
> = {
  'Dr. Sarah Chen': { completed: 3, total: 4, status: 'good' },
  'Marcus Williams': { completed: 2, total: 4, status: 'warning' },
  'Ana Rodrigues': { completed: 4, total: 4, status: 'good' },
  'James Okafor': { completed: 1, total: 4, status: 'critical' },
  'Yuki Tanaka': { completed: 3, total: 3, status: 'good' },
}

export const resolvers = {
  DateTime: DateTimeScalar,
  Query: {
    healthCheck: () => 'ok',
    teams: async () => {
      const rows = await listTeams()
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        panel: r.panel,
        status: r.status,
        score: r.score,
        notebookStatus: r.notebookStatus,
        divergence: r.divergence,
        flag: r.flag,
      }))
    },
    interviews: async () => {
      const rows = await listInterviews()
      return rows.map(r => ({
        id: r.id,
        teamId: r.teamId,
        teamName: r.teamName,
        scheduleTime: r.scheduleTime,
        room: r.room,
        status: r.status,
        minutesUntil: r.minutesUntil,
      }))
    },
    announcements: async () => {
      const rows = await listAnnouncements()
      return rows.map(r => ({
        id: r.id,
        type: r.type,
        text: r.text,
        timeDisplay: r.timeDisplay,
        createdAt: r.createdAt,
      }))
    },
    eventSchedule: async () => {
      const rows = await listEventSchedule()
      return rows.map(r => ({
        id: r.id,
        timeDisplay: r.timeDisplay,
        eventName: r.eventName,
        status: r.status,
        sortOrder: r.sortOrder,
      }))
    },
    judges: async () => {
      const rows = await listJudges()
      return rows.map(r => {
        const p = JUDGE_PROGRESS[r.name] ?? {
          completed: 0,
          total: 4,
          status: 'good',
        }
        return {
          id: r.id,
          name: r.name,
          panel: r.panel,
          completed: p.completed,
          total: p.total,
          status: p.status,
        }
      })
    },
    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) return null
      const u = await findUserForLogin(ctx.user.email)
      if (!u) return null
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        panel: u.panel,
      }
    },
  },
  Mutation: {
    login: async (_: unknown, args: { input: { email: string; password?: string } }) => {
      const input = loginInputSchema.parse(args.input)
      const user = await findUserForLogin(input.email)
      if (!user) {
        throw new Error('Invalid credentials')
      }
      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
      })
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      return {
        token,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          panel: user.panel,
        },
      }
    },
  },
}
