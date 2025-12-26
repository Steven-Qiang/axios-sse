import { defineConfig } from 'tsup';

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
    external: ['axios'],
    outExtension({ format }) {
      return { js: `.${format === 'esm' ? 'mjs' : 'js'}` };
    },
  },
  // Browser build
  {
    entry: ['src/browser.ts'],
    format: ['iife'],
    outDir: 'dist',
    globalName: 'AxiosSSE',
    minify: true,
    sourcemap: true,
    platform: 'browser',
    footer: {
      js: 'if (typeof AxiosSSE === "object" && AxiosSSE.default) { AxiosSSE = AxiosSSE.default; }',
    },
    outExtension() {
      return { js: '.browser.js' };
    },
  },
]);
