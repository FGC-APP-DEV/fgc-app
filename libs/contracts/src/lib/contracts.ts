import { z } from 'zod';

export const uuid = z.string().uuid();
export const version = z.number().int().nonnegative();
export const roleSchema = z.enum(['admin', 'judge', 'judgeAdvisor', 'filmmaker']);
export type Role = z.infer<typeof roleSchema>;
export const platformSchema = z.enum(['web', 'mobile']);
export const versionInput = z.object({ expectedVersion: version }).strict();
export const profileInput = versionInput.extend({ name: z.string().trim().min(1).max(120) });
export const panelInput = z.object({ name: z.string().trim().min(1).max(80), leaderId: uuid, judgeIds: z.array(uuid).min(1).max(100) }).strict().refine(v => v.judgeIds.includes(v.leaderId) && new Set(v.judgeIds).size === v.judgeIds.length, 'Leader must belong to unique panel members');
export const leaderInput = versionInput.extend({ leaderId: uuid });
export const membersInput = versionInput.extend({ judgeIds: z.array(uuid).max(100) });
export const assignTeamInput = versionInput.extend({ teamId: uuid });
export const transferInput = versionInput.extend({ sourcePanelId: uuid, targetPanelId: uuid, sourceVersion: version, targetVersion: version });
export const participationInput = z.object({ teamId: uuid }).strict();
export const observationInput = versionInput.extend({ panelId: uuid, text: z.string().trim().min(1).max(10000) });
export const observationDeleteInput = versionInput.extend({ panelId: uuid });
export const completeInput = versionInput.extend({ confirmed: z.literal(true) });
export const reasonInput = versionInput.extend({ reason: z.string().trim().min(1).max(500) });
export const flagType = z.enum(['absent', 'online', 'other']);
export const flagInput = versionInput.extend({ reason: z.string().trim().max(500).default('') });
export const categoryInput = z.object({ name: z.string().trim().min(1).max(80) }).strict();
export const itemInput = z.object({ categoryId: uuid, title: z.string().trim().min(1).max(200) }).strict();
export const toggleItemInput = versionInput.extend({ done: z.boolean() });
export const shotInput = versionInput.extend({ status: z.enum(['captured', 'skipped']), notes: z.string().trim().max(500).default('') });
export const pageSource = z.enum(['filming', 'judges']);
export type PageSource = z.infer<typeof pageSource>;
export const pageInput = z.object({ teamId: uuid, sourceArea: pageSource, message: z.string().trim().min(1).max(500), scheduledFor: z.string().datetime().optional() }).strict();
export const mentorResponses = ['On our way', 'ETA ~10 min', "Can't come now"] as const;
export const responseInput = versionInput.extend({ response: z.enum(mentorResponses) });
export const accessInput = z.object({ emails: z.array(z.string().trim().email().transform(v => v.toLowerCase())).min(1).max(100), roles: z.array(roleSchema).max(4), mode: z.enum(['add', 'replace']), expectedVersion: version.optional() }).strict().refine(v => !(v.roles.includes('admin') && (v.roles.includes('judge') || v.roles.includes('judgeAdvisor'))), 'Administrative and judging access cannot be combined');
export const mentorCodeInput = versionInput.extend({ teamId: uuid });
export const redeemInput = z.object({ code: z.string().trim().min(4).max(64), platform: platformSchema, installationId: uuid }).strict();
export const deviceInput = z.object({ installationId: uuid, token: z.string().max(200).regex(/^(ExponentPushToken|ExpoPushToken)\[[\w-]+\]$/), platform: z.enum(['ios', 'android']), permission: z.enum(['granted', 'denied']) }).strict();
export const emailInput = z.object({ email: z.string().trim().email().transform(v => v.toLowerCase()), platform: platformSchema, codeChallenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict();
export const verifyInput = z.object({ attemptId: uuid, emailCode: z.string().regex(/^\d{6,10}$/), codeVerifier: z.string().min(43).max(128) }).strict();
export const confirmLinkInput = z.object({ attemptId: uuid, tokenHash: z.string().min(20).max(300) }).strict();
export const exchangeInput = z.object({ ticket: z.string().min(32).max(128), codeVerifier: z.string().min(43).max(128) }).strict();
export const refreshInput = z.object({ platform: platformSchema, refreshToken: z.string().min(1).max(4096).optional() }).strict();
export const closeInput = versionInput.extend({ token: z.string().min(20).max(200) });
export const closureIntentInput = versionInput.extend({ confirmed: z.literal(true) });
export const importMapping = z.object({ officialId: z.string().min(1), name: z.string().min(1), country: z.string().min(1) }).strict();
export const importPreviewInput = z.object({ fileName: z.string().min(1).max(200), content: z.string().max(7 * 1024 * 1024), encoding: z.enum(['utf8', 'base64']).default('utf8'), delimiter: z.enum([',', ';', '\t']).default(','), sheet: z.string().max(100).optional(), mapping: importMapping, countries: z.record(z.string().regex(/^[A-Z]{2}$/)).default({}) }).strict();
export const listQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), cursor: z.string().max(300).optional(), search: z.string().trim().max(120).optional(), sourceArea: pageSource.optional() }).strict();

