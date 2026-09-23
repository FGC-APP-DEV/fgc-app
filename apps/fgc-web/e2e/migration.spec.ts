import { test, expect, type Page } from '@playwright/test'
const id = '11111111-1111-4111-8111-111111111111'
const templateId = '22222222-2222-4222-8222-222222222222'
const team = {
  id,
  officialId: '001',
  name: 'Brazil',
  country: 'Brazil',
  countryCode: 'BR',
  version: 1,
}
async function fixture(page: Page, roles: string[]) {
  const writes: { path: string; body: unknown; key?: string }[] = []
  let captured = false
  let mentor = false
  let response: string | null = null
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname.replace('/api/v1', '')
    const reply = (data: unknown) =>
      route.fulfill({ json: { data, meta: { requestId: id } } })
    const denied = () =>
      route.fulfill({
        status: 401,
        json: { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } },
      })
    if (path.endsWith('/csrf')) return reply({ csrfToken: 'csrf' })
    if (path === '/mentor/me')
      return mentor ? reply({ team, event: { id, name: 'FGC' } }) : denied()
    if (path === '/auth/refresh') return denied()
    if (path === '/auth/email') return reply({ attemptId: id })
    if (path === '/auth/verify')
      return reply({
        accessToken: 'synthetic-test-only',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: { id, name: 'Operator', email: 'test@example.org', roles, version: 1 },
      })
    if (path === '/mentor/redeem') {
      mentor = true
      return reply({ team, event: { id, name: 'FGC' } })
    }
    if (path === '/mentor/pages')
      return reply([
        {
          id,
          teamId: id,
          sourceArea: 'filming',
          message: 'Please visit the filming booth.',
          response,
          version: 1,
        },
      ])
    if (path === '/mentor/filming')
      return reply([{ templateId, name: 'Step & Repeat', status: 'pending' }])
    if (path === '/filming/tracker')
      return reply({
        teams: [
          {
            ...team,
            shots: captured
              ? [
                  {
                    id,
                    templateId,
                    teamId: id,
                    status: 'captured',
                    notes: 'Interview recorded',
                    version: 1,
                  },
                ]
              : [],
          },
        ],
        templates: [{ id: templateId, name: 'Step & Repeat' }],
      })
    if (['/filming/categories', '/filming/items', '/pages'].includes(path))
      return reply([])
    if (req.method() !== 'GET') {
      writes.push({
        path,
        body: req.postDataJSON(),
        key: req.headers()['idempotency-key'],
      })
      if (path.includes('/shots/')) captured = true
      if (path.endsWith('/respond')) response = req.postDataJSON().response
      return reply({
        commandId: id,
        entityId: id,
        resultingVersion: 1,
        outcome: 'updated',
        committedAt: new Date().toISOString(),
      })
    }
    return route.fulfill({
      status: 404,
      json: {
        error: { code: 'NOT_FOUND', message: 'Unexpected fixture request: ' + path },
      },
    })
  })
  await page.goto('/')
  return writes
}
async function login(page: Page) {
  await page.getByRole('textbox', { name: 'Email address' }).fill('test@example.org')
  await page.getByRole('button', { name: 'Send sign-in email' }).click()
  await page.getByRole('textbox', { name: 'Email code' }).fill('123456')
  await page.getByRole('button', { name: 'Verify code' }).click()
  await expect(page.getByText('Welcome, Operator')).toBeVisible()
}
test('admin launcher denies Judging even with a mixed role', async ({ page }) => {
  await fixture(page, ['admin', 'judgeAdvisor'])
  await login(page)
  await expect(page.getByRole('button', { name: 'Open administration' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open judging' })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('fgc.refresh'))).toBeNull()
})
test('filmmaker records notes and a versioned capture, then sees refreshed coverage', async ({
  page,
}) => {
  const writes = await fixture(page, ['filmmaker'])
  await login(page)
  await page.getByRole('button', { name: 'Open filming' }).click()
  await page.getByRole('button', { name: 'Update Brazil', exact: true }).click()
  await page.getByRole('textbox', { name: 'Shot notes' }).fill('Interview recorded')
  await page.getByRole('button', { name: 'Captured', exact: true }).last().click()
  await expect(page.getByText('1 of 1 teams captured')).toBeVisible()
  expect(writes[0].body).toEqual({
    expectedVersion: 0,
    status: 'captured',
    notes: 'Interview recorded',
  })
  expect(writes[0].key).toMatch(/^[a-f0-9-]{36}$/)
})
test('mentor responds once and sees the shared saved response', async ({ page }) => {
  const writes = await fixture(page, [])
  await page.getByRole('button', { name: 'Mentor access', exact: true }).click()
  await page.getByRole('textbox', { name: 'Mentor access code' }).fill('ABCDEF123456')
  await page.getByRole('button', { name: 'Open team messages' }).click()
  await expect(page.getByText('Please visit the filming booth.')).toBeVisible()
  const button = page.getByRole('button', { name: /On our way/i })
  await button.click()
  await expect(button).toHaveCount(0)
  expect(writes.filter((write) => write.path.endsWith('/respond'))).toHaveLength(1)
})
