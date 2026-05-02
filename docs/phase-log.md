# Phase 구현 로그

코드나 계획서에서 바로 알 수 없는 **결정 사항과 인수인계 메모**만 기록.

---

## Phase 0 — 완료 ✅

**브랜치**: `feat/phase-0-monorepo-skeleton`
**PR**: [#2](https://github.com/tjran7017/template/pull/2) — main 머지 완료

### 결정 사항

| 항목                        | 결정                                | 이유                                                     |
| --------------------------- | ----------------------------------- | -------------------------------------------------------- |
| pnpm 버전                   | 9.15.0으로 업그레이드 (기존 8.15.9) | engines `>=9` 요건 충족                                  |
| `"type": "module"`          | 루트 `package.json`에 추가          | CLAUDE.md ESM only 규칙 + commitlint ESM 경고 해소       |
| pre-commit typecheck        | **제거** (CI에서만 실행)            | 전체 워크스페이스 typecheck는 커밋마다 실행 시 너무 느림 |
| lint-staged ESLint          | Phase 0에서 **제외**                | @repo/config 없이 ESLint 설정 불가                       |
| `turbo.json` lint.dependsOn | `["^build"]` **유지**               | 유지 선택. Phase 4/5 이후 느리면 제거 검토               |

---

## Phase 1 — 완료 ✅

**브랜치**: `feat/phase-1-config`
**PR**: [#3](https://github.com/tjran7017/template/pull/3) — main 머지 완료

### 결정 사항

| 항목                                                 | 결정                                                                                              | 이유                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `typescript-eslint` 통합 패키지                      | `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` 대신 `typescript-eslint` v8 사용 | ESLint 9 flat config API 간결, 공식 권장                                     |
| `eslint-plugin-import-x`                             | `eslint-plugin-import` v2 대신 사용                                                               | v2는 ESLint 9 flat config 미지원, import-x는 네이티브 지원                   |
| `tseslint.config()` wrapper 미사용                   | plain array export (`export default [...]`)                                                       | v8.59.1에서 `tseslint.config()` 모든 overload가 deprecated Hint 발생         |
| `packages/config/tsconfig.json` 없음                 | TypeScript 소스 파일 없음 → tsconfig 불필요                                                       | `.js` + `.json`만 있어 TS 컴파일 불필요; `tsc --noEmit`은 TS18002/18003 에러 |
| `typecheck` 스크립트 없음                            | `packages/config/package.json`에 typecheck 미포함                                                 | 위와 동일 이유; turbo가 해당 패키지 skip                                     |
| `base.json`에서 `esModuleInterop` 제거               | `verbatimModuleSyntax: true`와 충돌, ESM-only에서 불필요                                          | 두 옵션이 상충; `verbatimModuleSyntax`이 우선                                |
| `library.json`에 `outDir: dist`, `rootDir: src` 추가 | 기본값 없으면 `.tsbuildinfo` + declaration이 src/ 오염                                            | composite 패키지는 빌드 산출물 위치 명시 필요                                |
| 루트 `tsconfig.json` references 갱신 생략            | packages/config에 TS composite 설정 없음                                                          | 소스 없는 패키지를 project reference로 등록하면 오류 가능                    |

---

## Phase 2 — 완료 ✅

**브랜치**: `feat/phase-2-api-client`
**PR**: [#4](https://github.com/tjran7017/template/pull/4) — main 머지 완료
**병렬**: Phase 3과 worktree 격리로 동시 실행

### 결정 사항

| 항목                                                                     | 결정                                                                          | 이유                                                                                               |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 런타임 의존성 0                                                          | `dependencies: {}` — 표준 fetch만 사용                                        | 번들 영향 최소, 디버깅 시 DevTools Network 탭이 그대로 작동                                        |
| 데모 서비스 (`services/example.ts`)                                      | codegen 없이 inline `ExamplePaths` 타입 + `createExampleClient`               | Swagger URL 없이도 패키지 빌드/테스트가 동작해야 함 (CI 환경, 신규 사용자 학습용)                  |
| `tsconfig.json`에서 `composite: false` override                          | `library.json` preset의 `composite: true`를 끔                                | 소스 직접 export 패키지라 빌드 산출물(dist) 불필요. composite은 단일 파일 트랜스파일 부담만 추가   |
| `tsconfig.json`에 `rootDir: "."` + `scripts/`, `vitest.config.ts` 포함   | `include: ["src", "scripts", "vitest.config.ts"]`                             | ESLint projectService가 이 파일들을 인식하지 못하면 "not found by the project service" 에러        |
| `core.ts`: `headers?: HeadersInit` → `RequestInit['headers']`            | `HeadersInit`은 DOM lib 타입                                                  | base.json `lib: ["ES2022"]`만이라 `HeadersInit` 미존재. `RequestInit['headers']`는 동일 의미       |
| `core.ts`: `fillPath` params 타입을 `string \| number \| boolean`로 좁힘 | `Record<string, unknown>`은 `String(value)`에서 `no-base-to-string` lint 에러 | unknown은 객체일 수 있어 `[object Object]`로 stringify될 위험. primitive로 좁혀 정확성 + lint 통과 |
| `scripts/generate.ts`의 `console.log` 제거                               | 진행 로그 출력 자체를 제거                                                    | `no-console: ['error', { allow: ['warn', 'error'] }]` 위반. 로그가 필수가 아니라면 제거가 깔끔     |
| 루트 `eslint.config.js`에 `**/scripts/**/*.ts` 오버라이드 추가           | `process.env`, dynamic import 등 type-unsafe 규칙 해제                        | codegen 스크립트는 본질적으로 동적이라 type-aware 규칙이 오탐을 많이 냄                            |
| 루트 `eslint.config.js`에 `**/*.test.ts` 오버라이드 추가                 | `no-unsafe-assignment`, `no-unsafe-argument` 해제                             | 테스트에서 `as any`로 generic 좁히는 패턴이 흔함. 모든 테스트 파일에 disable 주석 다는 것 비현실적 |

### 인수인계 메모

- **`@repo/api-client`는 worktree 격리로 Phase 3과 병렬 진행** — Agent tool에 `isolation: "worktree"` 옵션. 두 phase가 서로 무의존이라 가능
- **첫 시도에서 Bash 권한 문제로 worktree 에이전트가 멈춤** — 파일 작성만 에이전트에게 시키고 git/pnpm은 메인 세션에서 실행하는 패턴이 안정적
- **lint-staged 첫 commit 시 ESLint가 `vitest.config.ts`/`scripts/generate.ts`를 못 찾아 실패** — tsconfig include + 루트 eslint 오버라이드로 해결. 사후 추가 패키지에도 동일 패턴 필요

---

## Phase 3 — 완료 ✅

**브랜치**: `feat/phase-3-ui`
**PR**: [#5](https://github.com/tjran7017/template/pull/5) — main 머지 완료
**병렬**: Phase 2와 worktree 격리로 동시 실행

### 결정 사항

| 항목                                                          | 결정                                                                      | 이유                                                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 시작 컴포넌트 범위                                            | Button, Card 두 개로 한정 (Input, Label 제거)                             | 데모는 디자인 토큰 + 컴포넌트 패턴 검증이 목적. primitive 종류는 사용처에서 필요해질 때 추가                  |
| Card composite는 named export (`CardHeader/Body/Footer`)      | `Object.assign(Card, { Header, Body, Footer })` dot-notation 사용 안 함   | IDE 타입 추론이 더 명확, 트리 셰이킹 효율, 개별 import 가능                                                   |
| Props 타입은 `React.ComponentPropsWithRef<'tag'>`             | `React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: ... }` 패턴 대체 | `ref`가 자동 포함, 태그 이름만으로 element 타입과 ref 타입 한 번에 추론                                       |
| SCSS Modules는 명시적 `*.module.scss.d.ts` 작성               | `Record<string, string>` 와일드카드 ambient 선언 사용 안 함               | 와일드카드는 `noUncheckedIndexedAccess`와 결합해 모든 접근이 `string \| undefined`가 되어 lint 에러 다발      |
| `tsconfig.json`에 `allowArbitraryExtensions: true`            | TypeScript 5.0+ 옵션                                                      | `import styles from './x.module.scss'` 시 `./x.module.scss.d.ts`를 자동 발견하게 해줌                         |
| `tsconfig.json`에 `lib: [ES2022, DOM, DOM.Iterable]` 추가     | `library.json` 기본 `lib: ["ES2022"]`에 DOM 추가                          | UI 패키지는 브라우저 환경. `querySelector`, `HTMLElement` 등 DOM 타입 필요                                    |
| JSDoc 주석은 `@example` 태그 금지, 코드 펜스만 사용           | `/** \`\`\`tsx ... \`\`\` \*/` 형태                                       | `@example` 태그를 쓰면 Storybook autodocs가 Example 섹션으로 자동 렌더링. IDE hover만 필요한 경우 코드 펜스만 |
| `vitest.config.ts`에 `globals: true`                          | Vitest globals 활성화                                                     | `@testing-library/react` v15+의 auto-cleanup이 `afterEach` 글로벌 등록 필요                                   |
| `vitest.setup.ts`는 `@testing-library/jest-dom/vitest` import | 일반 `@testing-library/jest-dom`이 아닌 vitest 전용 진입점                | 후자는 `expect.extend()`를 직접 호출 — `expect`가 setup file scope에 없으면 ReferenceError                    |
| `jest-axe` `toHaveNoViolations`는 setup에서 명시적 등록       | `expect.extend(toHaveNoViolations)` 호출                                  | `@testing-library/jest-dom/vitest`가 자동 등록 안 함. 명시적 등록 필요                                        |
| 루트 `eslint.config.js`에 `**/.storybook/**` ignore           | Storybook 설정 파일은 lint 대상 제외                                      | `.storybook/main.ts`, `preview.ts`가 ESLint projectService에서 발견되지 않는 문제 회피                        |

### 인수인계 메모

- **`storybook` 패키지를 `@storybook/react-vite`와 별도로 devDependency에 명시 필요** — `storybook/internal/preview/runtime`을 못 찾아 dev server가 vite import 에러로 실패. pnpm strict 모드에서는 transitive 의존을 자동으로 끌어오지 않음
- **`@storybook/react`도 별도 추가 필요** — `@storybook/react-vite`의 peerDependency라 자동 설치 안 됨. 스토리 파일의 `import type { Meta, StoryObj } from '@storybook/react'`가 깨짐
- **CSS Module 클래스가 lint에서 "Cannot resolve" 에러로 보일 때** — 진짜 원인은 `allowArbitraryExtensions` 누락. `*.scss.d.ts`만 만들어도 이 옵션 없으면 TypeScript가 임포트 자체를 거부
- **main 머지 시 Phase 2/3 충돌 지점**: `eslint.config.js`의 test 오버라이드 + `pnpm-lock.yaml`. Phase 3에서 main을 merge받아 둘 다 유지하는 방향으로 해결

---

## Phase 4 — 완료 ✅

**브랜치**: `feat/phase-4-nextjs`
**선행 조건**: Phase 1, 2, 3 완료 후 진입 (Phase 5와 병렬 가능)

### 결정 사항

| 항목                                                          | 결정                                                                                                | 이유                                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| api-client 소스에서 `.js` extension 제거                      | `from './errors.js'` → `from './errors'`                                                            | Next 16 turbopack은 `.js` → `.ts` extension alias 미지원. `moduleResolution: bundler`라 extension 없이도 동작  |
| api-client `core.ts`의 fetch 호출 시점 해석                   | `const baseFetch = config.fetch ?? fetch` → `resolveFetch = () => config.fetch ?? globalThis.fetch` | MSW가 `globalThis.fetch`를 모듈 로드 후에 패치 → 캡쳐된 ref가 stale. 호출 시점 lookup으로 해결                 |
| 루트 `pnpm.overrides`에 `@types/node ^22.10.0`                | 단일 버전으로 핀                                                                                    | apps/nextjs(@types/node 22) + transitive @types/node 25 두 개가 동시에 들어와 `Response.bytes` 타입 충돌 발생  |
| `next lint` 사용 안 함 → `eslint src` 직접 실행               | Next 16에서 `next lint` deprecated                                                                  | Next 16부터는 ESLint를 직접 실행하는 것이 공식 권장                                                            |
| `eslint-import-resolver-typescript` 추가                      | `eslint-plugin-import-x` v4가 path alias 해석에 별도 resolver 요구                                  | `@/*` alias가 `import/no-restricted-paths`, `import/order` 등에서 인식되지 않음                                |
| `import-x/resolver-next` + `createTypeScriptImportResolver()` | 함수 호출 형태로 등록                                                                               | string `'typescript'`으로는 "is not a valid import resolver" 에러                                              |
| FSD import zone — feature별 enumerate                         | `target: './src/features/health', except: ['./health']` 형태로 feature마다 한 줄                    | `target: './src/features', from: './src/features'` 단일 규칙은 same-feature 내부 import도 차단                 |
| `vitest.config.ts`에 `esbuild: { jsx: 'automatic' }`          | tsconfig는 `jsx: preserve` (Next 빌드용)                                                            | vitest는 esbuild로 transform — preserve면 JSX가 그대로 남아 `React is not defined` 에러                        |
| `vitest.setup.ts`에서 `process.env.NEXT_PUBLIC_*` 스텁        | env.ts zod 검증을 통과시키기 위해                                                                   | env.ts가 모듈 로드 시 즉시 parse → 환경변수 없으면 throw로 테스트 부팅 실패                                    |
| `next.config.js`의 `transpilePackages` 명시                   | `@repo/ui`, `@repo/api-client`                                                                      | 워크스페이스 패키지를 Next가 자동으로 트랜스파일하도록 (소스 직접 export 패턴이라 필수)                        |
| logger를 `env.ts`에 의존시키지 않음                           | `process.env.NODE_ENV` 직접 read                                                                    | env → logger → env 순환 회피. NODE_ENV는 Node 표준이라 zod 검증 대상 외                                        |
| 데모 API를 `app/api/health/route.ts` Route Handler로          | baseUrl `http://localhost:3000/api`로 같은 origin                                                   | `https://api.example.com`은 placeholder라 dev에서 DNS 실패 → Route Handler 패턴(BFF) 시연 + 데모 즉시 동작     |
| api-client `buildUrl`을 string concat으로 수정                | `new URL(filled, baseUrl)` → `new URL(base + filled)`                                               | `new URL('/x', 'http://h/api')`가 path prefix를 잃어 `http://h/x`가 됨 — gateway baseUrl 패턴이 깨지는 실 버그 |

### 인수인계 메모

- **MSW + jsdom + api-client 조합 — fetch 캡쳐 타이밍 이슈**: `setupServer` → `beforeAll(server.listen)` → 테스트 파일 import 순서일 때, api-client가 모듈 로드 시점에 `fetch` ref를 잡으면 MSW 패치 전 stale ref. **해결: api-client에서 fetch를 호출 시점에 해석**. 이 패턴을 다른 클라이언트(Phase 5의 react-vite 포함)에도 동일하게 적용
- **Next 16 turbopack과 `.js` extension**: 워크스페이스 패키지가 `from './errors.js'` 형태로 import하면 turbopack이 `.ts` 파일을 못 찾음. webpack은 `extensionAlias`로 해결 가능하지만 turbopack은 미지원 → **소스에서 .js extension을 쓰지 않는 것이 호환성 측면에서 유일한 답**
- **@types/node 충돌**: apps에서 `@types/node ^22` 명시 + 다른 패키지 transitive에서 25 가져오면 둘 다 설치되어 `Response` 타입이 두 갈래로 분기. **루트 `pnpm.overrides`로 단일 버전 강제**가 가장 깔끔
- **import-x v4 resolver**: 최소 한 번은 명시적으로 `eslint-import-resolver-typescript` 설정. 이 패턴을 react-vite에도 동일하게 적용
- **FSD import zone 규약**: feature가 늘어날 때마다 `eslint.config.js`에 한 줄 추가 필요. 자동화하려면 동적 zone 생성 (예: `fs.readdirSync('./src/features')`)도 가능하지만 명시적 enumerate가 lint 룰 안정성 면에서 안전

---

## 구현 패턴 회고

- **에이전트 worktree 격리 병렬화**는 Phase 2/3에서 효과적 — 다만 첫 시도에 Bash 권한 문제로 한 번 실패. 두 번째 시도에서는 파일 작성만 시키고 Bash 작업은 메인 세션에서 처리하는 분담이 안정적
- **`@repo/config`의 strict TypeScript 옵션이 광범위한 영향**을 줌 — `noUncheckedIndexedAccess`는 SCSS Module 와일드카드 타입과 충돌, `verbatimModuleSyntax`는 `esModuleInterop` 비호환. 이런 충돌 케이스는 Phase 2/3 진행 중에 발견 → config 패키지 자체 수정보다는 사용처에서 명시적 타입 선언으로 우회
- **flat config 환경에서 패키지별 nested `eslint.config.js`는 작동하지 않음** — lint-staged가 root에서 실행되어 root config만 사용. 패키지별 오버라이드는 root config에서 `files:` glob으로 정의 (`**/scripts/**/*.ts`, `**/*.test.ts` 등)
- **README/CLAUDE.md 톤 통일** — 모든 패키지(`@repo/config`, `@repo/api-client`, `@repo/ui`)의 README는 "실제 라이브러리 레퍼런스 톤" (Why/How/Result/FAQ 제거, Installation/Usage/API 표 형식). CLAUDE.md는 중복 코드 블록 제거, 실제 파일 링크 위주. Phase 4/5 앱 문서도 동일 패턴 적용

---

## Phase 4/5 진입 전 체크리스트

Phase 4 (`apps/nextjs`) / Phase 5 (`apps/react-vite`)는 병렬 진행 가능. 진입 전 다음을 확인.

### 사용 가능한 패키지

- `@repo/config/eslint/next` (Phase 4) / `@repo/config/eslint/vite-react` (Phase 5)
- `@repo/config/typescript/next` / `@repo/config/typescript/vite`
- `@repo/api-client` — `createExampleClient`만 export됨 (실 서비스는 사용처에서 codegen 후 추가)
- `@repo/ui` — `Button`, `Card`, `CardHeader/Body/Footer`, `tokens.css`, `theme.css`, `reset.css`, `tokens` (TS 객체), `cn`

### 앱 tsconfig 권장 설정

```json
{
  "extends": "@repo/config/typescript/next", // 또는 vite
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "allowArbitraryExtensions": true // SCSS Modules 사용 시 필수 (ui 패키지에서 검증된 패턴)
  },
  "include": ["src", "next-env.d.ts"] // Vite는 next-env.d.ts 제외
}
```

### 앱 eslint.config.js 권장 패턴

```js
import nextConfig from '@repo/config/eslint/next' // 또는 vite-react

export default [
  ...nextConfig,
  {
    rules: {
      // FSD 스타일 import zone (앱 특화)
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: [
                './src/components',
                './src/hooks',
                './src/lib',
                './src/stores',
                './src/utils',
              ],
              from: ['./src/features', './src/app'],
            },
          ],
        },
      ],
    },
  },
]
```

### 루트 `eslint.config.js`에 추가할 ignore

앱이 들어오면 빌드 산출물 ignore 추가 필요:

- Next.js: `apps/*/.next/**`
- Vite: `apps/*/dist/**` (이미 `**/dist/**`로 커버됨)
- 둘 다: `apps/*/node_modules/**` (이미 `**/node_modules/**`로 커버됨)

### 글로벌 CSS import 위치

- **Next.js**: `apps/nextjs/src/app/layout.tsx`에서 `@repo/ui/reset.css`, `@repo/ui/tokens.css`, `@repo/ui/theme.css` import
- **Vite**: `apps/react-vite/src/main.tsx`에서 동일하게 import

### `@repo/api-client` 통합 패턴

- 데모용 `createExampleClient`는 그대로 두고 호출 예시로 사용
- 실 서비스 추가 시: `.env`에 `<SERVICE>_SWAGGER_URL` 추가 → `pnpm --filter=@repo/api-client generate` → `services/<name>.ts` 작성 → `index.ts` export 추가
- 앱은 `apps/<n>/src/lib/api-client.ts`에서 인스턴스 생성 (baseURL, getAuthToken, onUnauthorized 주입)

### MSW / 테스트 설정

- agent-plan.md 기준: MSW는 패키지 공통화 안 함, 앱별로 셋업 (`apps/<n>/src/testing/`)
- vitest 설정 패턴은 `@repo/ui` 사례 참고 (`globals: true`, `vitest.setup.ts`에서 `@testing-library/jest-dom/vitest` import)

### 환경변수 패턴

- 컴포넌트에서 `process.env` / `import.meta.env` 직접 접근 금지 (루트 CLAUDE.md 절대 규칙)
- 각 앱의 `src/config/env.ts` (또는 `src/lib/env.ts`)에서 zod로 검증된 객체 export
- 패키지(`@repo/api-client`, `@repo/ui`)는 환경변수를 직접 읽지 않음 — 앱이 인자로 주입

### 문서 톤 (Phase 0~3에서 확립된 패턴)

- **`apps/<n>/README.md`** — 실제 라이브러리 톤. Quick Start, 디렉토리 구조, 주요 패턴, 명령어. Why/How/Result/FAQ 금지
- **`apps/<n>/CLAUDE.md`** — 컨벤션, 의존 규칙, 변경 시 체크리스트. 중복 코드 블록 금지 (실제 파일 링크 위주)
- 두 문서 역할 분리는 루트 CLAUDE.md "문서화 원칙" 참조

### 알려진 제약 (Phase 2/3에서 발견, 앱에도 적용)

- `composite: true` + `rootDir: "src"` + 외부 파일(scripts, vitest.config) → ESLint projectService 에러 (`composite: false` + `rootDir: "."` + `include` 확장으로 해결)
- SCSS Modules 사용 시 `*.module.scss.d.ts` + `allowArbitraryExtensions: true` 둘 다 필수
- Storybook 설정 파일은 lint 대상 제외 (`**/.storybook/**` ignore)
- React 19에서는 `forwardRef` 사용 금지, ref를 일반 prop으로

### Phase 6 (통합 검증)에서 회수해야 할 것들

- 루트 CLAUDE.md "패키지 의존 규칙" 다이어그램이 실 구성과 일치하는지 확인
- 모든 README가 동일 톤 (Why/How/Result 금지)
- 모든 CLAUDE.md가 동일 톤 (중복 코드 블록 금지)
- 루트 CLAUDE.md 자체 경량화 (agent-plan.md "Phase 6" 섹션 참조)
