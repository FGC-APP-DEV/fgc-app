import express from 'express'
import { beforeEach, afterEach, test, expect, jest } from '@jest/globals'
import type { Server } from 'node:http'
import { createAuthRouter } from './router'
import {
  AuthFailure,
  type Attempt,
  type AuthConfig,
  type Exchange,
  type Tokens,
} from './types'
import { checkVerifier, csrfToken, digest, seal, unseal, verifyCsrf } from './crypto'

const verifier = 'a'.repeat(43)
const key = Buffer.alloc(32, 7)
const origin = 'https://fgc.test'
const tokenPair: Tokens = {
  accessToken: 'access',
  refreshToken: 'refresh-secret',
  email: 'staff@example.test',
  expiresAt: '2030-01-01T00:00:00.000Z',
}
let server: Server
let base: string
let config: AuthConfig
let attempts: Map<string, Attempt>
let exchanges: Map<string, Exchange>
beforeEach(async () => {
  attempts = new Map()
  exchanges = new Map()
  config = {
    environment: 'test',
    allowedOrigins: [origin],
    callbackUrls: { web: `${origin}/callback`, mobile: `${origin}/mobile/callback` },
    exchangeUrls: { web: `${origin}/exchange`, mobile: `${origin}/mobile/exchange` },
    encryptionKey: key,
    csrfKey: key,
    rateLimitKey: key,
    resolveUser: jest.fn(async () => ({
      id: 'user',
      email: tokenPair.email,
      name: null,
      roles: [],
      version: 0,
    })),
    provider: {
      sendEmail: jest.fn(async () => undefined),
      verifyCode: jest.fn(async () => tokenPair),
      verifyLink: jest.fn(async () => tokenPair),
      refresh: jest.fn(async () => tokenPair),
      revoke: jest.fn(async () => undefined),
    },
    store: {
      createAttempt: async (a) => {
        attempts.set(a.id, a)
      },
      getAttempt: async (id) => attempts.get(id) ?? null,
      consumeAttempt: async (id) => attempts.delete(id),
      createExchange: async (e) => {
        exchanges.set(e.ticketHash, e)
      },
      consumeExchange: async (hash, challenge) => {
        const value = exchanges.get(hash)
        if (
          !value ||
          value.challenge !== challenge ||
          Date.parse(value.expiresAt) <= Date.now()
        )
          return null
        exchanges.delete(hash)
        return value
      },
      rateLimit: jest.fn(async () => true),
    },
  }
  const app = express()
  app.use(express.json())
  app.use('/auth', createAuthRouter(config))
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No listener')
  base = `http://127.0.0.1:${address.port}/auth`
})
afterEach(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) =>
    server.close((e) => (e ? reject(e) : resolve())),
  )
})
async function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  const response = await fetch(`${base}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, ...headers },
    body: JSON.stringify(body),
  })
  return {
    status: response.status,
    headers: response.headers,
    body: await response.json(),
  }
}
async function start(platform: 'web' | 'mobile' = 'web') {
  return (
    await post('email', {
      email: tokenPair.email,
      platform,
      codeChallenge: digest(verifier),
    })
  ).body.data.attemptId as string
}
test('PKCE and authenticated encryption reject wrong verifier, tampering, and context substitution', () => {
  expect(checkVerifier(digest(verifier), verifier)).toBe(true)
  expect(checkVerifier(digest(verifier), 'b'.repeat(43))).toBe(false)
  const ciphertext = seal(tokenPair, key, 'ticket-one')
  expect(ciphertext).not.toContain('refresh-secret')
  expect(unseal(ciphertext, key, 'ticket-one')).toEqual(tokenPair)
  expect(() => unseal(ciphertext, key, 'ticket-two')).toThrow()
  expect(() => unseal(ciphertext, Buffer.alloc(32, 3), 'ticket-one')).toThrow()
})
test('CSRF is bound to refresh credential and expires', () => {
  const token = csrfToken('refresh-one', key, 100000)
  expect(verifyCsrf(token, 'refresh-one', key, 100001)).toBe(true)
  expect(verifyCsrf(token, 'refresh-two', key, 100001)).toBe(false)
  expect(verifyCsrf(token, 'refresh-one', key, 3700001)).toBe(false)
})
test('CSRF GET supports browser same-origin metadata but rejects an untrusted Referer', async () => {
  const headers = {
    Cookie: '__Host-fgc_refresh=refresh-secret',
    'Sec-Fetch-Site': 'same-origin',
    Referer: `${origin}/app`,
  }
  expect((await fetch(`${base}/csrf`, { headers })).status).toBe(200)
  expect(
    (
      await fetch(`${base}/csrf`, {
        headers: { ...headers, Referer: 'https://attacker.test/' },
      })
    ).status,
  ).toBe(403)
  expect(
    (await fetch(`${base}/csrf`, { headers: { Cookie: headers.Cookie } })).status,
  ).toBe(403)
})
test('web OTP returns no refresh token and issues a secure host-only cookie', async () => {
  const attemptId = await start()
  const response = await post('verify', {
    attemptId,
    emailCode: '123456',
    codeVerifier: verifier,
  })
  expect(response.status).toBe(200)
  expect(response.body.data.refreshToken).toBeUndefined()
  expect(response.body.data.user.roles).toEqual([])
  expect(response.headers.get('set-cookie')).toContain(
    '__Host-fgc_refresh=refresh-secret; Path=/; HttpOnly; Secure; SameSite=Lax',
  )
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(
    (await post('verify', { attemptId, emailCode: '123456', codeVerifier: verifier }))
      .status,
  ).toBe(401)
})
test('bad PKCE fails before OTP verification and keeps original attempt usable', async () => {
  const attemptId = await start()
  expect(
    (
      await post('verify', {
        attemptId,
        emailCode: '123456',
        codeVerifier: 'b'.repeat(43),
      })
    ).status,
  ).toBe(401)
  expect(config.provider.verifyCode).not.toHaveBeenCalled()
  expect(
    (await post('verify', { attemptId, emailCode: '123456', codeVerifier: verifier }))
      .status,
  ).toBe(200)
})
test('link confirmation requires POST; ticket is encrypted, PKCE-bound and single use', async () => {
  const attemptId = await start('mobile')
  expect((await fetch(`${base}/confirm-link?attemptId=${attemptId}`)).status).toBe(404)
  expect(config.provider.verifyLink).not.toHaveBeenCalled()
  const confirmed = await post('confirm-link', { attemptId, tokenHash: 'hash'.repeat(8) })
  expect(confirmed.status).toBe(200)
  expect(JSON.stringify(confirmed.body)).not.toContain('refresh-secret')
  const ticket = confirmed.body.data.ticket
  expect(JSON.stringify([...exchanges.values()])).not.toContain('refresh-secret')
  expect((await post('exchange', { ticket, codeVerifier: 'b'.repeat(43) })).status).toBe(
    401,
  )
  const exchanged = await post('exchange', { ticket, codeVerifier: verifier })
  expect(exchanged.body.data.refreshToken).toBe('refresh-secret')
  expect((await post('exchange', { ticket, codeVerifier: verifier })).status).toBe(401)
})
test('link identity must match original email and mismatched session is revoked', async () => {
  const attemptId = await start()
  config.provider.verifyLink = jest.fn(async () => ({
    ...tokenPair,
    email: 'other@example.test',
  }))
  expect(
    (await post('confirm-link', { attemptId, tokenHash: 'hash'.repeat(8) })).status,
  ).toBe(401)
  expect(config.provider.revoke).toHaveBeenCalledWith('access')
  expect(exchanges.size).toBe(0)
})
test('web refresh requires allowed Origin and cookie-bound CSRF; ambiguous credentials rejected', async () => {
  const headers = {
    Cookie: '__Host-fgc_refresh=refresh-secret',
    'X-CSRF-Token': csrfToken('refresh-secret', key),
  }
  expect(
    (await post('refresh', { platform: 'web' }, { Cookie: headers.Cookie })).status,
  ).toBe(403)
  expect(
    (
      await post(
        'refresh',
        { platform: 'web' },
        { ...headers, Origin: 'https://attacker.test' },
      )
    ).status,
  ).toBe(403)
  expect((await post('refresh', { platform: 'web' }, headers)).status).toBe(200)
  expect(
    (await post('refresh', { platform: 'mobile', refreshToken: 'foo' }, headers)).status,
  ).toBe(400)
})
test('late failed refresh does not clear rotated cookie and logout without session is idempotent', async () => {
  config.provider.refresh = jest.fn(async () => {
    throw new AuthFailure('UNAUTHENTICATED')
  })
  const response = await post(
    'refresh',
    { platform: 'web' },
    { Cookie: '__Host-fgc_refresh=old', 'X-CSRF-Token': csrfToken('old', key) },
  )
  expect(response.status).toBe(401)
  expect(response.headers.get('set-cookie')).toBeNull()
  expect((await post('logout', { platform: 'web' })).body.data.signedOut).toBe(true)
})
test('expired attempts and exchanges cannot return a session', async () => {
  const attemptId = await start()
  const value = attempts.get(attemptId)
  if (!value) throw new Error('Missing fixture')
  value.expiresAt = '2000-01-01T00:00:00.000Z'
  expect(
    (await post('verify', { attemptId, emailCode: '123456', codeVerifier: verifier }))
      .status,
  ).toBe(401)
  expect(config.provider.verifyCode).not.toHaveBeenCalled()
})
test('distributed limits fail closed without disclosing emails or IPs in storage keys', async () => {
  config.store.rateLimit = jest.fn(async () => false)
  expect(
    (
      await post('email', {
        email: tokenPair.email,
        platform: 'web',
        codeChallenge: digest(verifier),
      })
    ).status,
  ).toBe(429)
  expect(config.provider.sendEmail).not.toHaveBeenCalled()
  expect(config.store.rateLimit).toHaveBeenCalledWith(
    expect.stringMatching(/^[a-f0-9]{64}$/),
    10,
    60,
  )
})
