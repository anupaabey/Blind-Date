import { defineConfig } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import { existsSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    headless: true,
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: await chromium.executablePath(),
      args: chromium.args.filter((x) => x !== '--single-process'),
      env: {
        ...(Object.fromEntries(
          Object.entries(process.env).filter(
            ([key]) => !/(SUPABASE|PAYHERE|RESEND|CRON)/.test(key),
          ),
        ) as Record<string, string>),
        XDG_CACHE_HOME: '/workspace/.cache/browser',
      },
    },
  },
  webServer: {
    command: process.env.E2E_SERVER_COMMAND ?? 'npm run dev',
    url: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
  reporter: 'list',
});
