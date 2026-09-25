import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test.setTimeout(90_000)

test('a judge advisor creates a panel with a leader from judges who have none', async ({
  page,
}) => {
  await signIn(page, 'ja@fgc.test')
  await page.getByRole('button', { name: 'Open judging' }).click()
  await page.getByRole('button', { name: 'Panels', exact: true }).click()
  await page.getByRole('button', { name: 'New panel', exact: true }).click()
  await page.getByRole('textbox', { name: 'Panel name' }).fill('Panel C')
  // Judges already on a panel are not offered again.
  await expect(page.getByRole('button', { name: /Select Jo Judge/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Select Max Multi', exact: true }).click()
  await page.getByRole('button', { name: 'Make leader: Max Multi' }).click()
  await page.getByRole('button', { name: 'Create panel', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Panel C', exact: true })).toBeVisible()
})

test('an advisor withdraws a team with a reason, then reactivates it', async ({
  page,
}) => {
  await signIn(page, 'ja@fgc.test')
  await page.getByRole('button', { name: 'Open judging' }).click()
  await page.getByRole('button', { name: 'Open Team Germany', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Reason for withdrawal or other flag' })
    .fill('Team left the event')
  await page.getByRole('button', { name: 'Withdraw team' }).click()
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Reactivate team' })).toBeVisible()
  await page.getByRole('button', { name: 'Reactivate team' }).click()
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Withdraw team' })).toBeVisible()
  await page.getByRole('button', { name: 'Flag online' }).click()
  await expect(page.getByRole('button', { name: 'Clear online' })).toBeVisible()
})

test('a scheduled pager stays hidden from the mentor until it is due', async ({
  browser,
}) => {
  const film = await (await browser.newContext()).newPage()
  await signIn(film, 'film@fgc.test')
  await film.getByRole('button', { name: 'Open filming' }).click()
  await film.getByRole('button', { name: 'Page Team Spain', exact: true }).click()
  await film
    .getByRole('textbox', { name: /Message/ })
    .fill('Scheduled interview in an hour.')
  await film.getByRole('button', { name: 'In 60 min', exact: true }).click()
  await film.getByRole('button', { name: 'Send message' }).click()
  await expect(film.getByText('Scheduled', { exact: true }).first()).toBeVisible()

  const admin = await (await browser.newContext()).newPage()
  await signIn(admin, 'admin@fgc.test')
  await admin.getByRole('button', { name: 'Open administration' }).click()
  await admin.getByRole('textbox', { name: 'Find team for mentor code' }).fill('Spain')
  await admin.getByRole('button', { name: 'Issue code for Team Spain' }).click()
  const code = /Team Spain: (\S+)/.exec(
    await admin.getByText(/Copy this code now/).innerText(),
  )?.[1]
  const mentor = await (await browser.newContext()).newPage()
  await mentor.goto('/')
  await mentor.getByRole('button', { name: 'Mentor access', exact: true }).click()
  await mentor.getByRole('textbox', { name: 'Mentor access code' }).fill(code as string)
  await mentor.getByRole('button', { name: 'Open team messages' }).click()
  await expect(mentor.getByRole('button', { name: 'Refresh', exact: true })).toBeVisible()
  await expect(mentor.getByText('Scheduled interview in an hour.')).toHaveCount(0)
})

test('features excluded from the MVP have no operational route or launcher entry', async ({
  page,
}) => {
  await signIn(page, 'admin@fgc.test')
  for (const path of [
    '/api/v1/announcements',
    '/api/v1/pit-admin',
    '/api/v1/judging/round2',
    '/api/v1/judging/distribute',
    '/api/v1/judging/awards',
  ])
    expect((await page.request.get(path)).status(), path).toBe(404)
  await expect(page.getByText(/Pit Admin|Announcement|Production/i)).toHaveCount(0)
})
