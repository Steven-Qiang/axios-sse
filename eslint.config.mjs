import antfu from '@antfu/eslint-config';

export default antfu({
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
}, {
  rules: {
    'no-console': 'warn',
    'ts/no-explicit-any': 'off',
    'style/comma-dangle': ['warn', 'always-multiline'],
  },
});