import { expect, test } from '@playwright/test'
import { signIn, signOut } from './helpers'

test('an administrator approves a filmmaker who then completes the profile and sees Filming only', async ({
  page,
}) => {
  await signIn(page, 'admin@fgc.test', 'Ada Admin')
  await page.getByRole('button', { name: 'Open administration' }).click()
  await page
    .getByRole('textbox', { name: 'Email addresses (comma or line separated)' })
    .fill('e2e-newcomer@fgc.test')
  await page.getByRole('button', { name: 'filmmaker', exact: true }).click()
  await page.getByRole('button', { name: 'Save access', exact: true }).click()
  await expect(page.getByText('e2e-newcomer@fgc.test · filmmaker')).toBeVisible()
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
})

test('a wrong email code is rejected', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Email address' }).fill('film@fgc.test')
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

test('the official schedule link is shown when configured', async ({ page }) => {
  await signIn(page, 'film@fgc.test', 'Fran Filmmaker')
  await expect(page.getByText('Official schedule')).toBeVisible()
})

test('an administrator searches users and replaces the roles of a selection in one save', async ({
  page,
}) => {
  await signIn(page, 'admin@fgc.test')
  await page.getByRole('button', { name: 'Open administration' }).click()
  await page
    .getByRole('textbox', { name: 'Email addresses (comma or line separated)' })
    .fill('bulk1@fgc.test, bulk2@fgc.test')
  await page.getByRole('button', { name: 'filmmaker', exact: true }).click()
  await page.getByRole('button', { name: 'Save access', exact: true }).click()
  await expect(page.getByText('bulk1@fgc.test · filmmaker')).toBeVisible()

  await page.getByRole('textbox', { name: 'Search users' }).fill('bulk')
  await expect(page.getByText('ja@fgc.test')).toHaveCount(0)
  await page.getByRole('button', { name: 'Select all shown' }).click()
  await page.getByRole('button', { name: 'Edit 2 selected' }).click()
  await page.getByRole('button', { name: 'Replace roles', exact: true }).click()
  await page.getByRole('button', { name: 'judge', exact: true }).click()
  await page.getByRole('button', { name: 'Save access', exact: true }).click()
  await expect(page.getByText('bulk1@fgc.test · judge', { exact: true })).toBeVisible()
  await expect(page.getByText('bulk2@fgc.test · judge', { exact: true })).toBeVisible()
})
