import { randomUUID } from 'node:crypto'
import {
  AuthFailure,
  type Attempt,
  type AuthProvider,
  type AuthStore,
  type Exchange,
  type Tokens,
} from '@fgc/server'
import type { MockGateway } from './gateway'

/** Every mock account signs in with this code. No email is ever sent. */
export const MOCK_CODE = '123456'

export interface OutboxEntry {
  email: string
  code: string
  link: string
  at: string
}

export function createMockAuthProvider(gateway: MockGateway) {
  const outbox: OutboxEntry[] = []
  const links = new Map<string, string>()
  const refreshTokens = new Map<string, string>()
  const issue = async (email: string): Promise<Tokens> => {
    const started = await gateway.startSession(email)
    const refreshToken = `mock-refresh.${randomUUID()}`
    refreshTokens.set(refreshToken, email.toLowerCase())
    return {
      accessToken: started.token,
      refreshToken,
      expiresAt: new Date(started.expiresAt).toISOString(),
      email: email.toLowerCase(),
    }
  }
  const provider: AuthProvider = {
    async sendEmail(email, redirectTo) {
      const tokenHash = randomUUID()
      links.set(tokenHash, email.toLowerCase())
      const link = `${redirectTo}${redirectTo.includes('?') ? '&' : '?'}token_hash=${tokenHash}`
      outbox.unshift({
        email: email.toLowerCase(),
        code: MOCK_CODE,
        link,
        at: new Date().toISOString(),
      })
      outbox.length = Math.min(outbox.length, 20)
      console.log(`[mock email] ${email}: code ${MOCK_CODE}`)
    },
    async verifyCode(email, code) {
      if (code !== MOCK_CODE) throw new AuthFailure('UNAUTHENTICATED')
      return issue(email)
    },
    async verifyLink(tokenHash) {
      const email = links.get(tokenHash)
      if (!email) throw new AuthFailure('UNAUTHENTICATED')
      links.delete(tokenHash)
      return issue(email)
    },
    async refresh(refreshToken) {
      const email = refreshTokens.get(refreshToken)
      if (!email) throw new AuthFailure('UNAUTHENTICATED')
      refreshTokens.delete(refreshToken)
      return issue(email)
    },
    async revoke(accessToken) {
      await gateway.endSession(accessToken)
    },
  }
  return { provider, outbox }
}

/** In-memory replacement for the private.staff_auth_* tables. Rate limits are lenient. */
export function createMockAuthStore(): AuthStore {
  const attempts = new Map<string, Attempt>()
  const exchanges = new Map<string, Exchange>()
  return {
    async createAttempt(attempt) {
      attempts.set(attempt.id, attempt)
    },
    async getAttempt(id) {
      return attempts.get(id) ?? null
    },
    async consumeAttempt(id) {
      return attempts.delete(id)
    },
    async createExchange(exchange) {
      exchanges.set(exchange.ticketHash, exchange)
    },
    async consumeExchange(ticketHash, challenge) {
      const found = exchanges.get(ticketHash)
      if (!found || found.challenge !== challenge) return null
      exchanges.delete(ticketHash)
      return Date.parse(found.expiresAt) > Date.now() ? found : null
    },
    async rateLimit() {
      return true
    },
  }
}
