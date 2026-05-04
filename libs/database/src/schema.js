"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventSchedule = exports.announcements = exports.interviews = exports.evaluations = exports.teams = exports.users = exports.appRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.appRoleEnum = (0, pg_core_1.pgEnum)('app_role', [
    'judge',
    'judgeAdvisor',
    'mentor',
    'public',
]);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id')
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }),
    role: (0, exports.appRoleEnum)('role').notNull().default('public'),
    panel: (0, pg_core_1.varchar)('panel', { length: 8 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, table => ({
    emailIdx: (0, pg_core_1.uniqueIndex)('users_email_idx').on(table.email),
    roleIdx: (0, pg_core_1.index)('users_role_idx').on(table.role),
}));
exports.teams = (0, pg_core_1.pgTable)('teams', {
    id: (0, pg_core_1.varchar)('id', { length: 32 }).primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    panel: (0, pg_core_1.varchar)('panel', { length: 8 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 32 }).notNull().default('pending'),
    score: (0, pg_core_1.integer)('score'),
    notebookStatus: (0, pg_core_1.varchar)('notebook_status', { length: 32 })
        .notNull()
        .default('notSubmitted'),
    divergence: (0, pg_core_1.boolean)('divergence').notNull().default(false),
    flag: (0, pg_core_1.boolean)('flag').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, table => ({
    panelIdx: (0, pg_core_1.index)('teams_panel_idx').on(table.panel),
}));
exports.evaluations = (0, pg_core_1.pgTable)('evaluations', {
    id: (0, pg_core_1.uuid)('id')
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    teamId: (0, pg_core_1.varchar)('team_id', { length: 32 })
        .notNull()
        .references(() => exports.teams.id, { onDelete: 'cascade' }),
    judgeId: (0, pg_core_1.uuid)('judge_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    status: (0, pg_core_1.varchar)('status', { length: 32 }).notNull().default('pending'),
    scores: (0, pg_core_1.jsonb)('scores').$type(),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, table => ({
    teamJudgeIdx: (0, pg_core_1.index)('evaluations_team_judge_idx').on(table.teamId, table.judgeId),
}));
exports.interviews = (0, pg_core_1.pgTable)('interviews', {
    id: (0, pg_core_1.uuid)('id')
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    teamId: (0, pg_core_1.varchar)('team_id', { length: 32 })
        .notNull()
        .references(() => exports.teams.id, { onDelete: 'cascade' }),
    teamName: (0, pg_core_1.varchar)('team_name', { length: 255 }).notNull(),
    scheduleTime: (0, pg_core_1.varchar)('schedule_time', { length: 16 }).notNull(),
    room: (0, pg_core_1.varchar)('room', { length: 64 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 32 }).notNull(),
    minutesUntil: (0, pg_core_1.integer)('minutes_until'),
    judgeId: (0, pg_core_1.uuid)('judge_id').references(() => exports.users.id, {
        onDelete: 'set null',
    }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, table => ({
    teamIdx: (0, pg_core_1.index)('interviews_team_idx').on(table.teamId),
}));
exports.announcements = (0, pg_core_1.pgTable)('announcements', {
    id: (0, pg_core_1.uuid)('id')
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    type: (0, pg_core_1.varchar)('type', { length: 32 }).notNull(),
    text: (0, pg_core_1.text)('text').notNull(),
    timeDisplay: (0, pg_core_1.varchar)('time_display', { length: 16 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, table => ({
    createdIdx: (0, pg_core_1.index)('announcements_created_idx').on(table.createdAt),
}));
exports.eventSchedule = (0, pg_core_1.pgTable)('event_schedule', {
    id: (0, pg_core_1.uuid)('id')
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull(),
    timeDisplay: (0, pg_core_1.varchar)('time_display', { length: 16 }).notNull(),
    eventName: (0, pg_core_1.varchar)('event_name', { length: 512 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 32 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, table => ({
    sortIdx: (0, pg_core_1.index)('event_schedule_sort_idx').on(table.sortOrder),
}));
//# sourceMappingURL=schema.js.map