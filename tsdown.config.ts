import { defineConfig } from 'tsdown';

export default defineConfig([
  // Node.js build (ESM + CJS)
  {
    entry: { node: 'src/node.ts' },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    minify: true,
    sourcemap: true,
    clean: true,
    dts: true,
    outputOptions: {
      exports: 'named',
    },
    deps: {
      neverBundle: ['axios'],
    },
    outExtensions({ format }) {
      return { js: `.${format === 'es' ? 'mjs' : 'cjs'}` };
    },
  },
  // Browser ESM + CJS build (for bundlers / Vitest browser)
  {
    entry: { browser: 'src/browser.ts' },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    minify: true,
    sourcemap: true,
    dts: true,
    platform: 'browser',
    deps: {
      neverBundle: ['axios'],
    },
    outputOptions: {
      exports: 'named',
    },
    outExtensions({ format }) {
      return { js: `.${format === 'es' ? 'mjs' : 'cjs'}` };
    },
  },
  // Browser IIFE build (CDN / unpkg)
  {
    entry: { browser: 'src/browser.ts' },
    format: 'iife',
    outDir: 'dist',
    globalName: 'AxiosSSE',
    target: 'ES2015',
    minify: true,
    sourcemap: true,
    platform: 'browser',
    deps: {
      neverBundle: ['axios'],
    },
    outputOptions: {
      globals: {
        axios: 'window.axios',
      },
      exports: 'named',
    },
    footer: {
      js: 'if (typeof AxiosSSE === "object" && AxiosSSE.default) { AxiosSSE = AxiosSSE.default; }',
    },
  },
]);
