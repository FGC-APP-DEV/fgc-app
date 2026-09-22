import { createHmac, randomUUID } from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import {
  emailInput,
  verifyInput,
  confirmLinkInput,
  exchangeInput,
  refreshInput,
  errorStatus,
} from '@fgc/contracts'
import {
  checkVerifier,
  csrfToken,
  digest,
  randomSecret,
  seal,
  unseal,
  verifyCsrf,
} from './crypto'
import {
  AuthFailure,
  type AuthConfig,
  type Attempt,
  type Platform,
  type Tokens,
} from './types'

/** Mount at /api/v1/auth, after express.json({limit:'256kb'}). Never log body/cookies. */
export function createAuthRouter(config: AuthConfig): Router {
  validateConfig(config)
  const router = Router()
  const insecureDev = config.environment === 'development'
  const cookieName = insecureDev ? 'fgc_refresh' : '__Host-fgc_refresh'
  const cookieOptions = {
    httpOnly: true,
    secure: !insecureDev,
    sameSite: 'lax' as const,
    path: '/',
  }
  const cookie = (req: Request) => {
    const matches = (req.headers.cookie ?? '')
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.startsWith(`${cookieName}=`))
    if (matches.length > 1) throw new AuthFailure('VALIDATION_ERROR')
    return matches.length
      ? decodeURIComponent(matches[0].slice(cookieName.length + 1))
      : ''
  }
  const origin = (req: Request) => {
    if (!req.headers.origin || !config.allowedOrigins.includes(req.headers.origin))
      throw new AuthFailure('FORBIDDEN')
  }
  const rate = async (scope: string, value: string, limit: number, seconds: number) => {
    const key = createHmac('sha256', config.rateLimitKey)
      .update(`${scope}:${value}`)
      .digest('hex')
    if (!(await config.store.rateLimit(key, limit, seconds)))
      throw new AuthFailure('RATE_LIMITED')
  }
  const webCsrf = (req: Request, refresh: string) => {
    origin(req)
    if (!refresh || !verifyCsrf(req.get('X-CSRF-Token') ?? '', refresh, config.csrfKey))
      throw new AuthFailure('FORBIDDEN')
  }
  const attempt = async (id: string): Promise<Attempt> => {
    const value = await config.store.getAttempt(id)
    if (!value || Date.parse(value.expiresAt) <= Date.now())
      throw new AuthFailure('UNAUTHENTICATED')
    return value
  }
  const deliver = async (
    tokens: Tokens,
    platform: Platform,
    req: Request,
    res: Response,
  ) => {
    if (platform === 'web') origin(req)
    const user = await config.resolveUser(tokens.accessToken)
    if (platform === 'web') res.cookie(cookieName, tokens.refreshToken, cookieOptions)
    return {
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
      user,
      ...(platform === 'mobile' ? { refreshToken: tokens.refreshToken } : {}),
    }
  }
  const route = (
    method: 'get' | 'post',
    path: string,
    handler: (req: Request, res: Response) => Promise<unknown>,
  ) => {
    router[method](path, async (req, res) => {
      const requestId = randomUUID()
      res.set('Cache-Control', 'no-store')
      try {
        // Browser callers always present an approved Origin. Native callers have none.
        if (req.headers.origin) origin(req)
        await rate(
          `ip:${path}`,
          req.ip ?? req.socket.remoteAddress ?? 'unknown',
          path === '/email' ? 10 : 60,
          60,
        )
        const data = await handler(req, res)
        res.json({ data, meta: { requestId } })
      } catch (error) {
        const code =
          error instanceof z.ZodError
            ? 'VALIDATION_ERROR'
            : error instanceof AuthFailure
              ? error.code
              : 'DEPENDENCY_UNAVAILABLE'
        const message =
          code === 'DEPENDENCY_UNAVAILABLE'
            ? 'Authentication is temporarily unavailable.'
            : code === 'RATE_LIMITED'
              ? 'Please wait before trying again.'
              : 'Authentication could not be completed.'
        res.status(errorStatus[code]).json({ error: { code, message }, requestId })
      }
    })
  }
  route('post', '/email', async (req) => {
    const input = emailInput.parse(req.body)
    if (input.platform === 'web') origin(req)
    await rate('send-email', input.email, 5, 600)
    const id = randomUUID()
    const destination = config.callbackUrls[input.platform]
    const expiresAt = new Date(Date.now() + 600_000).toISOString()
    await config.store.createAttempt({
      id,
      email: input.email,
      platform: input.platform,
      challenge: input.codeChallenge,
      destination,
      expiresAt,
    })
    const redirect = new URL(destination)
    redirect.searchParams.set('attemptId', id)
    // Provider rejection (including unknown address) is deliberately generic.
    await config.provider.sendEmail(input.email, redirect.toString())
    return { attemptId: id, expiresAt }
  })
  route('post', '/verify', async (req, res) => {
    const input = verifyInput.parse(req.body)
    const value = await attempt(input.attemptId)
    if (value.platform === 'web') origin(req)
    await rate('verify-email', value.email, 10, 600)
    if (!checkVerifier(value.challenge, input.codeVerifier))
      throw new AuthFailure('UNAUTHENTICATED')
    const tokens = await config.provider.verifyCode(value.email, input.emailCode)
    if (
      tokens.email.toLowerCase() !== value.email ||
      !(await config.store.consumeAttempt(value.id))
    ) {
      await config.provider.revoke(tokens.accessToken)
      throw new AuthFailure('UNAUTHENTICATED')
    }
    return deliver(tokens, value.platform, req, res)
  })
  route('post', '/confirm-link', async (req) => {
    const input = confirmLinkInput.parse(req.body)
    const value = await attempt(input.attemptId)
    if (value.platform === 'web') origin(req)
    await rate('verify-email', value.email, 10, 600)
    const tokens = await config.provider.verifyLink(input.tokenHash)
    if (
      tokens.email.toLowerCase() !== value.email ||
      !(await config.store.consumeAttempt(value.id))
    ) {
      await config.provider.revoke(tokens.accessToken)
      throw new AuthFailure('UNAUTHENTICATED')
    }
    const ticket = randomSecret()
    const ticketHash = digest(ticket)
    try {
      await config.store.createExchange({
        ticketHash,
        platform: value.platform,
        challenge: value.challenge,
        ciphertext: seal(tokens, config.encryptionKey, ticketHash),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      })
    } catch (error) {
      await config.provider.revoke(tokens.accessToken)
      throw error
    }
    return { ticket, exchangeUrl: config.exchangeUrls[value.platform] }
  })
  route('post', '/exchange', async (req, res) => {
    const input = exchangeInput.parse(req.body)
    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(input.codeVerifier))
      throw new AuthFailure('UNAUTHENTICATED')
    const ticketHash = digest(input.ticket)
    const value = await config.store.consumeExchange(
      ticketHash,
      digest(input.codeVerifier),
    )
    if (!value || Date.parse(value.expiresAt) <= Date.now())
      throw new AuthFailure('UNAUTHENTICATED')
    return deliver(
      unseal<Tokens>(value.ciphertext, config.encryptionKey, ticketHash),
      value.platform,
      req,
      res,
    )
  })
  route('get', '/csrf', async (req) => {
    // Same-origin browser GET fetches commonly omit Origin. Fetch Metadata plus
    // the browser-controlled Referer preserves the exact allowlist check.
    if (!req.headers.origin && req.get('Sec-Fetch-Site') === 'same-origin') {
      let referringOrigin = ''
      try {
        referringOrigin = new URL(req.get('Referer') ?? '').origin
      } catch {
        /* fail closed below */
      }
      if (!config.allowedOrigins.includes(referringOrigin))
        throw new AuthFailure('FORBIDDEN')
    } else origin(req)
    const refresh = cookie(req)
    if (!refresh) throw new AuthFailure('UNAUTHENTICATED')
    return { csrfToken: csrfToken(refresh, config.csrfKey) }
  })
  route('post', '/refresh', async (req, res) => {
    const input = refreshInput.parse(req.body)
    const refreshCookie = cookie(req)
    if (
      req.headers.authorization ||
      (input.platform === 'web' && input.refreshToken) ||
      (input.platform === 'mobile' && refreshCookie)
    )
      throw new AuthFailure('VALIDATION_ERROR')
    const refresh = input.platform === 'web' ? refreshCookie : input.refreshToken
    if (input.platform === 'web') webCsrf(req, refreshCookie)
    if (!refresh) throw new AuthFailure('UNAUTHENTICATED')
    // Never clear cookies on failure: a late failed concurrent refresh must not erase a newer cookie.
    return deliver(await config.provider.refresh(refresh), input.platform, req, res)
  })
  route('post', '/logout', async (req, res) => {
    const input = refreshInput.parse(req.body)
    const refreshCookie = cookie(req)
    if (
      (input.platform === 'web' && input.refreshToken) ||
      (input.platform === 'mobile' && refreshCookie)
    )
      throw new AuthFailure('VALIDATION_ERROR')
    if (input.platform === 'web') {
      origin(req)
      if (refreshCookie) webCsrf(req, refreshCookie)
    }
    const refresh = input.platform === 'web' ? refreshCookie : input.refreshToken
    const authorization = req.headers.authorization
    if (authorization && !/^Bearer [^\s]+$/.test(authorization))
      throw new AuthFailure('VALIDATION_ERROR')
    // Use refresh credential when present so a caller cannot revoke one session and retain another.
    if (refresh) {
      try {
        const tokens = await config.provider.refresh(refresh)
        await config.provider.revoke(tokens.accessToken)
      } catch (error) {
        if (!(error instanceof AuthFailure) || error.code !== 'UNAUTHENTICATED')
          throw error
      }
    } else if (authorization) await config.provider.revoke(authorization.slice(7))
    if (input.platform === 'web') res.clearCookie(cookieName, cookieOptions)
    return { signedOut: true }
  })
  return router
}

function validateConfig(config: AuthConfig) {
  if (
    [config.encryptionKey, config.csrfKey, config.rateLimitKey].some(
      (key) => key.length !== 32,
    )
  )
    throw new Error('Auth keys must contain 32 bytes.')
  if (!config.allowedOrigins.length) throw new Error('Auth origin allowlist is required.')
  for (const value of [
    ...config.allowedOrigins,
    ...Object.values(config.callbackUrls),
    ...Object.values(config.exchangeUrls),
  ]) {
    const url = new URL(value)
    if (
      url.username ||
      url.password ||
      url.hash ||
      (url.protocol !== 'https:' &&
        !(config.environment === 'development' && url.protocol === 'http:'))
    )
      throw new Error('Auth URL configuration requires HTTPS.')
  }
  for (const value of config.allowedOrigins)
    if (new URL(value).origin !== value)
      throw new Error('Auth origins must be exact origins.')
}
