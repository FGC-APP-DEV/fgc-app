import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test('a registered person without a role sees only home and useful resources', async ({
  page,
}) => {
  await signIn(page, 'norole@fgc.test', 'Nico NoRole')
  await expect(
    page.getByText('Your email is verified. Ask an administrator to enable access.'),
  ).toBeVisible()
  for (const name of [
    'Open administration',
    'Open judging',
    'Open filming',
    'Open referee notes',
  ])
    await expect(page.getByRole('button', { name })).toHaveCount(0)
  const nav = page.getByRole('navigation', { name: 'Workspaces' })
  await expect(nav.getByRole('button', { name: 'Useful resources' })).toBeVisible()
  await nav.getByRole('button', { name: 'Useful resources' }).click()
  await expect(page.getByRole('link', { name: 'Get help from Bob' })).toBeVisible()
})

test('the head referee reads every annotation and writes refs notes the judges can read', async ({
  page,
}) => {
  await signIn(page, 'referee@fgc.test', 'Riley Referee')
  await expect(page.getByRole('button', { name: 'Open judging' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Open referee notes' }).click()
  await expect(
    page.getByText('Type a country, team or panel to list teams.'),
  ).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Search by country, team or panel' })
    .fill('Team Kenya')
  await page
    .getByRole('textbox', { name: 'Your refs note' })
    .first()
    .fill('Check the robot weight.')
  await page.getByRole('button', { name: 'Save refs note' }).first().click()
  await expect(page.getByText('Refs note saved')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Delete refs note' }).first(),
  ).toBeVisible()
})

test('judges see the refs notes of their panel team and cannot reach the referee page', async ({
  page,
}) => {
  await signIn(page, 'judge2@fgc.test', 'Jules Judge')
  await expect(page.getByRole('button', { name: 'Open referee notes' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Open judging' }).click()
  await page.getByRole('button', { name: 'Open Team Kenya', exact: true }).click()
  await expect(page.getByText('Check the robot weight.')).toBeVisible()
})
