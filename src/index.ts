// Environment-specific implementation
// Bundlers that support the "browser" field in package.json will resolve to browser.ts.
// Node.js (and bundlers without browser overrides) will use node.ts.
export { AxiosSSE } from './node';
export { default } from './node';
// Re-export shared types
export type { BeforeRequestHook, SSEConfig, SSEMessage } from './shared';
