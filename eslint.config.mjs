import antfu from '@antfu/eslint-config';

export default antfu(
  {
    ignores: ['dist', 'CHANGELOG.md'],
    typescript: true,
    formatters: true,
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: true,
    },
    vue: false,
    react: false,
    unicorn: false,
    pnpm: false,
    e18e: false,
  },
  {
    rules: {
      'no-console': 'off',
      'ts/no-explicit-any': 'off',
      'style/comma-dangle': ['warn', 'always-multiline'],
    },
  },
);
