import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests only. Playwright specs live in e2e/ and are run by
    // `playwright test`, so they must not be picked up here.
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
