import { test, expect, type Page } from '@playwright/test'

const userId = '11111111-1111-4111-8111-111111111111'
const teamId = '22222222-2222-4222-8222-222222222222'
const panelId = '33333333-3333-4333-8333-333333333333'
const previewId = '44444444-4444-4444-8444-444444444444'
const observationId = '55555555-5555-4555-8555-555555555555'
const team = {
  id: teamId,
  officialId: '001',
  name: 'Brazil',
  country: 'Brazil',
  countryCode: 'BR',
  version: 1,
}
type Write = { path: string; body: Record<string, unknown>; key?: string }

async function fixture(
  page: Page,
  role: 'judge' | 'admin',
  failure: 'network' | 'conflict' | 'none' = 'none',
) {
  const writes: Write[] = []
  let observation: {
    id: string
    authorId: string
    authorName: string
    panelId: string
    teamId: string
    text: string
    version: number
    updatedAt: string
  } | null = null
  let failureUsed = false
  const preview = {
    id: previewId,
    version: 1,
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
    columns: ['id', 'name', 'country'],
    sheets: [],
    rows: [
      {
        row: 1,
        officialId: '001',
        name: 'Brazil',
        country: 'BR',
        status: 'ready',
        errors: [],
      },
      {
        row: 2,
        officialId: '',
        name: 'Missing identifier',
        country: 'BR',
        status: 'invalid',
        errors: ['Official identifier is required.'],
      },
    ],
  }
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname.replace('/api/v1', '')
    const reply = (data: unknown) =>
      route.fulfill({ json: { data, meta: { requestId: userId } } })
    const fail = (status: number, code: string, message: string) =>
      route.fulfill({ status, json: { error: { code, message }, requestId: userId } })
    if (path.endsWith('/csrf')) return reply({ csrfToken: 'csrf' })
    if (path === '/mentor/me' || path === '/auth/refresh')
      return fail(401, 'UNAUTHENTICATED', 'Sign in required.')
    if (path === '/auth/email')
      return reply({
        attemptId: userId,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      })
    if (path === '/auth/verify')
      return reply({
        accessToken: 'synthetic-test-only',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: userId,
          name: 'Operator',
          email: 'test@example.org',
          roles: [role],
          version: 1,
        },
      })
    if (path === '/judging/panels')
      return reply([
        {
          id: panelId,
          name: 'Panel A',
          leaderId: userId,
          judgeIds: [userId],
          version: 1,
        },
      ])
    if (path === '/judging/cycle')
      return reply({ id: previewId, version: 1, state: 'active' })
    if (path === '/judging/teams')
      return reply([
        {
          id: teamId,
          teamId,
          panelId,
          team,
          evaluationStatus: 'pending',
          participationStatus: 'active',
          hasHistory: false,
          flags: [],
          version: 1,
        },
      ])
    if (path === `/judging/teams/${teamId}/observations`)
      return reply(observation ? [observation] : [])
    if (path === '/teams') return reply([team])
    if (path === '/admin/users' || path === '/admin/mentor-codes') return reply([])
    if (req.method() !== 'GET') {
      writes.push({
        path,
        body: req.postDataJSON(),
        key: req.headers()['idempotency-key'],
      })
      if (path === `/judging/teams/${teamId}/observation`) {
        if (!failureUsed && failure !== 'none') {
          failureUsed = true
          if (failure === 'network') return route.abort('failed')
          observation = {
            id: observationId,
            authorId: userId,
            authorName: 'Operator',
            panelId,
            teamId,
            text: 'Saved in another tab',
            version: 2,
            updatedAt: new Date().toISOString(),
          }
          return fail(409, 'VERSION_CONFLICT', 'The observation changed.')
        }
        observation = {
          id: observationId,
          authorId: userId,
          authorName: 'Operator',
          panelId,
          teamId,
          text: String(req.postDataJSON().text),
          version: Number(req.postDataJSON().expectedVersion) + 1,
          updatedAt: new Date().toISOString(),
        }
        return reply({
          commandId: userId,
          entityId: observationId,
          resultingVersion: observation.version,
          outcome: 'updated',
          committedAt: new Date().toISOString(),
        })
      }
      if (path === '/imports/preview') return reply(preview)
      if (path === `/imports/${previewId}/commit`)
        return reply({
          ...preview,
          version: 2,
          rows: preview.rows.map((row) =>
            row.status === 'ready' ? { ...row, status: 'imported' } : row,
          ),
          results: [{ row: 1, status: 'imported' }],
          errors: [{ row: 2, message: 'Official identifier is required.' }],
        })
    }
    return fail(404, 'NOT_FOUND', `Unexpected fixture request: ${path}`)
  })
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Email address' }).fill('test@example.org')
  await page.getByRole('button', { name: 'Send sign-in email' }).click()
  await page.getByRole('textbox', { name: 'Email code' }).fill('123456')
  await page.getByRole('button', { name: 'Verify code' }).click()
  await expect(page.getByText('Welcome, Operator')).toBeVisible()
  return writes
}

