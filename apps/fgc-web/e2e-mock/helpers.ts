import { expect, type Page } from '@playwright/test'

/** Sign in through the real email-code form. The mock API accepts 123456 for every address. */
export async function signIn(page: Page, email: string, name?: string) {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Email address' }).fill(email)
  await page.getByRole('button', { name: 'Send sign-in email' }).click()
  await page.getByRole('textbox', { name: 'Email code' }).fill('123456')
  await page.getByRole('button', { name: 'Verify code' }).click()
  if (name) await expect(page.getByText(`Welcome, ${name}`)).toBeVisible()
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('button', { name: 'Send sign-in email' })).toBeVisible()
}
