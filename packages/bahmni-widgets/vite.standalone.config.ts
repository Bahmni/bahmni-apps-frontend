import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Standalone IIFE build for legacy Angular pages.
// Outputs command-palette.js + command-palette.css to dist-standalone/.
// The distro webpack copies those files to its output so they are served at /bahmni-new/.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'dist-standalone'),
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: resolve(__dirname, 'src/commandPalette/standalone.ts'),
      name: 'BahmniCommandPalette',
      formats: ['iife'],
    },
    rollupOptions: {
      // Bundle everything including React 18 — legacy pages run React 16
      // and cannot share the same React instance with cmdk (which requires React 18).
      external: [],
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'command-palette.js',
        assetFileNames: 'command-palette.css',
        // Inject a minimal process shim inside the IIFE so legacy Angular pages
        // (which have no process global) don't throw ReferenceError when
        // @bahmni/services references process.env.PUBLIC_URL or React references
        // process.env.NODE_ENV / process.nextTick.
        intro: [
          'var process = {',
          '  env: { NODE_ENV: "production", PUBLIC_URL: "/" },',
          '  nextTick: function(fn) { return setTimeout(fn, 0); },',
          '  emit: function() {},',
          '};',
        ].join('\n'),
      },
    },
    cssCodeSplit: false,
  },
});