export const errorStatus = { VALIDATION_ERROR: 400, UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, VERSION_CONFLICT: 409, STATE_CONFLICT: 409, DUPLICATE: 409, IDEMPOTENCY_EXPIRED: 409, SECRET_ALREADY_ISSUED: 409, PAYLOAD_TOO_LARGE: 413, RATE_LIMITED: 429, DEPENDENCY_UNAVAILABLE: 503 } as const;
export type ErrorCode = keyof typeof errorStatus;
export interface Envelope<T> { data: T; meta: { requestId: string; nextCursor?: string } }
export interface ErrorEnvelope { error: { code: ErrorCode; message: string; fieldErrors?: Record<string, string[]> }; requestId: string }
export interface Receipt { commandId: string; entityId: string; resultingVersion: number; outcome: 'created' | 'updated' | 'deleted' | 'noop'; committedAt: string }
export interface User { id: string; email: string; name: string | null; roles: Role[]; version: number }
export interface Team { id: string; officialId: string; name: string; country: string; countryCode: string; version: number; pitX?: number | null; pitY?: number | null }
export interface Panel { id: string; name: string; leaderId: string; judgeIds: string[]; version: number }
export interface Participation { id: string; teamId: string; panelId: string | null; evaluationStatus: 'pending' | 'evaluated'; participationStatus: 'active' | 'withdrawn'; hasHistory: boolean; version: number; flags: { type: 'absent' | 'online' | 'other'; reason: string; version: number }[]; withdrawalReason?: string; team: Team }
export interface Observation { id: string; authorId: string; authorName: string; panelId: string; teamId: string; text: string; version: number; updatedAt: string }
export interface Shot { id: string; templateId: string; teamId: string; status: 'pending' | 'captured' | 'skipped'; notes: string | null; capturedAt: string | null; capturedBy: string | null; version: number }
export interface TrackerTeam extends Team { shots: Shot[] }
export interface Tracker { teams: TrackerTeam[]; templates: { id: string; name: string }[] }
export interface Category { id: string; name: string; version: number }
export interface ShotItem { id: string; categoryId: string; title: string; doneAt: string | null; doneBy: string | null; version: number }
export interface Page { id: string; teamId: string; sourceArea: PageSource; message: string; scheduledFor: string | null; createdAt: string; response: typeof mentorResponses[number] | null; respondedAt: string | null; deliveryStatus?: string; deliveryId?: string; version: number }
export interface Mentor { team: Team; event: { id: string; name: string }; expiresAt: string; sessionToken?: string }
export interface SessionResult { accessToken: string; refreshToken?: string; expiresAt: string; user: User }
export interface ImportRow { row: number; officialId: string; name: string; country: string; status: 'ready' | 'invalid' | 'duplicate' | 'conflict' | 'existing' | 'imported'; errors: string[] }
export interface ImportPreview { id: string; version: number; expiresAt: string; rows: ImportRow[]; columns: string[]; sheets?: string[] }

export function capabilities(roles: readonly Role[]) {
  const admin = roles.includes('admin');
  const judging = !admin && (roles.includes('judge') || roles.includes('judgeAdvisor'));
  return { admin, judging, advisor: judging && roles.includes('judgeAdvisor'), filming: admin || roles.includes('filmmaker'), schedule: roles.length > 0 };
}

export const pagerPresets: Record<PageSource, readonly string[]> = {
  filming: ['Please come to the filming booth for a quick shoot.', "We'd like to interview your team — please come to the production area.", 'Time for your Step & Repeat photo — please come to the backdrop.', 'Robot reveal shoot in ~5 min — please bring your robot to the filming area.'],
  judges: ['Please come to the judging area.', "We're ready for your interview — please come to the judging room.", 'Technical inspection required — please come to the judging area.', 'Please return to your pit immediately.'],
};
