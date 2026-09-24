import { expect, test, type Page } from '@playwright/test'
import { signIn } from './helpers'

async function openImport(page: Page, csv: string) {
  await signIn(page, 'admin@fgc.test')
  await page.getByRole('button', { name: 'Open administration' }).click()
  await page.getByRole('button', { name: 'Import teams', exact: true }).click()
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Choose file', exact: true }).click()
  await (
    await chooser
  ).setFiles({ name: 'teams.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await page.getByRole('button', { name: 'Review preview', exact: true }).click()
}

test('a CSV import previews errors and commits only the valid rows', async ({ page }) => {
  await openImport(
    page,
    'id,name,country\n901,Team Peru,PE\n,Missing identifier,BR\n902,Team Chile Two,CL\n',
  )
  await expect(page.getByText(/2 ready of 3 rows/)).toBeVisible()
  await expect(
    page.getByText('Official identifier is required (maximum 2,000 characters).', {
      exact: true,
    }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Confirm and import valid rows', exact: true })
    .click()
  await expect(page.getByText('Import results', { exact: true })).toBeVisible()
  await expect(page.getByText(/Row 1: imported/)).toBeVisible()
  await expect(page.getByText(/Row 3: imported/)).toBeVisible()
  await expect(page.getByText(/Row 2/)).toHaveCount(0)
})

test('re-importing an existing team never overwrites it', async ({ page }) => {
  await openImport(page, 'id,name,country\n001,Renamed Brazil,BR\n')
  await page
    .getByRole('button', { name: 'Confirm and import valid rows', exact: true })
    .click()
  await expect(page.getByText(/Row 1: existing/)).toBeVisible()
  await page.getByRole('button', { name: 'Back to administration' }).click()
  await page.getByRole('textbox', { name: 'Find team for mentor code' }).fill('Brazil')
  await expect(page.getByText('Team Brazil', { exact: true })).toBeVisible()
  await expect(page.getByText('Renamed Brazil')).toHaveCount(0)
})
