import { expect, test } from '@playwright/test'
import { signIn, signOut } from './helpers'

test.setTimeout(90_000)
test('filmmaker captures a shot, an admin issues a mentor code, the mentor answers a pager once', async ({
  browser,
}) => {
  const film = await (await browser.newContext()).newPage()
  await signIn(film, 'film@fgc.test', 'Fran Filmmaker')
  await film.getByRole('button', { name: 'Open filming' }).click()
  await film.getByRole('textbox', { name: 'Search teams or shots' }).fill('Ghana')
  await film.getByRole('button', { name: 'Update Team Ghana', exact: true }).click()
  await film.getByRole('textbox', { name: 'Shot notes' }).fill('Interview recorded')
  await film.getByRole('button', { name: 'Captured', exact: true }).last().click()
  await expect(film.getByText('captured', { exact: true }).first()).toBeVisible()

  const admin = await (await browser.newContext()).newPage()
  await signIn(admin, 'admin@fgc.test', 'Ada Admin')
  await admin.getByRole('button', { name: 'Open administration' }).click()
  await admin.getByRole('textbox', { name: 'Find team for mentor code' }).fill('Ghana')
  await admin.getByRole('button', { name: 'Issue code for Team Ghana' }).click()
  const notice = await admin.getByText(/Copy this code now/).innerText()
  const code = /shown only once\. Team Ghana: (\S+)/.exec(notice)?.[1]
  expect(code).toMatch(/^[A-F0-9]{12}$/)

  await film.getByRole('button', { name: 'Page Team Ghana', exact: true }).click()
  await film.getByRole('textbox', { name: /Message/ }).fill('Please come to the booth.')
  await film.getByRole('button', { name: 'Send message' }).click()

  const mentor = await (await browser.newContext()).newPage()
  await mentor.goto('/')
  await mentor.getByRole('button', { name: 'Mentor access', exact: true }).click()
  await mentor.getByRole('textbox', { name: 'Mentor access code' }).fill(code as string)
  await mentor.getByRole('button', { name: 'Open team messages' }).click()
  await expect(mentor.getByText('Please come to the booth.')).toBeVisible()
  await expect(mentor.getByText('captured', { exact: true }).first()).toBeVisible()
  const reply = mentor.getByRole('button', { name: /On our way/i })
  await reply.click()
  await expect(reply).toHaveCount(0)

  // Regenerating revokes the old code: the same mentor session is no longer valid.
  await admin.getByRole('button', { name: 'Regenerate code for Team Ghana' }).click()
  await admin.getByRole('button', { name: 'Confirm', exact: true }).click()
  await mentor.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(mentor.getByText('Please come to the booth.')).toHaveCount(0)
})

test('the seeded mentor code opens only its own team', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Mentor access', exact: true }).click()
  await page.getByRole('textbox', { name: 'Mentor access code' }).fill('MOCKMENTOR001')
  await page.getByRole('button', { name: 'Open team messages' }).click()
  await expect(
    page.getByText('Please come to the Step & Repeat backdrop now.'),
  ).toBeVisible()
  await expect(page.getByText('Judges are ready for your interview.')).toHaveCount(0)
})

test('an invalid mentor code gives a generic error', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Mentor access', exact: true }).click()
  await page.getByRole('textbox', { name: 'Mentor access code' }).fill('NOTACODE1234')
  await page.getByRole('button', { name: 'Open team messages' }).click()
  await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toHaveCount(0)
})

test('shot list: a filmmaker adds a category and item, completes and deletes it', async ({
  page,
}) => {
  await signIn(page, 'film@fgc.test')
  await page.getByRole('button', { name: 'Open filming' }).click()
  await page.getByRole('button', { name: 'Shot list', exact: true }).click()
  await page.getByRole('textbox', { name: 'Category name' }).fill('E2E category')
  await page.getByRole('button', { name: 'Add category', exact: true }).click()
  await page.getByRole('button', { name: 'E2E category', exact: true }).first().click()
  await page.getByRole('textbox', { name: 'Shot title' }).fill('E2E shot')
  await page.getByRole('button', { name: 'Add shot', exact: true }).click()
  await expect(page.getByText('E2E shot', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Delete E2E shot' }).click()
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(page.getByText('E2E shot', { exact: true })).toHaveCount(0)
  await signOut(page)
})
