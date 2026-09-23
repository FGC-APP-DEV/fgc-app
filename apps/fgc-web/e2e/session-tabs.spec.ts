import { test, expect, type BrowserContext, type Page } from '@playwright/test'

const ids = {
  first: '11111111-1111-4111-8111-111111111111',
  second: '22222222-2222-4222-8222-222222222222',
  team: '33333333-3333-4333-8333-333333333333',
  panel: '44444444-4444-4444-8444-444444444444',
}
const team = {
  id: ids.team,
  officialId: '001',
  name: 'Brazil',
  country: 'Brazil',
  countryCode: 'BR',
  version: 1,
}
async function sessions(context: BrowserContext) {
  let refreshes = 0
  let logouts = 0
  let secondWaiting = false
  let releaseSecond: (() => void) | undefined
  const blockedSecond = new Promise<void>((resolve) => {
    releaseSecond = resolve
  })
  await context.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    const reply = (data: unknown) =>
      route.fulfill({ json: { data, meta: { requestId: ids.first } } })
    const denied = () =>
      route.fulfill({
        status: 401,
        json: {
          error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' },
          requestId: ids.first,
        },
      })
    if (path.endsWith('/csrf')) return reply({ csrfToken: 'csrf' })
    if (path === '/mentor/me') return denied()
    if (path === '/auth/refresh') {
      refreshes++
      return denied()
    }
    if (path === '/auth/logout') {
      logouts++
      return reply({ signedOut: true })
    }
    if (path === '/auth/email')
      return reply({
        attemptId:
          request.postDataJSON().email === 'second@example.test' ? ids.second : ids.first,
      })
    if (path === '/auth/verify') {
      const second = request.postDataJSON().attemptId === ids.second
      if (second) {
        secondWaiting = true
        await blockedSecond
      }
      return reply({
        accessToken: second ? 'synthetic-second-access' : 'synthetic-first-access',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: second ? ids.second : ids.first,
          email: second ? 'second@example.test' : 'first@example.test',
          name: second ? 'Second Operator' : 'First Operator',
          roles: ['judge'],
          version: 1,
        },
      })
    }
    if (path === '/judging/panels')
      return reply([
        {
          id: ids.panel,
          name: 'Panel A',
          judgeIds: [ids.first, ids.second],
          leaderId: ids.first,
          version: 1,
        },
      ])
    if (path === '/judging/cycle')
      return reply({ id: ids.panel, version: 1, state: 'active' })
    if (path === '/judging/teams')
      return reply([
        {
          id: ids.team,
          teamId: ids.team,
          panelId: ids.panel,
          team,
          evaluationStatus: 'pending',
          participationStatus: 'active',
          hasHistory: false,
          flags: [],
          version: 1,
        },
      ])
    if (path.endsWith('/observations')) return reply([])
    return route.fulfill({
      status: 404,
      json: { error: { code: 'NOT_FOUND', message: path }, requestId: ids.first },
    })
  })
  return {
    get refreshes() {
      return refreshes
    },
    get logouts() {
      return logouts
    },
    get secondWaiting() {
      return secondWaiting
    },
    releaseSecond: () => releaseSecond?.(),
  }
}
async function login(page: Page, email: string) {
  await page.getByRole('textbox', { name: 'Email address' }).fill(email)
  await page.getByRole('button', { name: 'Send sign-in email' }).click()
  await page.getByRole('textbox', { name: 'Email code' }).fill('123456')
  await page.getByRole('button', { name: 'Verify code' }).click()
}
async function expectNoCredentials(page: Page) {
  const stored = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }))
  expect(JSON.stringify(stored)).not.toContain('synthetic-first-access')
  expect(JSON.stringify(stored)).not.toContain('synthetic-second-access')
  expect(stored.local).not.toHaveProperty('fgc.refresh')
  expect(stored.session).not.toHaveProperty('fgc.refresh')
  expect(stored.local).not.toHaveProperty('fgc_token')
}

test('a second tab reuses in-memory session and logout clears both tabs', async ({
  page,
  context,
}, testInfo) => {
  const fixture = await sessions(context)
  await page.goto('/')
  await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('login.png'), fullPage: true })
  await login(page, 'first@example.test')
  await expect(page.getByText('Welcome, First Operator')).toBeVisible()
  const firstRefreshes = fixture.refreshes
  const second = await context.newPage()
  await second.goto('/')
  await expect(second.getByText('Welcome, First Operator')).toBeVisible()
  expect(fixture.refreshes).toBe(firstRefreshes)
  await expectNoCredentials(page)
  await expectNoCredentials(second)
  await second.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(second.getByRole('textbox', { name: 'Email address' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible()
  expect(fixture.logouts).toBe(1)
  await expectNoCredentials(page)
  await expectNoCredentials(second)
})

test('a concurrent login with another identity remounts the first tab and clears its old draft', async ({
  page,
  context,
}, testInfo) => {
  const fixture = await sessions(context)
  await page.goto('/')
  const second = await context.newPage()
  await second.goto('/')
  // Hold the second tab's own real login response. It completes after the first
  // identity starts editing, exercising a session change without an intervening logout.
  await login(second, 'second@example.test')
  await expect.poll(() => fixture.secondWaiting).toBe(true)
  await login(page, 'first@example.test')
  await expect(page.getByText('Welcome, First Operator')).toBeVisible()
  await page.getByRole('button', { name: 'Open judging' }).click()
  await page.getByRole('button', { name: 'Open Brazil', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Your observation' })
    .fill('Private draft belonging to first operator')
  await page.screenshot({
    path: testInfo.outputPath('judging-draft.png'),
    fullPage: true,
  })
  fixture.releaseSecond()
  await expect(page.getByText('Welcome, Second Operator')).toBeVisible()
  await expect(second.getByText('Welcome, Second Operator')).toBeVisible()
  await page.getByRole('button', { name: 'Open judging' }).click()
  await page.getByRole('button', { name: 'Open Brazil', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Your observation' })).toHaveValue('')
  await expect(page.getByText('Private draft belonging to first operator')).toHaveCount(0)
  await expectNoCredentials(page)
  await expectNoCredentials(second)
})
