import { defineConfig } from 'tsdown';

export default defineConfig([
  // Node.js builds
  {
    entry: ['src/index.ts'],
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
  // Browser build
  {
    entry: ['src/index.ts'],
    format: 'iife',
    outDir: 'dist',
    globalName: 'AxiosSSE',
    target: 'ES2015',
    outExtensions() {
      return { js: '.browser.js' };
    },
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
