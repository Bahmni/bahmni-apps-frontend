const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { NxReactWebpackPlugin } = require('@nx/react/webpack-plugin');
const webpack = require('webpack');
const { join } = require('path');

module.exports = (env, argv) => {
  const publicPath = env.PUBLIC_PATH || process.env.PUBLIC_PATH || '/';
  return {
    output: {
      path: join(__dirname, 'dist'),
      publicPath: publicPath,
      clean: true,
    },
    devServer: {
      port: 3000,
      historyApiFallback: {
        index: '/index.html',
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
      }),
      new NxAppWebpackPlugin({
        tsConfig: './tsconfig.app.json',
        compiler: 'babel',
        main: './src/main.tsx',
        index: './src/index.html',
        baseHref: publicPath,
        assets: ['./src/favicon.ico', './src/assets'],
        outputHashing: process.env['NODE_ENV'] === 'production' ? 'all' : 'none',
        optimization: process.env['NODE_ENV'] === 'production',
      }),
      new NxReactWebpackPlugin({
        // Uncomment this line if you don't want to use SVGR
        // See: https://react-svgr.com/
        // svgr: false
      }),
    ],
  }
};
