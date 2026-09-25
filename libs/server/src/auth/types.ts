import type { User } from '@fgc/contracts'

export type Platform = 'web' | 'mobile'
export interface Attempt {
  id: string
  email: string
  platform: Platform
  challenge: string
  destination: string
  expiresAt: string
}
export interface Tokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
  email: string
}
export interface Exchange {
  ticketHash: string
  challenge: string
  platform: Platform
  ciphertext: string
  expiresAt: string
}
export interface AuthStore {
  createAttempt(attempt: Attempt): Promise<void>
  getAttempt(id: string): Promise<Attempt | null>
  consumeAttempt(id: string): Promise<boolean>
  createExchange(exchange: Exchange): Promise<void>
  consumeExchange(ticketHash: string, challenge: string): Promise<Exchange | null>
  rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean>
}
export interface AuthProvider {
  sendEmail(email: string, redirectTo: string): Promise<void>
  verifyCode(email: string, code: string): Promise<Tokens>
  verifyLink(tokenHash: string): Promise<Tokens>
  refresh(refreshToken: string): Promise<Tokens>
  revoke(accessToken: string): Promise<void>
}
export interface AuthConfig {
  environment: 'development' | 'test' | 'production' | 'staging'
  allowedOrigins: readonly string[]
  callbackUrls: Record<Platform, string>
  exchangeUrls: Record<Platform, string>
  encryptionKey: Buffer
  csrfKey: Buffer
  rateLimitKey: Buffer
  store: AuthStore
  provider: AuthProvider
  /** Resolve current internal profile/roles using this user's verified JWT, never metadata. */
  resolveUser(accessToken: string): Promise<User>
}
export class AuthFailure extends Error {
  constructor(
    public readonly code:
      | 'UNAUTHENTICATED'
      | 'FORBIDDEN'
      | 'RATE_LIMITED'
      | 'DEPENDENCY_UNAVAILABLE'
      | 'VALIDATION_ERROR',
  ) {
    super(code)
  }
}
