# @repo/config

모노레포 공통 ESLint, TypeScript, Prettier 설정. 환경별(Next.js / Vite / Library) preset을 제공한다.

- **환경별 preset 분리** — `base` → `react` → `next` / `vite-react` / `library` 계층 구조
- **Flat config 기반** — ESLint 9 flat config, `typescript-eslint` v8, `eslint-plugin-import-x`
- **strict TypeScript** — `noUncheckedIndexedAccess`, `verbatimModuleSyntax` 등 모두 활성화
- **단일 Prettier 설정** — `semi: false`, `singleQuote: true`, `printWidth: 100`

## Installation

모노레포 워크스페이스 내부에서 사용:

```json
{
  "devDependencies": {
    "@repo/config": "workspace:*",
    "eslint": "^9.0.0",
    "typescript": "^5.6.0"
  }
}
```

> ESLint와 TypeScript는 `peerDependencies`이므로 사용처가 자기 버전을 갖는다.

## Usage

### ESLint

| Preset                           | 용도                           | extends |
| -------------------------------- | ------------------------------ | ------- |
| `@repo/config/eslint/base`       | 환경 비종속 (Node 스크립트 등) | —       |
| `@repo/config/eslint/react`      | React 공통 (Hooks, a11y)       | base    |
| `@repo/config/eslint/next`       | Next.js 앱                     | react   |
| `@repo/config/eslint/vite-react` | Vite + React SPA               | react   |
| `@repo/config/eslint/library`    | 환경 비종속 라이브러리         | base    |

```js
// apps/nextjs/eslint.config.js
import nextConfig from '@repo/config/eslint/next'

export default [
  ...nextConfig,
  {
    // 앱 특화 규칙 override
  },
]
```

### TypeScript

| Preset                            | 용도                                               | extends |
| --------------------------------- | -------------------------------------------------- | ------- |
| `@repo/config/typescript/base`    | 공통 strict 옵션                                   | —       |
| `@repo/config/typescript/next`    | Next.js (jsx: preserve, DOM lib, next 플러그인)    | base    |
| `@repo/config/typescript/vite`    | Vite (jsx: react-jsx, DOM lib)                     | base    |
| `@repo/config/typescript/library` | 라이브러리 (declaration + composite + dist outDir) | base    |

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

루트 `package.json`에 한 번만 등록:

```json
{
  "prettier": "@repo/config/prettier"
}
```

전체 워크스페이스가 동일한 포맷 규칙을 따른다.

## ESLint Rules

`base`에서 강제하는 핵심 규칙 (모든 preset이 상속):

- `@typescript-eslint/no-explicit-any: error` — `any` 사용 금지
- `@typescript-eslint/consistent-type-imports: error` — `import type` 강제 (inline fix style)
- `import/order: error` — 외부 → 워크스페이스(`@repo/*`) → 절대(`@/*`) → 상대 순
- `import/no-cycle: error` — 순환 의존 금지
- `no-console: ['error', { allow: ['warn', 'error'] }]` — 프로덕션에 `console.log` 잔류 차단

`library`에서 추가:

- `import/no-default-export: error` — named export 강제
- `@typescript-eslint/explicit-module-boundary-types: error` — 외부 노출 함수 타입 명시
- `no-restricted-globals` — `window`, `document`, `navigator`, `location` 사용 금지

`react`에서 추가:

- `react-hooks/rules-of-hooks: error`
- `react-hooks/exhaustive-deps: warn`
- `eslint-plugin-jsx-a11y` recommended

## TypeScript Strict 옵션

[`typescript/base.json`](./typescript/base.json) 전체 옵션 참조. 주요 설정:

- `strict: true` + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`
- `noUnusedLocals`, `noUnusedParameters`
- `verbatimModuleSyntax: true` — `import type` / `export type` 명시 강제
- `moduleResolution: "bundler"` — Vite/Next 등 번들러 환경 가정
- `isolatedModules: true` — 단일 파일 트랜스파일 보장 (esbuild/swc 호환)

## Prettier 옵션

```js
{
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  arrowParens: 'always',
  endOfLine: 'lf',
}
```

## Customization

특정 워크스페이스에서 규칙을 추가/해제하려면 사용처의 `eslint.config.js`에서 override:

```js
import baseConfig from '@repo/config/eslint/base'

export default [
  ...baseConfig,
  {
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
]
```

전체 워크스페이스에 영향을 주는 변경이라면 이 패키지의 preset을 직접 수정 (영향 범위는 [CLAUDE.md](./CLAUDE.md) "변경 영향 범위" 참조).

## Contributing

새 preset 추가 절차, 변경 영향 범위는 [`CLAUDE.md`](./CLAUDE.md) 참조.
