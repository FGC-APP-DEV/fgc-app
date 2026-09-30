import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

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

test('admin and filming follow the chosen language', async ({ page }) => {
  await signIn(page, 'admin@fgc.test')
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('menuitem', { name: 'Español' }).click()
  await page.getByRole('button', { name: 'Abrir administración' }).click()
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()
  await page.getByRole('button', { name: 'Abrir Usuarios actuales' }).click()
  await expect(page.getByRole('textbox', { name: 'Filtrar por correo' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Página siguiente' })).toBeVisible()
  await page.getByRole('button', { name: 'Acciones para admin@fgc.test' }).click()
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()
})

test('judging follows the chosen language', async ({ page }) => {
  await signIn(page, 'ja@fgc.test')
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('menuitem', { name: 'Français' }).click()
  await page.getByRole('button', { name: 'Ouvrir le jugement' }).click()
  await expect(page.getByRole('button', { name: 'Clôture et audit' })).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'Rechercher des équipes de jugement' }),
  ).toBeVisible()
}).click()
  await expect(page.getByText('Configurer les panels')).toBeVisible()
})
