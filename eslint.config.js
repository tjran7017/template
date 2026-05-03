import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'

import baseConfig, { importPlugin } from '@repo/config/eslint/base'
import nextConfig from '@repo/config/eslint/next'
import viteReactConfig from '@repo/config/eslint/vite-react'

// zone 경로는 절대경로로 — `pnpm --filter=<n> lint`가 앱 cwd에서 실행돼도 일관 매칭
const repoRoot = path.dirname(fileURLToPath(import.meta.url))
const nextSrc = path.join(repoRoot, 'apps/nextjs/src')
const viteSrc = path.join(repoRoot, 'apps/react-vite/src')

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
      // MSW가 생성한 service worker — vendored asset, lint 대상 X
      '**/public/mockServiceWorker.js',
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
                path.join(nextSrc, 'components'),
                path.join(nextSrc, 'hooks'),
                path.join(nextSrc, 'lib'),
                path.join(nextSrc, 'stores'),
                path.join(nextSrc, 'utils'),
              ],
              from: [path.join(nextSrc, 'features'), path.join(nextSrc, 'app')],
            },
            // 각 feature는 자기 폴더 외 다른 feature를 import할 수 없음
            // (feature 추가 시 한 줄 추가)
            {
              target: path.join(nextSrc, 'features/health'),
              from: path.join(nextSrc, 'features'),
              except: ['./health'],
            },
            {
              target: path.join(nextSrc, 'features/stats'),
              from: path.join(nextSrc, 'features'),
              except: ['./stats'],
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
  // apps/react-vite — Vite + React + import resolver + FSD zone
  ...viteReactConfig.map((cfg) => ({
    ...cfg,
    files: ['apps/react-vite/**/*.{ts,tsx}'],
  })),
  {
    files: ['apps/react-vite/**/*.{ts,tsx}'],
    plugins: {
      // flat config — rules block에서 plugin namespace 룰을 쓰려면 같은 config 객체에 등록 필요
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', '*.cjs'],
        },
        tsconfigRootDir: new URL('./apps/react-vite', import.meta.url).pathname,
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: './apps/react-vite/tsconfig.json',
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
                path.join(viteSrc, 'components'),
                path.join(viteSrc, 'hooks'),
                path.join(viteSrc, 'lib'),
                path.join(viteSrc, 'stores'),
                path.join(viteSrc, 'utils'),
              ],
              from: [path.join(viteSrc, 'features'), path.join(viteSrc, 'app')],
            },
            // 각 feature는 자기 폴더 외 다른 feature를 import할 수 없음
            // (feature 추가 시 한 줄 추가)
            {
              target: path.join(viteSrc, 'features/health'),
              from: path.join(viteSrc, 'features'),
              except: ['./health'],
            },
            {
              target: path.join(viteSrc, 'features/order'),
              from: path.join(viteSrc, 'features'),
              except: ['./order'],
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.type='MetaProperty'][object.meta.name='import'][object.property.name='meta'][property.name='env']",
          message: 'src/config/env.ts의 env 객체를 사용하세요.',
        },
      ],
    },
  },
  {
    // env.ts는 import.meta.env를 읽는 유일한 진입점
    files: ['apps/react-vite/src/config/env.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // logger는 import.meta.env.DEV로 dev 분기 (env 객체 의존하면 순환)
    files: ['apps/react-vite/src/lib/logger.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // 테스트 setup — import.meta.env stub
    files: ['apps/react-vite/vitest.setup.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]
