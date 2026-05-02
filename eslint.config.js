import baseConfig from '@repo/config/eslint/base'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/storybook-static/**',
      // ESLint 설정 파일 자체는 lint 대상에서 제외 (meta-configuration)
      'packages/config/eslint/**',
      'packages/config/prettier/**',
      // Storybook 설정 파일은 자체 타입 의존성이라 lint 대상에서 제외
      '**/.storybook/**',
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
  {
    // 테스트 파일에서 as any / 외부 라이브러리 모킹 등 type-unsafe 패턴 허용
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
]
