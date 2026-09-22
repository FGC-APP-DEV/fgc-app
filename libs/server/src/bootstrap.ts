import { createDatabaseGateway, DatabaseFailure } from '@fgc/database';
import type { User } from '@fgc/contracts';
import { createApi, type RpcClient, type Gateway } from './http';
import { fromRpc, DomainError } from './errors';
import { createWorkerRouter } from './worker';
import { createAuthRouter, createSupabaseAuthProvider, createSupabaseAuthStore } from './auth';

export function configuredApi(env: NodeJS.ProcessEnv) {
  const required = (key: string) => { const value = env[key]; if (!value) throw new Error(`Missing server configuration: ${key}`); return value; };
  const development = env.NODE_ENV === 'development';
  const url = required('SUPABASE_URL'); const publicKey = required('SUPABASE_ANON_KEY'); const serviceKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const origins = required('WEB_ORIGINS').split(',').map(v => v.trim());
  if (!development && origins.some(o => !o.startsWith('https://'))) throw new Error('HTTPS origins are required outside development.');
  const raw = createDatabaseGateway({ url, publicKey, serviceKey });
  const wrap = (client: RpcClient): RpcClient => ({ async rpc(name, args) { try { return await client.rpc(name, args); } catch (error) { if (error instanceof DatabaseFailure) throw fromRpc({ code: error.code, message: error.detail }); throw new DomainError('DEPENDENCY_UNAVAILABLE'); } } });
  const gateway: Gateway = { staff: token => wrap(raw.staff(token)), service: wrap(raw.service), ready: () => raw.ready(), verify: async token => { try { return await raw.verify(token); } catch { throw new DomainError('UNAUTHENTICATED'); } } };
  const key = (name: string) => { const value = Buffer.from(required(name), 'base64'); if (value.length !== 32) throw new Error(`${name} must encode exactly 32 bytes.`); return value; };
  const provider = createSupabaseAuthProvider(url, publicKey, serviceKey);
  const authRouter = createAuthRouter({
    environment: development ? 'development' : 'production', allowedOrigins: origins,
    callbackUrls: { web: required('AUTH_WEB_CALLBACK_URL'), mobile: required('AUTH_MOBILE_CALLBACK_URL') },
    exchangeUrls: { web: required('AUTH_WEB_EXCHANGE_URL'), mobile: required('AUTH_MOBILE_EXCHANGE_URL') },
    encryptionKey: key('AUTH_ENCRYPTION_KEY'), csrfKey: key('AUTH_CSRF_KEY'), rateLimitKey: key('AUTH_RATE_LIMIT_KEY'),
    store: createSupabaseAuthStore(url, serviceKey), provider,
    resolveUser: async token => {
      // Auth is verified before privileged identity provisioning. Roles come only
      // from preapproval stored by an administrator, never user metadata.
      const identity = await gateway.verify(token);
      const { createClient } = await import('@supabase/supabase-js');
      const result = await createClient(url, publicKey, { auth: { persistSession: false } }).auth.getUser(token);
      if (!result.data.user?.email || result.data.user.id !== identity.id) throw new DomainError('UNAUTHENTICATED');
      await gateway.service.rpc('staff_provision', { p_auth_user_id: identity.id, p_email: result.data.user.email });
      return await gateway.staff(token).rpc('me') as User;
    },
  });
  return createApi({ gateway, allowedOrigins: origins, mentorSecret: required('MENTOR_HMAC_SECRET'), development, authRouter, workerRouter: createWorkerRouter(gateway.service, required('WORKER_SECRET')) });
}
