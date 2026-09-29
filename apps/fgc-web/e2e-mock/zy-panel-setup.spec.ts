import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

// Runs after the other judging specs (file order) because distributing judges
// reshuffles panel membership for the whole shared mock database.
test.setTimeout(120_000)

test('a judge advisor sets conflicts, creates a panel and distributes judges away from conflicts', async ({
  page,
}) => {
  await signIn(page, 'ja@fgc.test')
  await page.getByRole('button', { name: 'Open judging' }).click()

  // Conflicts are entered on the Judges sheet.
  await page.getByRole('button', { name: 'Judges', exact: true }).click()
  const cell = page.getByRole('textbox', { name: 'Conflict for Jules Judge' })
  await cell.fill('BRA')
  const save = page.getByRole('button', { name: 'Save conflict for Jules Judge' })
  await save.click()
  await expect(cell).toHaveValue('BRA')
  await expect(save).toBeDisabled()

  // A panel is created empty (no leader), then judges are distributed.
  await page.getByRole('button', { name: 'Panels', exact: true }).click()
  await page.getByRole('textbox', { name: 'Number of panels' }).fill('1')
  await page.getByRole('button', { name: 'Create panels', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Panel 4' })).toBeVisible()
  await expect(page.getByText('Leader: Not set').first()).toBeVisible()
  await page.getByRole('button', { name: 'Distribute judges', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Panel 4' })).toBeVisible()

  // Panel A holds Brazil, so the judge with a BRA conflict is no longer on it.
  await page.getByRole('button', { name: 'Open Panel A', exact: true }).click()
  await expect(page.getByRole('button', { name: /Selected Jules Judge/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Back to panels' }).click()
  await expect(page.getByRole('heading', { name: 'Panel 4' })).toBeVisible()
})
