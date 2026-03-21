import { playwright as playwrightProvider } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const root = new URL('.', import.meta.url).pathname;

export default defineConfig({
  test: {
    watch: false,
    globalSetup: './test/global-setup.ts',
    projects: [
      {
        resolve: {
          alias: { 'axios-sse': `${root}dist/node.mjs` },
        },
        test: {
          name: 'node',
          environment: 'node',
          include: ['test/node.test.ts'],
        },
      },
      {
        resolve: {
          alias: { 'axios-sse': `${root}dist/browser.mjs` },
        },
        test: {
          name: 'browser',
          include: ['test/browser.test.ts'],
          browser: {
            enabled: true,
            provider: playwrightProvider(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
