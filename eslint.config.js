import baseConfig from '@repo/config/eslint/base'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.turbo/**',
      '**/dist/**',
      // ESLint 설정 파일 자체는 lint 대상에서 제외 (meta-configuration)
      'packages/config/eslint/**',
      'packages/config/prettier/**',
    ],
  },
  ...baseConfig,
  {
    // JS 설정 파일은 .d.ts 없어 type-unsafe 규칙이 오탐을 냄 — 해제
    files: ['*.config.js', '*.config.mjs', '*.config.cjs'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
]
