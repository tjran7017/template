# @repo/config

ESLint, TypeScript, Prettier 공통 설정을 제공하는 패키지. 모든 앱과 패키지가 동일한 코드 품질 기준을 따르도록 강제.

> **상위 문서:** 루트 `CLAUDE.md` → `packages/CLAUDE.md`
> **이 문서가 우선:** config 패키지 특화 규약 — 설정 변경 시 영향 범위, 새 preset 추가 절차

## 패키지 목적

- 코드 품질 / 포맷 / 타입 검사 기준을 한 곳에 집중
- 새 앱/패키지가 항상 같은 출발점에서 시작
- 의존 방향 같은 아키텍처 규칙을 ESLint로 **강제** (루트 CLAUDE.md의 규칙이 코드 레벨에서 실제로 작동하도록)

## 무엇을 / 무엇을 하지 않는가

| 패키지가 하는 일                                | 패키지가 하지 않는 일                            |
| ----------------------------------------------- | ------------------------------------------------ |
| ESLint / TypeScript / Prettier 공통 설정 export | 앱별 / 패키지별 특수 규칙 정의 (사용처가 extend) |
| 상황별 preset 분리 (next / vite / library)      | 단일 거대 설정 강제                              |
| import 의존 방향 / 네이밍 / strict 규칙 강제    | 도메인 / 비즈니스 로직 검사                      |

## 디렉토리 구조

```
packages/config/
├── eslint/
│   ├── base.js              모든 환경 공통 (TypeScript, import 순서, prettier)
│   ├── react.js             base + React / Hooks / a11y
│   ├── next.js              react + Next.js 플러그인
│   ├── vite-react.js        react + Vite/SPA 특화 (예: import.meta.env 검증)
│   └── library.js           base + 라이브러리/패키지용 (React 비종속)
├── typescript/
│   ├── base.json            모든 환경 공통 strict
│   ├── next.json            base + Next.js (jsx: preserve, moduleResolution: bundler)
│   ├── vite.json            base + Vite (jsx: react-jsx)
│   └── library.json         base + 패키지용 (declaration: true 등)
├── prettier/
│   └── index.js             단일 prettier 설정
├── package.json
└── CLAUDE.md
```

## 공개 API (export)

```json
// package.json
{
  "name": "@repo/config",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    "./eslint/base": "./eslint/base.js",
    "./eslint/react": "./eslint/react.js",
    "./eslint/next": "./eslint/next.js",
    "./eslint/vite-react": "./eslint/vite-react.js",
    "./eslint/library": "./eslint/library.js",
    "./typescript/base": "./typescript/base.json",
    "./typescript/next": "./typescript/next.json",
    "./typescript/vite": "./typescript/vite.json",
    "./typescript/library": "./typescript/library.json",
    "./prettier": "./prettier/index.js"
  },
  "dependencies": {
    "typescript-eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-import-x": "^4.0.0",
    "eslint-plugin-jsx-a11y": "^6.10.0",
    "eslint-plugin-react": "^7.37.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "@next/eslint-plugin-next": "^16.0.0",
    "prettier": "^3.3.0"
  },
  "peerDependencies": {
    "eslint": ">=9.0.0",
    "typescript": ">=5.6.0"
  }
}
```

> **`peerDependencies`로 ESLint와 TypeScript 명시** — 사용처가 자기 버전을 갖고 있고, 패키지는 버전 범위만 선언.

## preset별 책임

### `eslint/base.js` — 모든 환경 공통

- `typescript-eslint` 통합 패키지의 `recommendedTypeChecked` 베이스
- `eslint-plugin-import-x` — import 순서, 순환 의존 감지 (`'import'` 키로 등록 → 규칙명은 `import/order` 등 유지)
- `eslint-config-prettier` — Prettier 충돌 방지 (마지막에 적용)
- 핵심 규칙:
  - `@typescript-eslint/no-explicit-any: 'error'` (루트 CLAUDE.md의 "any 금지" 강제)
  - `@typescript-eslint/consistent-type-imports: 'error'` (`import type` 강제)
  - `import/order` (외부 → 워크스페이스 → 절대 → 상대)
  - `import/no-cycle: 'error'`
  - `no-console: ['error', { allow: ['warn', 'error'] }]` ("프로덕션에 console.log 금지" 강제)

### `eslint/react.js` — React 공통

- `base.js` 확장
- `eslint-plugin-react` (자동 detect, React 19 대응)
- `eslint-plugin-react-hooks`
- `eslint-plugin-jsx-a11y`
- 핵심 규칙:
  - `react/jsx-uses-react: 'off'`, `react/react-in-jsx-scope: 'off'` (React 17+)
  - `react-hooks/rules-of-hooks: 'error'`
  - `react-hooks/exhaustive-deps: 'warn'`

### `eslint/next.js` — Next.js 앱용

