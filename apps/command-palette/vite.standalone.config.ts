import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'node:path';

// Builds command-palette as a self-contained IIFE for embedding in legacy AngularJS
// pages via one <script> tag, isolated from those pages' own React 16 setup.
// See docs/command-palette-angular-integration.md.
export default defineConfig(() => {
  // Trailing slash required — @bahmni/services' BASE_PATH concatenates directly.
  const publicPath = process.env.PUBLIC_PATH || '/bahmni-v2/';

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/command-palette-standalone',
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      // Without this, process.env.PUBLIC_URL throws ReferenceError in a plain browser page.
      'process.env.PUBLIC_URL': JSON.stringify(publicPath),
    },
    resolve: {
      alias: [
        {
          find: /^virtual:command-palette-styles/,
          replacement: path.resolve(
            __dirname,
            '../../packages/bahmni-widgets/src/commandPalette/styles/CommandPalette.module.scss',
          ),
        },
        {
          find: '@bahmni/widgets',
          replacement: path.resolve(
            __dirname,
            '../../packages/bahmni-widgets/src/commandPalette/index.ts',
          ),
        },
      ],
    },
    build: {
      outDir: './dist-standalone',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      lib: {
        entry: 'src/standalone.tsx',
        name: 'BahmniCommandPalette',
        fileName: () => 'command-palette.js',
        formats: ['iife' as const],
      },
    },
  };
});
