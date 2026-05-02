import baseConfig from './base.js'

export default [
  ...baseConfig,
  {
    rules: {
      'import/no-default-export': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Libraries must be environment-agnostic.' },
        { name: 'document', message: 'Libraries must be environment-agnostic.' },
        { name: 'navigator', message: 'Libraries must be environment-agnostic.' },
        { name: 'location', message: 'Libraries must be environment-agnostic.' },
      ],
    },
  },
]
