import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const appRoleEnum = pgEnum('app_role', [
  'judge',
  'judgeAdvisor',
  'mentor',
  'public',
])

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }),
    role: appRoleEnum('role').notNull().default('public'),
    panel: varchar('panel', { length: 8 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
  }),
)

export const teams = pgTable(
  'teams',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    panel: varchar('panel', { length: 8 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    score: integer('score'),
    notebookStatus: varchar('notebook_status', { length: 32 })
      .notNull()
      .default('notSubmitted'),
    divergence: boolean('divergence').notNull().default(false),
    flag: boolean('flag').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    panelIdx: index('teams_panel_idx').on(table.panel),
  }),
)

export const evaluations = pgTable(
  'evaluations',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    teamId: varchar('team_id', { length: 32 })
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    judgeId: uuid('judge_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    scores: jsonb('scores').$type<Record<string, number>>(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    teamJudgeIdx: index('evaluations_team_judge_idx').on(
      table.teamId,
      table.judgeId,
    ),
  }),
)

export const interviews = pgTable(
  'interviews',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    teamId: varchar('team_id', { length: 32 })
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    teamName: varchar('team_name', { length: 255 }).notNull(),
    scheduleTime: varchar('schedule_time', { length: 16 }).notNull(),
    room: varchar('room', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull(),
    minutesUntil: integer('minutes_until'),
    judgeId: uuid('judge_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    teamIdx: index('interviews_team_idx').on(table.teamId),
  }),
)

export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    type: varchar('type', { length: 32 }).notNull(),
    text: text('text').notNull(),
    timeDisplay: varchar('time_display', { length: 16 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    createdIdx: index('announcements_created_idx').on(table.createdAt),
  }),
)

export const eventSchedule = pgTable(
  'event_schedule',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sortOrder: integer('sort_order').notNull(),
    timeDisplay: varchar('time_display', { length: 16 }).notNull(),
    eventName: varchar('event_name', { length: 512 }).notNull(),
    status: varchar('status', { length: 32 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    sortIdx: index('event_schedule_sort_idx').on(table.sortOrder),
  }),
)