- `react.js` 확장
- `@next/eslint-plugin-next`
- 핵심 규칙:
  - `@next/next/no-html-link-for-pages` 등 Next.js 권장 규칙 모두 활성화
  - `react/jsx-no-target-blank: 'off'` (Next.js Link가 처리)

### `eslint/vite-react.js` — Vite + React SPA용

- `react.js` 확장
- 핵심 규칙:
  - `import/no-restricted-paths` — feature 단위 의존 방향 강제 (FSD 스타일)
  - 환경변수 직접 접근 금지 (사용자가 추가 설정 가능)

```js
// import/no-restricted-paths 예시 (앱이 자기 .eslintrc에서 추가)
'import/no-restricted-paths': [
  'error',
  {
    zones: [
      {
        target: ['./src/components', './src/hooks', './src/lib', './src/stores', './src/utils'],
        from: ['./src/features', './src/app'],
      },
    ],
  },
]
```

### `eslint/library.js` — 패키지/라이브러리용

- `base.js` 확장 (React 의존 없음)
- 핵심 규칙:
  - `import/no-default-export: 'error'` (named export 강제)
  - `@typescript-eslint/explicit-module-boundary-types` (외부 노출 함수는 타입 명시)
  - `no-restricted-globals` — `window`, `document` 등 브라우저 전역 금지 (라이브러리는 환경 비종속)

## TypeScript preset

### `typescript/base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true
  }
}
```

### 환경별 preset

- `typescript/next.json` — `lib: ['DOM', 'DOM.Iterable', 'ES2022']`, `jsx: 'preserve'`, `plugins: [{ name: 'next' }]`
- `typescript/vite.json` — `lib: ['DOM', 'DOM.Iterable', 'ES2022']`, `jsx: 'react-jsx'`
- `typescript/library.json` — `declaration: true`, `composite: true` (별도 빌드 시), `lib: ['ES2022']`만

## Prettier 설정

```js
// prettier/index.js
export default {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  arrowParens: 'always',
  endOfLine: 'lf',
}
```

루트 CLAUDE.md의 "코딩 컨벤션 (전역)" 섹션과 일관. 변경 시 양쪽 동기화.

## 사용처에서 적용 패턴

### ESLint (앱)

```js
// apps/nextjs/eslint.config.js
import nextConfig from '@repo/config/eslint/next'

export default [
  ...nextConfig,
  {
    // 앱 특화 규칙
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            /* 앱별 의존 zone */
          ],
        },
      ],
    },
  },
]
```

### TypeScript (앱)

```json
// apps/nextjs/tsconfig.json
{
  "extends": "@repo/config/typescript/next",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "next-env.d.ts"]
}
```

### Prettier

```json
// 루트 또는 각 앱의 package.json
{
  "prettier": "@repo/config/prettier"
}
```

## 변경 영향 범위

이 패키지는 **모든 앱과 패키지에 영향**을 미침. 변경 시 다음을 반드시 검증:

| 변경 종류                          | 검증 항목                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| ESLint 규칙 추가                   | 모든 워크스페이스에서 `pnpm lint` 통과 확인. 통과 안 되면 사전에 코드 마이그레이션 PR 분리 |
| ESLint 규칙 강화 (warn → error)    | 위와 동일 + 충분한 사전 공지                                                               |
| TypeScript 옵션 강화 (strict 관련) | `pnpm typecheck` 모든 워크스페이스 통과                                                    |
| Prettier 옵션 변경                 | `pnpm prettier --write .` 일괄 실행 후 별도 PR로 적용 (diff가 거대해지므로)                |

## 새 preset 추가 절차

새로운 환경(예: Node.js 서버, React Native)이 모노레포에 추가될 때:

1. **`<area>/<environment>.{js|json}` 파일 생성** — 기존 base를 확장
2. **`package.json`의 `exports`에 등록**
3. **이 문서의 "preset별 책임" 섹션에 항목 추가**
4. **README.md의 사용 예시에 항목 추가**
5. **사용처에서 `extends` / `import` 변경**

## Claude Code 변경 시 체크리스트

- [ ] 새 규칙 추가 시 모든 워크스페이스의 `pnpm lint` / `pnpm typecheck`가 통과하는가
- [ ] 규칙이 *모든 환경 공통*이면 `base`에, _React만_ 이면 `react`에, *환경 특화*면 환경별 preset에 두었는가
- [ ] 추가한 ESLint 플러그인을 `dependencies`에 등록했는가 (peerDependency 아님)
- [ ] Prettier 옵션 변경 시 루트 CLAUDE.md의 "코딩 컨벤션" 섹션과 일치하는가
- [ ] preset 변경이 _모든 사용처를 즉시 깨는_ 종류라면 코드 마이그레이션 PR을 분리했는가
- [ ] 새 preset이 추가됐다면 `package.json` exports와 README의 사용 예시 모두 갱신했는가
- [ ] React/Next.js 등 프레임워크 의존 규칙을 `library.js`에 넣지 않았는가