async function openObservation(page: Page) {
  await page.getByRole('button', { name: 'Open judging' }).click()
  await page.getByRole('button', { name: 'Open Brazil', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Your observation' })).toBeVisible()
}

test('observation survives network failure, navigation cancellation, and manual retry', async ({
  page,
}) => {
  const writes = await fixture(page, 'judge', 'network')
  await openObservation(page)
  const draft = page.getByRole('textbox', { name: 'Your observation' })
  await draft.fill('Robot inspection draft')
  await page.getByRole('button', { name: 'Save observation', exact: true }).click()
  await expect(
    page.getByText(
      'Save was not confirmed. Your draft is retained. Retry manually to confirm the previous save.',
    ),
  ).toBeVisible()
  await expect(draft).toHaveValue('Robot inspection draft')
  expect(writes.filter((write) => write.path.endsWith('/observation'))).toHaveLength(1)
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.getByText('Unsaved observations', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(draft).toHaveValue('Robot inspection draft')
  await page.getByRole('button', { name: 'Retry previous save', exact: true }).click()
  await expect(
    page.getByText(
      'Unsaved changes. Keep this screen open until you save or discard them.',
    ),
  ).toHaveCount(0)
  const saved = writes.filter((write) => write.path.endsWith('/observation'))
  expect(saved).toHaveLength(2)
  expect(saved[0].key).toMatch(/^[a-f0-9-]{36}$/)
  expect(saved[1]).toEqual(saved[0])
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.getByText('Welcome, Operator')).toBeVisible()
})

test('version conflict retains author draft until current record is reviewed explicitly', async ({
  page,
}) => {
  const writes = await fixture(page, 'judge', 'conflict')
  await openObservation(page)
  const draft = page.getByRole('textbox', { name: 'Your observation' })
  await draft.fill('My retained text')
  await page.getByRole('button', { name: 'Save observation', exact: true }).click()
  await expect(
    page.getByText(
      'This team or observation changed. Your draft is retained. Review the current record before saving again.',
    ),
  ).toBeVisible()
  await expect(draft).toHaveValue('My retained text')
  await expect(
    page.getByRole('button', { name: 'Save observation', exact: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Review current record', exact: true }).click()
  await expect(page.getByText('Current saved observation', { exact: true })).toBeVisible()
  await expect(page.getByText('Saved in another tab', { exact: true })).toBeVisible()
  await expect(draft).toHaveValue('My retained text')
  await page.getByRole('button', { name: 'Save observation', exact: true }).click()
  await expect(
    page.getByText(
      'Unsaved changes. Keep this screen open until you save or discard them.',
    ),
  ).toHaveCount(0)
  const saved = writes.filter((write) => write.path.endsWith('/observation'))
  expect(saved).toHaveLength(2)
  expect(saved[0].body.expectedVersion).toBe(0)
  expect(saved[1].body.expectedVersion).toBe(2)
  expect(saved[1].key).not.toBe(saved[0].key)
})

test('import previews invalid rows and commits only ready rows after explicit confirmation', async ({
  page,
}) => {
  const writes = await fixture(page, 'admin')
  await page.getByRole('button', { name: 'Open administration' }).click()
  await page.getByRole('button', { name: 'Import teams', exact: true }).click()
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Choose file', exact: true }).click()
  await (
    await chooser
  ).setFiles({
    name: 'teams.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('id,name,country\n001,Brazil,BR\n,Missing identifier,BR\n'),
  })
  await page.getByRole('button', { name: 'Review preview', exact: true }).click()
  await expect(page.getByText(/1 ready of 2 rows/)).toBeVisible()
  await expect(
    page.getByText('Official identifier is required.', { exact: true }),
  ).toBeVisible()
  expect(writes.filter((write) => write.path.endsWith('/commit'))).toHaveLength(0)
  await page
    .getByRole('button', { name: 'Confirm and import valid rows', exact: true })
    .click()
  await expect(page.getByText('Import results', { exact: true })).toBeVisible()
  await expect(page.getByText(/Row 1: imported/)).toBeVisible()
  await expect(page.getByText(/Row 2: Official identifier is required/)).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Confirm and import valid rows', exact: true }),
  ).toBeDisabled()
  const preview = writes.find((write) => write.path === '/imports/preview')
  expect(preview?.body.mapping).toEqual({
    officialId: 'id',
    name: 'name',
    country: 'country',
  })
  expect(preview?.body.content).toContain('001,Brazil,BR')
  const commits = writes.filter((write) => write.path.endsWith('/commit'))
  expect(commits).toHaveLength(1)
  expect(commits[0].body).toEqual({ expectedVersion: 1 })
  expect(commits[0].key).toMatch(/^[a-f0-9-]{36}$/)
})
