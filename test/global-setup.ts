import type { TestProject } from 'vitest/node';
import { execSync } from 'node:child_process';
import { TestSSEServer } from './server';

let server: TestSSEServer;

/** Start the shared SSE server before any test project runs. */
export async function setup({ provide }: TestProject) {
  execSync('pnpm run build', { stdio: 'inherit' });
  server = new TestSSEServer();
  const baseUrl = await server.start();
  // Make baseUrl available to both Node and browser test environments
  provide('baseUrl', baseUrl);
}

/** Stop the server after all test projects finish. */
export async function teardown() {
  await server.stop();
}

declare module 'vitest' {
  export interface ProvidedContext {
    baseUrl: string;
  }
}
