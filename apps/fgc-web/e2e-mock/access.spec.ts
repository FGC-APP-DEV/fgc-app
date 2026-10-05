import { expect, test } from '@playwright/test'
import { signIn, signOut } from './helpers'

test('an administrator approves a filmmaker who then completes the profile and sees Filming only', async ({
  page,
}) => {
  await signIn(page, 'admin@fgc.test', 'Ada Admin')
  await page.getByRole('button', { name: 'Open administration' }).click()
  await page.getByRole('button', { name: 'Open Approve staff access' }).click()
  await page
    .getByRole('textbox', { name: 'Access list (CSV: email, roles)' })
    .fill('e2e-newcomer@fgc.test, filmmaker')
  await page.getByRole('button', { name: 'Save access', exact: true }).click()
  await expect(page.getByText(/e2e-newcomer@fgc.test: Access added/)).toBeVisible()
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await signOut(page)

  await signIn(page, 'e2e-newcomer@fgc.test')
  await page.getByRole('textbox', { name: 'Full name' }).fill('Nia Newcomer')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Welcome, Nia Newcomer')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open filming' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open judging' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open administration' })).toHaveCount(0)
})

test('an email that was never approved cannot open the app', async ({ page }) => {
  await signIn(page, 'stranger@fgc.test')
  await expect(page.getByRole('button', { name: 'Open filming' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Send sign-in email' })).toBeVisible()
  // A specific message, not the generic "authentication unavailable".
  await expect(page.getByText(/not registered in the system/i)).toBeVisible()
  await expect(page.getByText(/temporarily unavailable/i)).toHaveCount(0)
})

test('a wrong email code is rejected', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('textbox', { name: 'Email or mentor access code' })
    .fill('film@fgc.test')
  await page.getByRole('button', { name: 'Send sign-in email' }).click()
  await page.getByRole('textbox', { name: 'Email code' }).fill('000000')
  await page.getByRole('button', { name: 'Verify code' }).click()
  await expect(page.getByRole('button', { name: 'Open filming' })).toHaveCount(0)
})

test('admin plus Judging roles never reach Judging', async ({ page }) => {
  await signIn(page, 'admin-judge@fgc.test', 'Alex Both')
  await expect(page.getByRole('button', { name: 'Open administration' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open judging' })).toHaveCount(0)
})

test('Useful resources opens a dropdown of links without leaving the app', async ({
  page,
}) => {
  await signIn(page, 'film@fgc.test', 'Fran Filmmaker')
  const nav = page
    .getByRole('navigation', { name: 'Workspaces' })
    .getByRole('button', { name: 'Useful resources' })
  await expect(nav).toBeVisible()
  await nav.click()
  await expect(page.getByRole('link', { name: 'Event information' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Live streams' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Results' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Robot kit' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Get help from Bob' })).toBeVisible()

  await page
    .context()
    .route('https://first.global/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<title>Event</title>' }),
    )
  const popup = page.waitForEvent('popup')
  await page.getByRole('link', { name: 'Live streams' }).click()
  expect((await popup).url()).toBe('https://first.global/live/')
  await expect(page.getByText('Welcome, Fran Filmmaker')).toBeVisible()
})

test('an administrator adds staff from CSV, then filters users and edits or removes a role in the modal', async ({
  page,
}) => {
  await signIn(page, 'admin@fgc.test')
  await page.getByRole('button', { name: 'Open administration' }).click()
  await page.getByRole('button', { name: 'Open Approve staff access' }).click()
  await page
    .getByRole('textbox', { name: 'Access list (CSV: email, roles)' })
    .fill('bulk1@fgc.test, filmmaker\nbulk2@fgc.test, [filmmaker]')
  await page.getByRole('button', { name: 'Save access', exact: true }).click()
  await expect(page.getByText(/bulk2@fgc.test: Access added/)).toBeVisible()

  await page.getByRole('button', { name: 'Back to Administration' }).click()
  await page.getByRole('button', { name: 'Open Current users' }).click()
  await page.getByRole('textbox', { name: 'Filter by email' }).fill('bulk')
  await expect(page.getByText('ja@fgc.test')).toHaveCount(0)
  await expect(page.getByText('bulk1@fgc.test')).toBeVisible()

  await page.getByRole('button', { name: 'Actions for bulk1@fgc.test' }).click()
  await page.getByRole('checkbox', { name: 'filmmaker', exact: true }).click()
  await page.getByRole('checkbox', { name: 'judge', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(page.getByText('bulk1@fgc.test: Roles updated')).toBeVisible()

  // Closing the modal discards unsaved edits.
  await page.getByRole('button', { name: 'Actions for bulk2@fgc.test' }).click()
  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Actions for bulk2@fgc.test' }).click()
  await page.getByRole('checkbox', { name: 'Remove all access' }).click()
  await page.getByRole('button', { name: 'Remove access', exact: true }).click()
  await expect(page.getByText('bulk2@fgc.test: Access removed')).toBeVisible()
})
