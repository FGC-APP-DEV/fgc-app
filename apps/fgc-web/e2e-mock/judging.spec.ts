import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test.setTimeout(90_000)

test('a judge saves an observation on a panel team and can read it back after a reload', async ({
  page,
}) => {
  await signIn(page, 'judge2@fgc.test', 'Jules Judge')
  await page.getByRole('button', { name: 'Open judging' }).click()
  await page.getByRole('button', { name: 'Open Team Kenya', exact: true }).click()
  const editor = page.getByRole('textbox', { name: 'Your observation' })
  await editor.fill('Kenya: excellent teamwork under pressure.')
  await page.getByRole('button', { name: 'Save observation', exact: true }).click()
  await expect(page.getByText('Kenya: excellent teamwork under pressure.')).toBeVisible()
  await page.getByRole('button', { name: 'Back to teams' }).click()
  await page.getByRole('button', { name: 'Open Team Kenya', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Your observation' })).toHaveValue(
    'Kenya: excellent teamwork under pressure.',
  )
})

test('judges only see the teams of their own panel', async ({ page }) => {
  await signIn(page, 'judge3@fgc.test', 'Jin Judge')
  await page.getByRole('button', { name: 'Open judging' }).click()
  await expect(
    page.getByRole('button', { name: 'Open Team Mexico', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Open Team Brazil', exact: true }),
  ).toHaveCount(0)
})

test('only the panel leader can complete an evaluation, with a confirmation', async ({
  browser,
}) => {
  const member = await (await browser.newContext()).newPage()
  await signIn(member, 'judge2@fgc.test')
  await member.getByRole('button', { name: 'Open judging' }).click()
  await member.getByRole('button', { name: 'Open Team Japan', exact: true }).click()
  await expect(member.getByRole('button', { name: 'Complete evaluation' })).toHaveCount(0)

  const leader = await (await browser.newContext()).newPage()
  await signIn(leader, 'judge1@fgc.test')
  await leader.getByRole('button', { name: 'Open judging' }).click()
  await leader.getByRole('button', { name: 'Open Team Japan', exact: true }).click()
  await leader.getByRole('button', { name: 'Complete evaluation' }).click()
  await leader.getByRole('button', { name: 'Confirm', exact: true }).click()
  await leader.getByRole('button', { name: 'Back to teams' }).click()
  await expect(leader.getByText(/1 of \d+ active teams evaluated/)).toBeVisible()
})

test('a judge advisor sees both panels and the closure tab; a judge does not', async ({
  browser,
}) => {
  const ja = await (await browser.newContext()).newPage()
  await signIn(ja, 'ja@fgc.test')
  await ja.getByRole('button', { name: 'Open judging' }).click()
  await ja.getByRole('button', { name: 'Panels', exact: true }).click()
  await expect(ja.getByText('Panel A')).toBeVisible()
  await expect(ja.getByText('Panel B')).toBeVisible()
  await expect(ja.getByRole('button', { name: 'Close & audit' })).toBeVisible()

  const judge = await (await browser.newContext()).newPage()
  await signIn(judge, 'judge4@fgc.test')
  await judge.getByRole('button', { name: 'Open judging' }).click()
  await expect(judge.getByRole('button', { name: 'Close & audit' })).toHaveCount(0)
})
