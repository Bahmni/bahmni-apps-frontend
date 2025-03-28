import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions"
  ],
  "framework": {
    "name": "@storybook/react-webpack5",
    "options": {}
  },
  "staticDirs": ['../public'],
  webpackFinal: async (config) => {
    // Add SCSS support
    if (config.module && config.module.rules) {
      config.module.rules.push({
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [path.resolve(__dirname, '../node_modules')],
              },
            },
          }
        ],
        include: path.resolve(__dirname, '../'),
      });
    }

    // Add path aliases
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
        '@components': path.resolve(__dirname, '../src/components'),
        '@contexts': path.resolve(__dirname, '../src/contexts'),
        '@constants': path.resolve(__dirname, '../src/constants'),
        '@hooks': path.resolve(__dirname, '../src/hooks'),
        '@providers': path.resolve(__dirname, '../src/providers'),
        '@services': path.resolve(__dirname, '../src/services'),
        '@types': path.resolve(__dirname, '../src/types'),
        '@utils': path.resolve(__dirname, '../src/utils'),
      };
    }

    return config;
  }
};
export default config;
