const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  // Allow configuring the public path via environment variable
  const publicPath = env.PUBLIC_PATH || '/';

  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction
        ? 'static/js/[name].[contenthash:8].js'
        : 'static/js/[name].js',
      chunkFilename: isProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : 'static/js/[name].chunk.js',
      publicPath: publicPath,
      clean: true,
    },
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      port: 3000,
      hot: true,
      historyApiFallback: true,
      compress: true,
      proxy: [
        {
          context: ['/openmrs'],
          target: 'https://localhost/',
          changeOrigin: true,
          secure: false,
          logLevel: 'debug',
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src/'),
        '@components': path.resolve(__dirname, 'src/components/'),
        '@constants': path.resolve(__dirname, 'src/constants'),
        '@contexts': path.resolve(__dirname, 'src/contexts'),
        '@displayControls': path.resolve(__dirname, 'src/displayControls'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@layouts': path.resolve(__dirname, 'src/layouts'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@providers': path.resolve(__dirname, 'src/providers'),
        '@schemas': path.resolve(__dirname, 'src/schemas'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.module\.s?css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
              }
            },
            'sass-loader',
          ],
        },
        {
          test: /\.s?css$/,
          exclude: /\.module\.s?css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10 * 1024, // 10kb
            },
          },
          generator: {
            filename: 'static/media/[name].[hash:8][ext]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'static/fonts/[name].[hash:8][ext]',
          },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PUBLIC_URL': JSON.stringify(publicPath),
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/favicon.ico',
        inject: true,
        ...(isProduction && {
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          },
        }),
      }),
      isProduction &&
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }),
      isProduction &&
        new CopyWebpackPlugin({
          patterns: [
            {
              from: 'public',
              to: '',
              globOptions: {
                ignore: ['**/index.html', '**/favicon.ico'],
              },
            },
          ],
        }),
      isProduction &&
        new WebpackPwaManifest({
          name: 'Bahmni Clinical Frontend',
          short_name: 'Bahmni Clinical',
          description: 'Bahmni Clinical Frontend Application',
          background_color: '#ffffff',
          theme_color: '#0f62fe', // Carbon blue
          display: 'standalone',
          orientation: 'portrait',
          scope: publicPath,
          start_url: publicPath,
          icons: [
            {
              src: path.resolve('public/logo512.png'),
              sizes: [96, 128, 192, 256, 384, 512],
              destination: path.join('static', 'icons'),
            },
          ],
        }),
      isProduction &&
        new GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          runtimeCaching: [
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
              },
            },
            {
              urlPattern: /\.(?:js|css)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources',
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
          ],
        }),
    ].filter(Boolean),
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        name: false,
      },
      runtimeChunk: {
        name: (entrypoint) => `runtime-${entrypoint.name}`,
      },
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 512000, // 500 KiB
      maxEntrypointSize: 512000, // 500 KiB
    },
    stats: 'minimal',
  };
};
