import { test, expect, type Page } from '@playwright/test'
// Synthetic payload shaped like the observed api.first.global response.
const sample = {
  matches: [
    {
      participants: [
        { teamKey: 23, country: 'BRA', countryCode: 'br', surrogate: 0, station: 11 },
        { teamKey: 93, country: 'KOR', countryCode: 'kr', surrogate: 0, station: 12 },
        { teamKey: 170, country: 'TUR', countryCode: 'tr', surrogate: 1, station: 13 },
        { teamKey: 23, country: 'BRA', countryCode: 'br', surrogate: 1, station: 21 },
      ],
    },
  ],
}
const id = '11111111-1111-4111-8111-111111111111'
const search = (page: Page) => page.getByRole('textbox', { name: 'Team name or code' })
async function fixture(page: Page) {
  const teamRequests: string[] = []
  await page.route('https://api.first.global/**', (route) => {
    teamRequests.push(route.request().url())
    return route.fulfill({ json: sample })
  })
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
    const reply = (data: unknown) =>
      route.fulfill({ json: { data, meta: { requestId: id } } })
    if (path.endsWith('/csrf')) return reply({ csrfToken: 'csrf' })
    if (path === '/auth/email') return reply({ attemptId: id })
    if (path === '/auth/verify')
      return reply({
        accessToken: 'synthetic-test-only',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: { id, name: 'Operator', email: 'test@example.org', roles: [], version: 1 },
      })
    return route.fulfill({
      status: 401,
      json: { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } },
    })
  })
  await page.goto('/')
  return teamRequests
}
test('the landing page finds a team without signing in and lists nothing until typed', async ({
  page,
}) => {
  const requests = await fixture(page)
  await expect(page.getByText('Type a country name or code')).toBeVisible()
  await expect(page.getByText('Brazil')).toHaveCount(0)
  expect(requests).toHaveLength(0)
  await search(page).fill('  bRaZiL ')
  await expect(page.getByText('Team 23')).toBeVisible()
  await expect(page.getByText('South Korea')).toHaveCount(0)
  expect(requests).toHaveLength(1)
  expect(requests[0]).toContain('excludeMatchDetails=true')
  await search(page).fill('kor')
  await expect(page.getByText('South Korea')).toBeVisible()
  await expect(page.getByText('Brazil')).toHaveCount(0)
  await search(page).fill('xyz')
  await expect(page.getByText('No team matches “xyz”.')).toBeVisible()
  await search(page).fill('')
  await expect(page.getByText('Type a country name or code')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send sign-in email' })).toBeVisible()
})
test('a signed-in user reaches the same search from the navigation bar', async ({
  page,
}) => {
  await fixture(page)
  await page
    .getByRole('textbox', { name: 'Email or mentor access code' })
    .fill('test@example.org')
  await page.getByRole('button', { name: 'Send sign-in email' }).click()
  await page.getByRole('textbox', { name: 'Email code' }).fill('123456')
  await page.getByRole('button', { name: 'Verify code' }).click()
  await expect(page.getByText('Welcome, Operator')).toBeVisible()
  await page.getByRole('button', { name: 'Teams' }).click()
  await expect(page.getByText('Type a country name or code')).toBeVisible()
  await search(page).fill('turk')
  await expect(page.getByText('Team 170')).toBeVisible()
  await page.getByRole('button', { name: 'Home' }).click()
  await expect(page.getByText('Welcome, Operator')).toBeVisible()
})
