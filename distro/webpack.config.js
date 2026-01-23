const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { NxReactWebpackPlugin } = require('@nx/react/webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const webpack = require('webpack');
const { join } = require('path');

module.exports = (env, argv) => {
  //TODO to read this from docker compose
  //TODO should we hardcode?
  const publicPath = env.PUBLIC_PATH || process.env.PUBLIC_PATH || '/bahmni-new/';
  const isDevelopment = argv.mode !== 'production';

  return {
    output: {
      path: join(__dirname, 'dist'),
      publicPath: publicPath,
      clean: true,
    },
    resolve: {
      alias: isDevelopment ? {
        '@bahmni/clinical-app': join(__dirname, '../apps/clinical/src'),
        '@bahmni/registration-app': join(__dirname, '../apps/registration/src'),
      } : {},
    },
    devServer: {
      port: 3000,
      historyApiFallback: {
        index: '/bahmni-new/index.html',
        disableDotRule: true,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
      },
      proxy: [
        {
          context: ['/bahmni_config', '/openmrs'],
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
          { input: isDevelopment ? '../apps/clinical/public/locales' : '../apps/clinical/dist/locales', glob: '**/*', output: 'clinical/locales' },
          { input: isDevelopment ? '../apps/registration/public/locales' : '../apps/registration/dist/locales', glob: '**/*', output: 'registration/locales' }
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
