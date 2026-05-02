import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'

import baseConfig from '@repo/config/eslint/base'
import nextConfig from '@repo/config/eslint/next'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/storybook-static/**',
      '**/.next/**',
      // ESLint 설정 파일 자체는 lint 대상에서 제외 (meta-configuration)
      'packages/config/eslint/**',
      'packages/config/prettier/**',
      // Storybook 설정 파일은 자체 타입 의존성이라 lint 대상에서 제외
      '**/.storybook/**',
    ],
  },
  ...baseConfig,
  // apps/nextjs — Next.js + React + import resolver + FSD zone
  ...nextConfig.map((cfg) => ({
    ...cfg,
    files: ['apps/nextjs/**/*.{ts,tsx}'],
  })),
  {
    files: ['apps/nextjs/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', '*.cjs'],
        },
        tsconfigRootDir: new URL('./apps/nextjs', import.meta.url).pathname,
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: './apps/nextjs/tsconfig.json',
        }),
      ],
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // shared modules은 features/app을 참조하지 않음
            {
              target: [
                './apps/nextjs/src/components',
                './apps/nextjs/src/hooks',
                './apps/nextjs/src/lib',
                './apps/nextjs/src/stores',
                './apps/nextjs/src/utils',
              ],
              from: ['./apps/nextjs/src/features', './apps/nextjs/src/app'],
            },
            // 각 feature는 자기 폴더 외 다른 feature를 import할 수 없음
            // (feature 추가 시 한 줄 추가)
            {
              target: './apps/nextjs/src/features/health',
              from: './apps/nextjs/src/features',
              except: ['./health'],
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'src/config/env.ts의 env 객체를 사용하세요.',
        },
      ],
    },
  },
  {
    // env.ts는 process.env를 읽는 유일한 진입점
    files: ['apps/nextjs/src/config/env.ts'],
    rules: {
      'no-restricted-properties': 'off',
    },
  },
  {
    // logger는 NODE_ENV로 dev/prod 분기 (env 객체 의존하면 순환)
    files: ['apps/nextjs/src/lib/logger.ts'],
    rules: {
      'no-restricted-properties': 'off',
    },
  },
  {
    // 테스트 setup 파일은 env.ts zod 검증 통과를 위해 process.env에 stub 주입
    files: ['apps/nextjs/vitest.setup.ts'],
    rules: {
      'no-restricted-properties': 'off',
    },
  },
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
    // codegen/build 스크립트 — dynamic import, process.env 등으로 type-unsafe 오탐
    files: ['**/scripts/**/*.ts'],
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
