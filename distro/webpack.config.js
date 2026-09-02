const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { NxReactWebpackPlugin } = require('@nx/react/webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const { join } = require('path');

module.exports = (env, argv) => {
  //TODO to read this from docker compose
  //TODO should we hardcode?
  const publicPath = env.PUBLIC_PATH || process.env.PUBLIC_PATH || '/bahmni-v2/';
  const isDevelopment = argv.mode !== 'production';

  return {
    output: {
      path: join(__dirname, 'dist'),
      publicPath: publicPath,
      clean: true,
    },
    resolve: {
      alias: isDevelopment ? {
        '@bahmni/home-app': join(__dirname, '../apps/home/src'),
        '@bahmni/clinical-app': join(__dirname, '../apps/clinical/src'),
        '@bahmni/registration-app': join(__dirname, '../apps/registration/src'),
        '@bahmni/appointments-app': join(__dirname, '../apps/appointments/src'),
        '@bahmni/command-palette-app': join(__dirname, '../apps/command-palette/src'),
        '@bahmni/patient-documents-app': join(__dirname, '../apps/patient-documents/src'),
      } : {},
    },
    devServer: {
      port: 3000,
      historyApiFallback: {
        index: '/bahmni-v2/index.html',
        disableDotRule: true,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
      },
      proxy: [
        {
          context: (pathname) => !pathname.startsWith(publicPath),
          target: 'https://localhost/',
          changeOrigin: true,
          secure: false,
          logLevel: 'debug',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PUBLIC_URL': JSON.stringify(publicPath),
        'process.env.PUBLIC_PATH': JSON.stringify(publicPath),
      }),
      new NxAppWebpackPlugin({
        tsConfig: './tsconfig.app.json',
        compiler: 'babel',
        main: './src/main.tsx',
        index: './src/index.html',
        baseHref: publicPath,
        assets: [
          './src/assets',
          { input: isDevelopment ? '../apps/home/public/locales' : '../apps/home/dist/locales', glob: '**/*', output: 'home/locales' },
          { input: isDevelopment ? '../apps/clinical/public/locales' : '../apps/clinical/dist/locales', glob: '**/*', output: 'clinical/locales' },
          { input: isDevelopment ? '../apps/registration/public/locales' : '../apps/registration/dist/locales', glob: '**/*', output: 'registration/locales' },
          { input: isDevelopment ? '../apps/appointments/public/locales' : '../apps/appointments/dist/locales', glob: '**/*', output: 'appointments/locales' },
          { input: isDevelopment ? '../apps/command-palette/public/locales' : '../apps/command-palette/dist/locales', glob: '**/*', output: 'command-palette/locales' },
          { input: isDevelopment ? '../apps/patient-documents/public/locales' : '../apps/patient-documents/dist/locales', glob: '**/*', output: 'document-upload/locales' },
        ],
        styles: ['./src/styles.scss'],
        outputHashing:
          process.env['NODE_ENV'] === 'production' ? 'all' : 'none',
        optimization: process.env['NODE_ENV'] === 'production',
      }),
      new NxReactWebpackPlugin({
        // Uncomment this line if you don't want to use SVGR
        // See: https://react-svgr.com/
        // svgr: false
      }),
      // info: { minimized: true } stops TerserPlugin from re-processing (and corrupting)
      // this already-minified bundle. See docs/command-palette-angular-integration.md.
      new CopyWebpackPlugin({
        patterns: [
          {
            context: join(__dirname, '../apps/command-palette/dist-standalone'),
            from: 'command-palette.js',
            to: '.',
            info: { minimized: true },
          },
        ],
      }),
      ...(!isDevelopment ? [
        new InjectManifest({
          swSrc: join(__dirname, 'src/service-worker.ts'),
          swDest: 'service-worker.js',
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          exclude: [/\.map$/, /^manifest.*\.js$/],
        }),
      ] : []),
    ],
  };
};
