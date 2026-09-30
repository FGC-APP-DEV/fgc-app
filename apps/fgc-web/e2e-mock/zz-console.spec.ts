import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

// The session probes before login legitimately answer 401; the browser logs those itself.
const expected = (text: string) =>
  text.includes('Failed to load resource') && text.includes('401')

test('login, home and the admin pages leave the browser console clean', async ({
  page,
}) => {
  const problems: string[] = []
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type()) && !expected(message.text()))
      problems.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  await signIn(page, 'admin@fgc.test')
  await expect(page.getByRole('button', { name: 'Open administration' })).toBeVisible()
  await page.getByRole('button', { name: 'Open administration' }).click()
  await page.getByRole('button', { name: 'Open Current users' }).click()
  await expect(page.getByRole('textbox', { name: 'Filter by email' })).toBeVisible()
  await page.getByRole('button', { name: 'Home' }).click()
  expect(problems).toEqual([])
})
