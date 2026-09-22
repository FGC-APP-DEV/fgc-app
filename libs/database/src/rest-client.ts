import { createClient } from '@supabase/supabase-js';

export class DatabaseFailure extends Error {
  constructor(public readonly code: string, public readonly detail: string) { super(detail); }
}
export interface DatabaseConfig { url: string; publicKey: string; serviceKey: string }
const serviceOperations = new Set(['mentor_rate_limit', 'mentor_redeem', 'mentor_me', 'mentor_filming', 'mentor_pages', 'mentor_respond', 'mentor_device_put', 'mentor_device_delete', 'mentor_logout', 'delivery_claim', 'delivery_authorize', 'delivery_finish', 'purge_due', 'health_check', 'staff_provision', 'staff_auth_cleanup']);
export function createDatabaseGateway(config: DatabaseConfig) {
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const publicClient = createClient(config.url, config.publicKey, options);
  const privileged = createClient(config.url, config.serviceKey, options);
  function wrap(client: typeof publicClient, service: boolean) {
    return { async rpc(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
      if (service && !serviceOperations.has(name)) throw new DatabaseFailure('FORBIDDEN', 'FORBIDDEN');
      const result = await client.schema('api').rpc(name, args);
      if (result.error) throw new DatabaseFailure(result.error.code, result.error.message);
      return result.data;
    } };
  }
  return {
    staff(token: string) { return wrap(createClient(config.url, config.publicKey, { ...options, global: { headers: { Authorization: `Bearer ${token}` } } }), false); },
    service: wrap(privileged, true),
    async verify(token: string): Promise<{ id: string }> { const result = await publicClient.auth.getUser(token); if (result.error || !result.data.user) throw new DatabaseFailure('UNAUTHENTICATED', 'UNAUTHENTICATED'); return { id: result.data.user.id }; },
    async ready(): Promise<boolean> { try { const result = await privileged.schema('api').rpc('health_check'); return !result.error && result.data === true; } catch { return false; } },
  };
}
