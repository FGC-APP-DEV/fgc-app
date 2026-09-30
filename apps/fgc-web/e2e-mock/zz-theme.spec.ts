import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test('switching the theme keeps the current screen and keeps table text readable', async ({
  page,
}) => {
  await signIn(page, 'admin@fgc.test')
  await page.getByRole('button', { name: 'Open administration' }).click()
  await page.getByRole('button', { name: 'Open Current users' }).click()
  const row = page.getByText('admin@fgc.test', { exact: true }).first()
  await expect(row).toBeVisible()

  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  // Still on the users table, not sent back to the home screen.
  await expect(page.getByRole('textbox', { name: 'Filter by email' })).toBeVisible()
  await expect(page.getByText('Welcome, ')).toHaveCount(0)
  const color = await page
    .getByText('admin@fgc.test', { exact: true })
    .first()
    .evaluate((el) => getComputedStyle(el).color)
  const [r, g, b] = color.match(/\d+/g)!.map(Number)
  // Light text on the dark surface.
  expect((r + g + b) / 3).toBeGreaterThan(150)

  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(page.getByRole('textbox', { name: 'Filter by email' })).toBeVisible()
})

test('on a narrow screen the table row itself opens the modal', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await signIn(page, 'admin@fgc.test')
  await page.getByRole('button', { name: 'Open administration' }).click()
  await page.getByRole('button', { name: 'Open Current users' }).click()
  await page.getByRole('button', { name: 'Actions for admin@fgc.test' }).click()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
})

test('on a wide screen each row has a visible dots button', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await signIn(page, 'admin@fgc.test')
  await page.getByRole('button', { name: 'Open administration' }).click()
  await page.getByRole('button', { name: 'Open Current users' }).click()
  const dots = page.getByRole('button', { name: 'Actions for admin@fgc.test' })
  await expect(dots).toBeVisible()
  const box = await dots.boundingBox()
  expect(box!.x + box!.width).toBeLessThanOrEqual(1280)
})
