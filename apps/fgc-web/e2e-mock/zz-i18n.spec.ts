import { expect, test } from '@playwright/test'

test('the login screen has a language menu and the screens follow the chosen language', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByText('Welcome to FGC-Ops')).toBeVisible()
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('menuitem', { name: 'Français' }).click()
  await expect(page.getByText('Bienvenue dans FGC-Ops')).toBeVisible()
  await page
    .getByRole('textbox', { name: 'E-mail ou code d’accès mentor' })
    .fill('x@y.test')
  await expect(
    page.getByRole('button', { name: 'Envoyer l’e-mail de connexion' }),
  ).toBeEnabled()
})
