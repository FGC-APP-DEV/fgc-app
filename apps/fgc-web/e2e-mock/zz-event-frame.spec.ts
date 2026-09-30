import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test('the home event frame always offers Reload and Open in browser below it', async ({
  page,
}) => {
  await signIn(page, 'film@fgc.test', 'Fran Filmmaker')
  await expect(page.getByText('Watch Live!')).toBeVisible()
  await expect(page.getByText('Page not loading? Open it in your browser.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible()

  await page
    .context()
    .route('https://first.global/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<title>Event</title>' }),
    )
  const popup = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Open in browser' }).click()
  expect((await popup).url()).toBe('https://first.global/event/')
  await expect(page.getByText('Welcome, Fran Filmmaker')).toBeVisible()
})
