import path from 'node:path'
import express, { Router } from 'express'
import type { User } from '@fgc/contracts'
import { createApi, createAuthRouter } from '@fgc/server'
import { createMockAuthProvider, createMockAuthStore, MOCK_CODE } from './auth'
import { createMockDatabase, MockGateway } from './gateway'
import { accounts, mentorCodes, pendingEmails, seed } from './seed'

/**
 * Development entry point with in-memory data and no external services.
 * Never bundled for production; data resets on every start.
 */
async function main() {
  const port = Number(process.env.PORT ?? 4000)
  const origins = (
    process.env.WEB_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((v) => v.trim())
  const mentorSecret = 'mock-mentor-secret-not-for-production-use'
  const db = await createMockDatabase(path.resolve('supabase/migrations'))
  const mock = new MockGateway(db)
  await seed(mock, mentorSecret)
  const gateway = mock.gateway()
  const { provider, outbox } = createMockAuthProvider(mock)
  const key = (fill: string) => Buffer.alloc(32, fill)
  const web = origins[0]
  const authRouter = createAuthRouter({
    environment: 'development',
    allowedOrigins: origins,
    callbackUrls: { web: `${web}/`, mobile: `${web}/mobile-callback` },
    exchangeUrls: { web: `${web}/`, mobile: `${web}/mobile-callback` },
    encryptionKey: key('e'),
    csrfKey: key('c'),
    rateLimitKey: key('r'),
    store: createMockAuthStore(),
    provider,
    resolveUser: async (token) => {
      const identity = mock.identity(token)
      const row = await db.query<{ email: string }>(
        'select email from auth.users where id=$1',
        [identity.userId],
      )
      await gateway.service.rpc('staff_provision', {
        p_auth_user_id: identity.userId,
        p_email: row.rows[0].email,
      })
      return (await gateway.staff(token).rpc('me')) as User
    },
  })
  const devRouter = Router()
  devRouter.get('/info', (_, res) =>
    res.json({ code: MOCK_CODE, accounts, pendingEmails, mentorCodes, outbox }),
  )
  const app = createApi({
    gateway,
    allowedOrigins: origins,
    mentorSecret,
    development: true,
    authRouter,
    devRouter,
  })
  // Optional same-origin static hosting (used by the full-stack e2e run).
  const staticDir = process.env.MOCK_STATIC_DIR
  const server = express()
  if (staticDir) server.use(express.static(path.resolve(staticDir)))
  server.use(app)
  server.listen(port, () => {
    console.log(
      `FGC MOCK API on http://localhost:${port} (in-memory data, sign-in code ${MOCK_CODE})`,
    )
    for (const a of accounts)
      console.log(`  ${a.email.padEnd(24)} ${a.roles.join('+').padEnd(20)} ${a.note}`)
    for (const m of mentorCodes)
      console.log(`  mentor code ${m.code} -> team ${m.official}`)
  })
}
void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
