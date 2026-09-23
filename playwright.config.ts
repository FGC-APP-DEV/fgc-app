import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './apps/fgc-web/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    channel: 'msedge',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-e2e.cjs',
    url: 'http://127.0.0.1:3000/health/e2e',
    reuseExistingServer: false,
  },
  reporter: 'list',
})
