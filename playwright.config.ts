import { defineConfig, devices } from '@playwright/test';

const HOST = '127.0.0.1';
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;

// The central CI runs `vite build` before `playwright test`, so the e2e suite
// exercises the real production bundle via `vite preview`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list']] : [['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  // Only Chromium: CI installs `playwright install --with-deps chromium`.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // --host is pinned so the server binds to the same interface the tests poll.
    // Without it Vite binds to whatever `localhost` resolves to, which is ::1
    // first on GitHub-hosted runners, and the 127.0.0.1 health check times out.
    command: `npm run preview -- --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Surface the server's own output so a startup failure is not just a timeout.
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
