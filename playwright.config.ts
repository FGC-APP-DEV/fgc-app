import { defineConfig } from '@playwright/test'
const device = { viewport: { width: 390, height: 844 }, channel: 'msedge' }
export default defineConfig({
  fullyParallel: false,
  workers: 1,
  use: { trace: 'retain-on-failure', ...device },
  projects: [
    // Browser flows against an intercepted, synthetic API.
    {
      name: 'contract',
      testDir: './apps/fgc-web/e2e',
      use: { baseURL: 'http://127.0.0.1:3000' },
    },
    // Real UI + real REST API + real SQL (in-memory PGlite), synthetic data.
    {
      name: 'fullstack',
      testDir: './apps/fgc-web/e2e-mock',
      use: { baseURL: 'http://127.0.0.1:3100' },
    },
  ],
  webServer: [
    {
      command: 'node scripts/serve-e2e.cjs',
      url: 'http://127.0.0.1:3000/health/e2e',
      reuseExistingServer: false,
    },
    {
      command: 'npx tsx apps/fgc-api/src/mock/main.ts',
      url: 'http://127.0.0.1:3100/health/live',
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        PORT: '3100',
        MOCK_STATIC_DIR: 'dist/apps/fgc-web',
        WEB_ORIGINS: 'http://127.0.0.1:3100',
      },
    },
  ],
  reporter: 'list',
})
