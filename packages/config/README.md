# @repo/config

ESLint, TypeScript, Prettier 공통 설정 패키지. 모노레포 안의 모든 앱과 패키지가 동일한 코드 품질 기준 위에서 개발하도록 한다.

## Why — 왜 만들었나

여러 앱과 패키지가 한 모노레포 안에 살면 다음 문제가 반복된다:

- 각 워크스페이스가 자기 `.eslintrc`, `tsconfig.json`을 따로 관리하다가 점점 달라져, 같은 코드가 어떤 앱에서는 통과하고 다른 앱에서는 막힌다
- 새 앱을 추가할 때마다 설정을 복붙하면서 누군가는 옛 버전을 가져온다
- 의존 방향, import 순서, strict 옵션 같은 *아키텍처 규칙*이 문서로만 존재해서 실제로는 지켜지지 않는다
- Prettier 옵션이 미묘하게 달라 PR마다 무관한 포맷 변경이 섞인다

이 패키지는 위 문제를 한 번에 해결하면서, 환경별 차이(Next.js / Vite / 라이브러리)는 별도 preset으로 흡수한다.

## How — 어떻게 풀었나

### 1. 환경별 preset 분리

설정을 단일 거대 파일로 두면 쓰지 않는 규칙까지 강제되거나, 환경 특수성이 깨진다. 그래서 책임 단위로 잘게 쪼갰다:

```
eslint/
├── base.js           모든 환경 공통 (TS, import 순서, prettier 충돌 방지)
├── react.js          base + React/Hooks/a11y
├── next.js           react + Next.js 플러그인
├── vite-react.js     react + Vite/SPA 특화
└── library.js        base + 라이브러리용 (React 비종속, 브라우저 전역 금지)

typescript/
├── base.json         strict 공통
├── next.json         base + Next.js
├── vite.json         base + Vite
└── library.json      base + 패키지용

prettier/index.js     단일 설정
```

각 preset은 하위 preset을 확장한다. 새 환경이 추가될 때 base를 다시 만들 필요가 없다.

### 2. 아키텍처 규칙을 ESLint로 강제

루트 CLAUDE.md의 컨벤션이 문서로만 남지 않도록 ESLint 규칙으로 옮겼다:

- *"any 금지"* → `@typescript-eslint/no-explicit-any: 'error'`
- *"console.log 금지"* → `no-console: ['error', { allow: ['warn', 'error'] }]`
- *"import type 사용"* → `@typescript-eslint/consistent-type-imports: 'error'`
- *"순환 의존 금지"* → `import/no-cycle: 'error'`
- *"feature끼리 import 금지 / shared가 features를 참조 금지"* → `import/no-restricted-paths` (앱이 zone 정의)

### 3. 사용처는 한 줄로 적용

각 앱/패키지가 자기 환경에 맞는 preset만 import하면 끝이다:

```js
// apps/nextjs/eslint.config.js
import nextConfig from '@repo/config/eslint/next'
export default [...nextConfig]
```

```json
// apps/nextjs/tsconfig.json
{ "extends": "@repo/config/typescript/next" }
```

```json
// package.json
{ "prettier": "@repo/config/prettier" }
```

## Result — 무엇이 좋아졌나

- **새 앱/패키지 추가 시 설정 셋업 시간 0** — 환경별 preset 한 줄로 끝
- **워크스페이스 간 일관성 보장** — 같은 코드가 모든 곳에서 동일하게 통과/실패
- **아키텍처 규칙이 실제로 작동** — 의존 방향 위반이 PR 단계에서 자동으로 차단
- **PR 노이즈 감소** — 포맷이 자동 통일되어 무관한 diff가 사라짐
- **버전 관리 단일화** — ESLint/TS 플러그인 버전 갈등이 한 패키지에서만 일어남

## 사용법

### 설치 (모노레포 워크스페이스)

```json
// 사용처 package.json
{
  "devDependencies": {
    "@repo/config": "workspace:*",
    "eslint": "^9.0.0",
    "typescript": "^5.6.0"
  }
}
```

