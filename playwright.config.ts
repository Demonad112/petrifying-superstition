import { defineConfig, devices } from '@playwright/test';

// Avoids a dependency on @types/node for one env lookup.
declare const process: { env: Record<string, string | undefined> };

export const SUBPATH = '/petrifying-superstition/';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4173', ...devices['Desktop Chrome'] },
  webServer: [
    {
      command: 'npm run preview',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
    },
    {
      // The same dist/ served under a subpath, like GitHub Pages (/<repo>/), to prove base './' works.
      command: `npx vite preview --port 4174 --strictPort --base ${SUBPATH}`,
      url: `http://localhost:4174${SUBPATH}`,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
    },
  ],
});
