import { createClient, type Session } from '@supabase/supabase-js'
import {
  AuthFailure,
  type Attempt,
  type AuthProvider,
  type AuthStore,
  type Exchange,
  type Tokens,
} from './types'

const options = {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
}
const tokens = (session: Session | null): Tokens => {
  if (!session?.user.email || !session.expires_at)
    throw new AuthFailure('UNAUTHENTICATED')
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: new Date(session.expires_at * 1000).toISOString(),
    email: session.user.email.toLowerCase(),
  }
}
function providerError(error: { status?: number } | null) {
  if (error)
    throw new AuthFailure(
      !error.status || error.status >= 500 ? 'DEPENDENCY_UNAVAILABLE' : 'UNAUTHENTICATED',
    )
}

/** A fresh SDK auth client per operation prevents cross-request session mutation. */
export function createSupabaseAuthProvider(
  url: string,
  publicKey: string,
  serviceKey: string,
): AuthProvider {
  const client = () => createClient(url, publicKey, options)
  const admin = createClient(url, serviceKey, options)
  return {
    async sendEmail(email, redirectTo) {
      const { error } = await client().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      })
      // Equal public outcome for unknown/disallowed/rate-limited email; infrastructure errors remain operational failures.
      if (error && (!error.status || error.status >= 500))
        throw new AuthFailure('DEPENDENCY_UNAVAILABLE')
    },
    async verifyCode(email, code) {
      const { data, error } = await client().auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })
      providerError(error)
      return tokens(data.session)
    },
    async verifyLink(tokenHash) {
      const { data, error } = await client().auth.verifyOtp({
        token_hash: tokenHash,
        type: 'email',
      })
      providerError(error)
      return tokens(data.session)
    },
    async refresh(refreshToken) {
      const { data, error } = await client().auth.refreshSession({
        refresh_token: refreshToken,
      })
      providerError(error)
      return tokens(data.session)
    },
    async revoke(accessToken) {
      const { error } = await admin.auth.admin.signOut(accessToken, 'local')
      // Already expired/revoked sessions are a successful idempotent logout.
      if (error && ![401, 403, 404].includes(error.status ?? 0)) providerError(error)
    },
  }
}

/** Only fixed auth RPCs are exposed; this adapter never returns its service client. */
export function createSupabaseAuthStore(
  url: string,
  serviceKey: string,
): AuthStore & { cleanup(): Promise<void> } {
  const client = createClient(url, serviceKey, { ...options, db: { schema: 'api' } })
  async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await client.rpc(name, args)
    if (error) throw new AuthFailure('DEPENDENCY_UNAVAILABLE')
    return data as T
  }
  return {
    async createAttempt(attempt) {
      await rpc('staff_auth_create_attempt', { p_attempt: attempt })
    },
    getAttempt: (id) => rpc<Attempt | null>('staff_auth_get_attempt', { p_id: id }),
    consumeAttempt: (id) => rpc<boolean>('staff_auth_consume_attempt', { p_id: id }),
    async createExchange(exchange) {
      await rpc('staff_auth_create_exchange', { p_exchange: exchange })
    },
    consumeExchange: (ticketHash, challenge) =>
      rpc<Exchange | null>('staff_auth_consume_exchange', {
        p_hash: ticketHash,
        p_challenge: challenge,
      }),
    rateLimit: (key, limit, windowSeconds) =>
      rpc<boolean>('staff_auth_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_seconds: windowSeconds,
      }),
    async cleanup() {
      await rpc('staff_auth_cleanup', {})
    },
  }
}