> ESLint와 TypeScript는 `peerDependencies`로 선언되어 있어 사용처가 자기 버전을 갖는다.

### Next.js 앱

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
            {
              target: ['./src/components', './src/hooks', './src/lib'],
              from: ['./src/features', './src/app'],
            },
          ],
        },
      ],
    },
  },
]
```

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

### Vite + React 앱

```js
// apps/react-vite/eslint.config.js
import viteConfig from '@repo/config/eslint/vite-react'

export default [
  ...viteConfig,
  {
    rules: {
      // 앱 특화 의존 zone
    },
  },
]
```

```json
// apps/react-vite/tsconfig.json
{
  "extends": "@repo/config/typescript/vite",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

### 라이브러리 / 패키지

```js
// packages/<your-package>/eslint.config.js
import libraryConfig from '@repo/config/eslint/library'
export default libraryConfig
```

```json
// packages/<your-package>/tsconfig.json
{
  "extends": "@repo/config/typescript/library",
  "include": ["src"]
}
```

### Prettier (전역)

루트 `package.json`에 한 번만 등록하면 모든 워크스페이스가 같은 Prettier 설정을 사용한다.

```json
// 루트 package.json
{
  "prettier": "@repo/config/prettier"
}
```

## 자주 묻는 질문

### preset을 직접 수정해도 되나?

특정 앱 한 곳에서만 필요한 규칙이라면 **사용처의 `eslint.config.js`에서 override**가 정답이다. 모든 워크스페이스에 영향을 미쳐도 되는 규칙이라면 이 패키지를 수정한다 (PR로 영향 범위 명시).

### 왜 ESLint를 `dependencies`가 아니라 `peerDependencies`로 두나?

ESLint는 *실행 환경의 단일 인스턴스*가 필수다. 워크스페이스마다 ESLint 버전이 달라지면 플러그인 충돌과 버그가 생긴다. 사용처가 자기 ESLint를 갖고 이 패키지의 설정만 가져다 쓰는 게 안전하다.

### preset이 너무 엄격해서 우리 앱이 통과 못 하면?

두 가지 선택지:

1. **앱에서 해당 규칙만 끔** — `eslint.config.js`에서 override (단기)
2. **점진적 마이그레이션 PR** — 코드를 규칙에 맞춰 고친 뒤 다음 PR에서 활성화 (장기)

`base` / `react` 같은 광범위한 preset은 항상 보수적으로 추가하고, 강한 규칙은 신중히 도입한다.

### 환경별 preset이 너무 잘게 나뉘어 있다. 합치면 안 되나?

각 preset은 독립적인 책임을 가진다:

- `base`: 환경 비종속 (Node 스크립트도 사용)
- `react`: React 자체에 의존 (Next.js / Vite / Storybook 등 어디든)
- `next` / `vite-react`: 프레임워크 특화 플러그인
- `library`: 브라우저 전역(`window`, `document`) 금지 — 라이브러리는 환경 비종속

합치면 *"라이브러리에서 React가 강제로 설정되거나, Node 스크립트에 React 규칙이 적용되는"* 문제가 생긴다.

### TypeScript `strict` 옵션을 더 강화하고 싶다면?

`base.json`에 추가하면 모든 워크스페이스에 영향. 영향 범위가 크면 사전에 마이그레이션 PR을 분리하고, 한 번에 활성화한다. 일부 코드만 적용하고 싶다면 사용처 `tsconfig.json`에서 override.

### Prettier 옵션을 바꾸면 어떻게 되나?

모든 코드의 포맷이 영향 받는다. 옵션 변경과 일괄 적용(`pnpm prettier --write .`)을 **별도 PR로 분리**해서, diff가 다른 변경사항과 섞이지 않도록 한다.

## 명령어

```bash
# 전체 워크스페이스 lint
pnpm lint

# 전체 typecheck
pnpm typecheck

# 전체 prettier 일괄 적용 (포맷 변경 시)
pnpm prettier --write .
```

## 새 preset 추가

새 환경이 모노레포에 추가될 때의 절차는 [`CLAUDE.md`](./CLAUDE.md) 참고.
