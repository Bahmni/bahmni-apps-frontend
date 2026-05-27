const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { NxReactWebpackPlugin } = require('@nx/react/webpack-plugin');
const webpack = require('webpack');
const { join } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// NxAppWebpackPlugin creates MiniCssExtractPlugin internally without adding it to
// compiler.options.plugins, so the thisCompilation hook approach cannot find it.
// Patching the prototype here forces static/ output for every instance, regardless
// of how NxAppWebpackPlugin wires it up internally.
const _origMiniCssApply = MiniCssExtractPlugin.prototype.apply;
MiniCssExtractPlugin.prototype.apply = function(compiler) {
  this.options.filename = 'static/[name].[contenthash].css';
  this.options.chunkFilename = 'static/[name].[contenthash].chunk.css';
  _origMiniCssApply.call(this, compiler);
};

module.exports = (env, argv) => {
  const publicPath = env.PUBLIC_PATH || process.env.PUBLIC_PATH || '/bahmni/';
  const isDevelopment = argv.mode !== 'production';

  return {
    output: {
      path: join(__dirname, 'dist'),
      publicPath: publicPath,
      clean: true,
      filename: 'static/[name].[contenthash].js',
      chunkFilename: 'static/[name].[contenthash].chunk.js',
    },
    resolve: {
      alias: isDevelopment ? {
        '@bahmni/home-app': join(__dirname, '../apps/home/src'),
        '@bahmni/clinical-app': join(__dirname, '../apps/clinical/src'),
        '@bahmni/registration-app': join(__dirname, '../apps/registration/src'),
        '@bahmni/appointments-app': join(__dirname, '../apps/appointments/src'),
      } : {},
    },
    devServer: {
      port: 3000,
      historyApiFallback: {
        index: '/bahmni/index.html',
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
    ],
  };
};
