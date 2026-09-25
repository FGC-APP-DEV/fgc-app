import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

// Runs last: closing Judging clears the shared in-memory cycle for every later test.
test.setTimeout(90_000)
test('closing Judging needs two confirmations, empties dashboards and leaves Filming intact', async ({
  browser,
}) => {
  const ja = await (await browser.newContext()).newPage()
  await signIn(ja, 'ja@fgc.test')
  await ja.getByRole('button', { name: 'Open judging' }).click()
  await ja.getByRole('button', { name: 'Close & audit', exact: true }).click()
  await ja.getByRole('button', { name: 'Begin closure' }).click()
  await ja.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(ja.getByText('Final confirmation: close Judging now?')).toBeVisible()
  // The tap is ignored (dialog stays open) until the first step finishes refreshing.
  await expect(async () => {
    await ja
      .getByRole('button', { name: 'Confirm', exact: true })
      .click({ timeout: 1000 })
    await expect(ja.getByText('Final confirmation: close Judging now?')).toHaveCount(0, {
      timeout: 1000,
    })
  }).toPass()
  await ja.getByRole('button', { name: 'Load temporary audit' }).click()
  await expect(ja.getByText(/Disposal deadline/)).toBeVisible()

  const film = await (await browser.newContext()).newPage()
  await signIn(film, 'film@fgc.test', 'Fran Filmmaker')
  await film.getByRole('button', { name: 'Open filming' }).click()
  await expect(
    film.getByRole('button', { name: 'Update Team Brazil', exact: true }),
  ).toBeVisible()
})
