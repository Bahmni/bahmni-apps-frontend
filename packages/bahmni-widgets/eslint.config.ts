import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.ts';

export default [
  { ignores: ['dist/**', 'dist-standalone/**'] },
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {},
  },
];
