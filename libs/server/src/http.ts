import express, { type NextFunction, type Request, type Response, type Router } from 'express';
import cors from 'cors';
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { z, ZodError } from 'zod';
import * as c from '@fgc/contracts';
import { commands, reads } from './routes';
import { DomainError } from './errors';
import { readImport } from './imports';

export interface RpcClient { rpc(name: string, args?: Record<string, unknown>): Promise<unknown> }
export interface Gateway { staff(token: string): RpcClient; service: RpcClient; verify(token: string): Promise<{ id: string }>; ready(): Promise<boolean> }
export interface ApiConfig { gateway: Gateway; allowedOrigins: string[]; mentorSecret: string; development: boolean; authRouter?: Router; importsRouter?: Router; workerRouter?: Router }
interface Staff { rpc: RpcClient; user: c.User }
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function deriveKey(key: string, suffix: string): string { const digest = hash(`${key}:${suffix}`); return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-8${digest.slice(17, 20)}-${digest.slice(20, 32)}`; }
const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { void fn(req, res).catch(next); };
export function createApi(config: ApiConfig) {
  const app = express(); app.disable('x-powered-by');
  app.use((_, res, next) => { res.locals.requestId = randomUUID(); res.set('Cache-Control', 'no-store'); next(); });
  app.use(cors({ origin: (origin, done) => done(null, !origin || config.allowedOrigins.includes(origin)), credentials: true }));
  app.use('/api/v1/imports/preview', express.json({ limit: '8mb' })); app.use(express.json({ limit: '256kb' }));
  const send = (res: Response, data: unknown, nextCursor?: string) => res.json({ data, meta: { requestId: res.locals.requestId, ...(nextCursor ? { nextCursor } : {}) } });
  const cookieName = config.development ? 'fgc_mentor' : '__Host-fgc_mentor';
  const cookies = (req: Request) => Object.fromEntries((req.headers.cookie ?? '').split(';').filter(v => v.includes('=')).map(v => { const i = v.indexOf('='); return [v.slice(0, i).trim(), v.slice(i + 1)]; }));
  const sign = (value: string) => createHmac('sha256', config.mentorSecret).update(value).digest('hex');
  async function staff(req: Request, capability: keyof ReturnType<typeof c.capabilities>): Promise<Staff> {
    const authorization = req.get('Authorization');
    if (!authorization?.startsWith('Bearer ') || cookies(req)[cookieName]) throw new DomainError('UNAUTHENTICATED');
    const token = authorization.slice(7); await config.gateway.verify(token);
    const rpc = config.gateway.staff(token); const user = await rpc.rpc('me') as c.User | null;
    if (!user) throw new DomainError('UNAUTHENTICATED');
    if (!c.capabilities(user.roles)[capability]) throw new DomainError('FORBIDDEN');
    return { rpc, user };
  }
  function mentor(req: Request, mutate = false): string {
    const authorization = req.get('Authorization'); const cookie = cookies(req)[cookieName];
    if (authorization && cookie) throw new DomainError('UNAUTHENTICATED');
    if (authorization && !authorization.startsWith('Mentor ')) throw new DomainError('UNAUTHENTICATED');
    const token = authorization?.slice(7) ?? cookie;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new DomainError('UNAUTHENTICATED');
    if (cookie && mutate) {
      const csrf = req.get('X-CSRF-Token') ?? ''; const expected = sign(token);
      if (!config.allowedOrigins.includes(req.get('Origin') ?? '') || Buffer.byteLength(csrf) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(csrf), Buffer.from(expected))) throw new DomainError('FORBIDDEN');
    }
    return token;
  }
  function pagination(req: Request) {
    const query = c.listQuery.parse(req.query); let after: string | null = null;
    if (query.cursor) { try { after = c.uuid.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')); } catch { throw new DomainError('VALIDATION_ERROR'); } }
    return { query, args: { p_limit: query.limit, p_after: after } };
  }
  function nextCursor(rows: unknown, limit: number): string | undefined {
    if (!Array.isArray(rows) || rows.length < limit) return undefined;
    const last = rows[rows.length - 1] as { id: string };
    return Buffer.from(last.id).toString('base64url');
  }
  app.get('/health/live', (_, res) => res.json({ status: 'live' }));
  app.get('/health/ready', wrap(async (_, res) => { const ready = await config.gateway.ready(); res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'unavailable' }); }));
  if (config.authRouter) app.use('/api/v1/auth', config.authRouter);
  if (config.importsRouter) app.use('/api/v1/imports', config.importsRouter);
  if (config.workerRouter) app.use('/internal', config.workerRouter);
  app.post('/api/v1/imports/preview', wrap(async (req, res) => {
    const { rpc } = await staff(req, 'admin'); const input = c.importPreviewInput.parse(req.body);
    const preview = await readImport(input); const key = c.uuid.parse(req.get('Idempotency-Key'));
    const receipt = await rpc.rpc('import_preview', { p_input: preview, p_key: key }) as c.Receipt;
    return send(res, { ...await rpc.rpc('import_read', { p_id: receipt.entityId }) as c.ImportPreview, columns: preview.columns, sheets: preview.sheets });
  }));
  app.get('/api/v1/imports/:id', wrap(async (req, res) => { const { rpc } = await staff(req, 'admin'); return send(res, await rpc.rpc('import_read', { p_id: c.uuid.parse(req.params.id) })); }));
  app.post('/api/v1/imports/:id/commit', wrap(async (req, res) => {
    const { rpc } = await staff(req, 'admin'); const id = c.uuid.parse(req.params.id); const input = c.versionInput.parse(req.body); const key = c.uuid.parse(req.get('Idempotency-Key'));
    const preview = await rpc.rpc('import_read', { p_id: id }) as c.ImportPreview;
    const errors: { row: number; message: string }[] = [];
    for (const row of preview.rows.filter(r => r.status === 'ready')) {
      try { await rpc.rpc('import_row_commit', { p_input: { previewId: id, row: row.row, expectedVersion: input.expectedVersion }, p_key: deriveKey(key, String(row.row)) }); }
      catch (error) { if (error instanceof DomainError && error.code === 'DUPLICATE') continue; errors.push({ row: row.row, message: error instanceof DomainError ? error.message : 'This record could not be imported.' }); }
    }
    return send(res, { ...await rpc.rpc('import_read', { p_id: id }) as c.ImportPreview, errors });
  }));
  app.post('/api/v1/admin/access', wrap(async (req, res) => {
    const { rpc } = await staff(req, 'admin'); const input = c.accessInput.parse(req.body); const key = c.uuid.parse(req.get('Idempotency-Key'));
    const results = [];
    for (const email of input.emails) {
      try { results.push({ email, receipt: await rpc.rpc('access_grant', { p_input: { email, roles: input.roles, mode: input.mode, expectedVersion: input.expectedVersion ?? 0 }, p_key: deriveKey(key, email) }) }); }
      catch (error) { results.push({ email, error: error instanceof DomainError ? error.code : 'DEPENDENCY_UNAVAILABLE' }); }
    }
    return send(res, results);
  }));
  for (const route of reads) app.get(`/api/v1${route.path}`, wrap(async (req, res) => {
    const { rpc } = await staff(req, route.capability); const { query, args } = pagination(req);
    const params: Record<string, unknown> = route.paginated ? args : {};
    if (route.rpc === 'teams_list') params.p_search = query.search ?? '';
    if (route.rpc === 'pages_list') { params.p_source_area = query.sourceArea ?? null; if (query.sourceArea === 'judges') await staff(req, 'judging'); }
    if (route.rpc === 'observations_list') params.p_team = c.uuid.parse(req.params.id);
    const data = await rpc.rpc(route.rpc, params);
    return send(res, data, route.paginated ? nextCursor(route.rpc === 'tracker' ? (data as c.Tracker).teams : data, query.limit) : undefined);
  }));
  for (const route of commands) app[route.method](`/api/v1${route.path}`, wrap(async (req, res) => {
    const { rpc } = await staff(req, route.capability); const input = route.schema.parse(req.body) as Record<string, unknown>;
    const key = c.uuid.parse(req.get('Idempotency-Key'));
    for (const [param, field] of Object.entries(route.params ?? {})) input[field] = param === 'type' ? c.flagType.parse(req.params[param]) : c.uuid.parse(req.params[param]);
    if (route.rpc === 'flag_put' && input.type === 'other' && !input.reason) throw new DomainError('VALIDATION_ERROR');
    if (route.rpc === 'page_create') { await staff(req, input.sourceArea === 'judges' ? 'judging' : 'filming'); }
    return send(res, await rpc.rpc(route.rpc, { p_input: input, p_key: key }));
  }));
  app.post('/api/v1/admin/mentor-codes', wrap(async (req, res) => {
    const { rpc } = await staff(req, 'admin'); const input = c.mentorCodeInput.parse(req.body); const key = c.uuid.parse(req.get('Idempotency-Key'));
    const code = randomBytes(6).toString('hex').toUpperCase();
    const receipt = await rpc.rpc('mentor_code_issue', { p_input: { ...input, digest: sign(code) }, p_key: key });
    return send(res, { receipt, code });
  }));
  app.post('/api/v1/mentor/redeem', wrap(async (req, res) => {
    if (req.get('Authorization') || cookies(req)[cookieName]) throw new DomainError('STATE_CONFLICT');
    const input = c.redeemInput.parse(req.body); const digest = sign(input.code.replace(/[\s-]/g, '').toUpperCase());
    if (input.platform === 'web' && !config.allowedOrigins.includes(req.get('Origin') ?? '')) throw new DomainError('FORBIDDEN');
    const allowed = await config.gateway.service.rpc('mentor_rate_limit', { p_ip_hash: sign(req.ip ?? 'unknown'), p_installation_id: input.installationId, p_digest: digest });
    if (allowed !== true) throw new DomainError('RATE_LIMITED');
    const token = randomBytes(32).toString('hex');
    await config.gateway.service.rpc('mentor_redeem', { p_digest: digest, p_token_hash: hash(token) });
    const data = await config.gateway.service.rpc('mentor_me', { p_token_hash: hash(token) }) as c.Mentor;
    if (input.platform === 'web') res.cookie(cookieName, token, { httpOnly: true, secure: !config.development, sameSite: 'lax', path: '/', maxAge: 7 * 86400000 });
    return send(res, { ...data, ...(input.platform === 'mobile' ? { sessionToken: token } : {}) });
  }));
  app.get('/api/v1/mentor/csrf', wrap(async (req, res) => {
    let origin = req.get('Origin');
    if (!origin && req.get('Sec-Fetch-Site') === 'same-origin') { try { origin = new URL(req.get('Referer') ?? '').origin; } catch { /* Unproven origin is rejected. */ } }
    if (!origin || !config.allowedOrigins.includes(origin)) throw new DomainError('FORBIDDEN'); return send(res, { csrfToken: sign(mentor(req)) }); }));
  for (const resource of ['me', 'filming', 'pages']) app.get(`/api/v1/mentor/${resource}`, wrap(async (req, res) => {
    const token = mentor(req); const { query, args } = pagination(req);
    const data = await config.gateway.service.rpc(`mentor_${resource}`, { p_token_hash: hash(token), ...(resource === 'pages' ? { ...args, p_installation_id: c.uuid.parse(req.get('X-Installation-Id')) } : {}) });
    return send(res, data, resource === 'pages' ? nextCursor(data, query.limit) : undefined);
  }));
  app.post('/api/v1/mentor/pages/:id/respond', wrap(async (req, res) => send(res, await config.gateway.service.rpc('mentor_respond', { p_token_hash: hash(mentor(req, true)), p_input: { ...c.responseInput.parse(req.body), pageId: c.uuid.parse(req.params.id) }, p_key: c.uuid.parse(req.get('Idempotency-Key')) }))));
  app.put('/api/v1/mentor/device', wrap(async (req, res) => send(res, await config.gateway.service.rpc('mentor_device_put', { p_token_hash: hash(mentor(req, true)), p_input: c.deviceInput.parse(req.body) }))));
  app.delete('/api/v1/mentor/device', wrap(async (req, res) => send(res, await config.gateway.service.rpc('mentor_device_delete', { p_token_hash: hash(mentor(req, true)), p_installation_id: c.uuid.parse(req.body.installationId) }))));
  app.post('/api/v1/mentor/logout', wrap(async (req, res) => { await config.gateway.service.rpc('mentor_logout', { p_token_hash: hash(mentor(req, true)) }); res.clearCookie(cookieName, { httpOnly: true, secure: !config.development, sameSite: 'lax', path: '/' }); return send(res, { signedOut: true }); }));
  app.use((_, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' }, requestId: res.locals.requestId }));
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const typed = error instanceof DomainError ? error : error instanceof ZodError || error instanceof SyntaxError ? new DomainError('VALIDATION_ERROR') : (error as { type?: string })?.type === 'entity.too.large' ? new DomainError('PAYLOAD_TOO_LARGE') : new DomainError('DEPENDENCY_UNAVAILABLE');
    res.status(c.errorStatus[typed.code]).json({ error: { code: typed.code, message: typed.message, ...(error instanceof ZodError ? { fieldErrors: error.flatten().fieldErrors } : {}) }, requestId: res.locals.requestId });
  });
  return app;
}

