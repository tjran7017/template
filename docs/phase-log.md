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

### 이터레이션 (코드 리뷰 + 리팩토링 라운드)

초기 commit 이후 사용자 피드백으로 반복 개선. 결정 사항:

| 항목                                                                   | 결정                                                                                 | 이유                                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 페이지 try/catch 제거 → throw + `error.tsx` 위임                       | page.tsx가 직접 try/catch하지 않고 그냥 await. 실패는 segment의 `error.tsx`가 catch  | 현업 표준. page는 얇은 컨테이너, 에러 핸들링은 boundary 책임                                      |
| 데이터 fetcher를 `features/<n>/api/get-<n>.ts`로 분리                  | page.tsx가 fetch를 직접 호출 안 함                                                   | "page = features 조립만" 원칙. 다른 페이지/layout에서 재사용 가능                                 |
| `React.cache()` wrap 제거                                              | `getHealth = () => exampleApi.request(...)`만                                        | 한 곳에서만 호출하면 dedup 의미 없음. 여러 컴포넌트가 부르게 되면 그때 추가 (관례 아님)           |
| SSR streaming은 **async Server Component**로 (`use()` Client bridge X) | `<StatsPanelAsync promise={getStats()} />` + Suspense                                | `use()` + Client bridge는 함수 children RSC 직렬화 못 함. async SC가 더 단순하고 표준             |
| `use()` 데모는 일반 페이지에 안 넣음                                   | 데이터 페칭에 `use()`는 실무 anti-pattern. React Query/`useSuspenseQuery`가 표준     | `use()` 진짜 use case는 Context 조건부 read 정도. 데모로 일반화하면 오해                          |
| CSR도 Section 패턴 — page는 Server, 데이터 부분만 Client               | `HealthSection` ('use client') + `useQuery` + early-return 분기. page는 thin wrapper | 'use client' 범위를 leaf로 좁힘. SSR과 일관 (page = 조립만)                                       |
| Hook은 view-model 변환 X — 데이터/상태만 반환                          | `useHealth()`는 `useQuery` 결과 그대로                                               | 컴포넌트가 표시 분기 책임. 훅이 props 모양 반환하면 재사용성 ↓                                    |
| 컴포넌트 폴더 컨벤션 = `<name>/<name>.tsx + index.ts`                  | inner barrel + outer barrel 둘 다                                                    | @repo/ui (`button/button.tsx`)와 통일. 외부 import 짧게 (`from '@/features/.../components'`)      |
| api/도 barrel (`features/<n>/api/index.ts`)                            | server + client 함수를 같은 barrel에                                                 | 외부 import 통일. 단, vitest는 'server-only' 차단되므로 mock 필수                                 |
| `vi.mock('server-only', () => ({}))` in `vitest.setup.ts`              | api 배럴이 server+client 같이 export하는 구조 호환                                   | vitest는 Next의 tree-shake가 없어 'server-only' 모듈도 같이 로드 → throw                          |
| `<main>` inline style 제거 → `.page-container` 글로벌 클래스           | `globals.scss`에 정의                                                                | 페이지마다 같은 inline style 중복 제거                                                            |
| MSW handler URL을 wildcard (`*/api/health`)                            | baseUrl 변화에 영향 안 받음                                                          | 환경별로 baseUrl이 달라도 동일 핸들러 매치                                                        |
| `health-section.test.tsx` 통합 테스트 추가                             | MSW + RQ + Suspense 분기 (성공/HTTP 5xx/네트워크 실패)                               | 통합 시나리오 커버. 다른 Section 추가 시 같은 패턴 적용                                           |
| `optimizePackageImports: ['@repo/ui', '@repo/api-client']`             | `next.config.js`                                                                     | barrel을 빌드 타임에 직접 파일 경로로 재작성 — 'use client' 경계 가로지를 때 트리 셰이킹 정확도 ↑ |
| `package.json`에 `sideEffects: ["**/*.css", "**/*.scss"]`              | JS 모듈은 side-effect-free 가정                                                      | webpack 보수적 tree-shake 회피                                                                    |
| `ReactQueryDevtools` 활성화                                            | `providers.tsx`에서 `env.NEXT_PUBLIC_APP_ENV !== 'production'` 분기                  | dev에서 RQ 디버깅 표준. 동시에 NEXT_PUBLIC_APP_ENV 사용처 만들어 미사용 변수 해소                 |
| skeleton 애니메이션 (`pulse` 키프레임)                                 | globals.scss에 정의, stats-panel `.loading`에 적용                                   | 정적 placeholder 대신 시각적 로딩 피드백                                                          |
| `BackLink` 공통 컴포넌트 (`src/components/back-link/`)                 | hover 시 화살표 마이크로 인터랙션, focus-visible outline                             | 페이지 3곳에서 반복되던 `<Link href="/">← 홈</Link>` 추출                                         |
| Stats 변형은 같은 파일에 (`StatsPanel` + `StatsPanelAsync`)            | `health-section`은 분기 무거워 별도 폴더                                             | 컴포넌트 무게에 따라 — 단순 변형은 co-locate, 분기 로직 두꺼우면 분리                             |

### 컨벤션 회고 (이 단계에서 확립)

- **컴포넌트 폴더 = `<name>/<name>.tsx + index.ts` (+ scss/scss.d.ts/test)** — 모든 컴포넌트(앱/패키지) 통일. inner barrel은 외부 import를 짧게, 자기 폴더 내 import는 직접 파일
- **데이터 페칭 분리 = `features/<n>/api/{get-<n>.ts ('server-only'), use-<n>.ts ('use client')}` + barrel** — server/client 두 함수를 같은 barrel로 노출 (vitest 호환은 setup mock으로)
- **Page는 fetcher만 호출, 분기 책임은 Section/error.tsx에 위임** — page.tsx는 진짜 thin
- **streaming SSR = async Server Component + Suspense + Promise prop** — `use()` 안 씀. 함수가 RSC 직렬화 못 하므로 render-prop 안 됨
- **모든 라우트에 error.tsx + loading.tsx 동반 검토** — Next App Router 표준 컨벤션

### Phase 5/6에서 추가로 적용할 것 (Phase 4에서 안 한 것)

- `apps/nextjs`에는 미적용 (의도적):
  - 통합 테스트 — `health-section`만 있음. `stats-panel-async` (async SC) 테스트 미작성
  - logger의 외부 transport 추상화 (Sentry/Datadog 등) — 데모 단계에선 console-only
  - `/login` stub 페이지 — `client.ts`의 `onUnauthorized`가 redirect하는 경로지만 미구현
  - Bundle analyzer (`@next/bundle-analyzer`) — Next 16의 turbopack과 webpack 분리 이슈로 일단 제외

---

## Phase 5 — 완료 ✅

**브랜치**: `feat/phase-5-react-vite`
**선행 조건**: Phase 1, 2, 3 완료 후 진입 (Phase 4와 병렬 가능 — 본 작업은 Phase 4 머지 후 순차 진행)

### 결정 사항

| 항목                                     | 결정                                                                                   | 이유                                                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 컴포넌트 폴더 컨벤션                     | `apps/nextjs`와 통일 (`<name>/<name>.tsx + index.ts` + outer barrel)                   | 두 앱 통일 — react-vite/CLAUDE.md 초안의 "배럴 안 씀" 규약은 폐기. Vite도 트리 셰이킹 OK                                 |
| 데모 페이지 범위                         | `/` (홈) + `/health` (CSR + useQuery) + `/*` (NotFound) — 한 도메인                    | SPA에 SSR/streaming 패턴 시연이 의미 없음. CSR 분기 한 패턴이 핵심                                                       |
| Storybook                                | 추가 안 함                                                                             | `@repo/ui`에서 이미 커버 — 앱 자체 스토리북 중복                                                                         |
| MSW dev 활성화                           | `msw/browser` `setupWorker` + `main.tsx`에서 dev 분기                                  | SPA는 자체 BFF가 없음. 백엔드 placeholder URL이라 dev에서 fetch 실패 → MSW worker가 가로채야 데모 동작                   |
| MSW handlers 공유                        | `mocks/handlers.ts` 단일 파일 → `server.ts`(node)와 `browser.ts`(worker) 양쪽이 import | 응답 시나리오를 한 곳에서 정의 — 테스트와 dev 데모가 같은 mock 사용                                                      |
| `public/mockServiceWorker.js` 커밋       | `pnpm exec msw init public/`로 한 번 생성 후 커밋                                      | gitignore하면 신규 클론 시 dev 데모가 깨짐. 생성물이지만 안정                                                            |
| MSW worker 부트 실패 시 fail-soft        | `try/catch` + `logger.warn`                                                            | 워커 파일 누락 / 프로덕션 기동 분기 — `enableMocking()` 실패해도 앱은 마운트                                             |
| 라우트 lazy 패턴                         | `lazy(() => import('./routes/x').then(m => ({ default: m.XRoute })))`                  | 라우트 컴포넌트는 named export(파일별 명시적 이름) — default export 강제 회피 + lazy chunk 분리                          |
| `<Suspense>` 위치                        | `app.tsx`의 `<RouterProvider>` 바깥                                                    | 라우트 lazy 전환 시 fallback. 라우트별 fallback이 필요해지면 route 정의에 `loader/HydrateFallback` 추가                  |
| `errorElement` 위치                      | 루트 라우트(`/`)에만 우선 적용                                                         | 페이지별로 boundary가 필요해지면 자식 route에 추가. 라우트 단위 격리 가능                                                |
| `import.meta.env` 강제                   | `no-restricted-syntax` (selector로 `MetaProperty + member 'env'` 매치)                 | `no-restricted-properties`는 `import.meta` 같은 `MetaProperty`에 안 통함 — selector가 유일한 길                          |
| `ImportMetaEnv` augment 필수             | `src/vite-env.d.ts` 수동 작성                                                          | vite/client 기본 타입은 unknown VITE\_ 변수에 `any` 반환 → `no-unsafe-assignment` 발생. zod 입력은 명시 string 타입 필요 |
| `tsconfig.json` `types: ["vite/client"]` | 명시                                                                                   | 기본 `@types/*` 자동 포함 끄고 vite 타입만. node 타입 새는 것 회피                                                       |
| `vitest.setup.ts`의 env stub 캐스트      | `import.meta.env as Record<string, string \| undefined>`                               | `ImportMetaEnv` 모든 속성이 readonly로 augment돼 직접 할당 불가. mutable 캐스트로 우회                                   |
| 빌드 스크립트                            | `tsc -b --noEmit && vite build`                                                        | tsc는 strict 검증, vite는 번들. 두 단계 분리로 타입 에러를 빌드 실패로 즉시 인지                                         |
| `vite.config.ts` `manualChunks`          | `react`, `router`, `query`로 분리                                                      | 초기 번들 캐시 안정성. 앱 코드 변경 시 vendor chunk hash 유지                                                            |
| `analyze` 스크립트                       | `ANALYZE=1 vite build` + `rollup-plugin-visualizer`                                    | env 플래그로 활성화 — 일반 빌드 영향 X. `dist/stats.html` 자동 open                                                      |
| `transpilePackages` 명시 안 함           | Vite는 워크스페이스 소스를 자동 처리                                                   | Next의 `transpilePackages`는 webpack 한정. Vite + esbuild는 모노레포 alias만으로 동작                                    |
| `react-router-dom` 안 씀                 | `react-router` 단일 import                                                             | v7부터 `react-router-dom`은 폐기 — 단일 패키지로 통합                                                                    |
| `BackLink`의 `href` prop                 | `string` 타입 (Next는 `ComponentProps<typeof Link>['href']`)                           | react-router의 `Link`는 `to: To` (string \| Path 객체)지만 데모용은 string으로 충분                                      |

### 인수인계 메모

- **MSW worker 파일은 `public/`에 커밋된 정적 파일** — `pnpm exec msw init public/` 실행 시 `package.json`에 `msw.workerDirectory` 필드 자동 추가 (이건 `msw upgrade` 시 재생성을 위한 메타데이터)
- **dev에서 SPA fallback이 `/api/*`도 가로채는 문제** — `curl http://localhost:5173/api/health`는 Vite의 SPA fallback이라 `index.html` 응답. MSW worker는 브라우저 컨텍스트에서만 동작 → 실 브라우저 테스트 필요
- **React Router 7 `lazy` 패턴**: named export를 default로 변환하는 wrapper가 필수 (`then(m => ({ default: m.HealthRoute }))`) — default export 강제하지 않으면서 lazy 가능
- **`ImportMetaEnv` augment 위치**: `src/vite-env.d.ts` (vite 표준). `tsconfig.json`의 `include`에 `src`가 들어가면 자동 인식
- **테스트 setup의 mutable cast 패턴**은 readonly 강제와 stub 필요성을 모두 만족하는 표준 트릭 — Phase 4의 `vitest.setup.ts`에서 `process.env`를 직접 할당하던 것과 다름 (Node 환경은 `process.env`가 mutable, Vite는 readonly augment)
- **`@types/node` 25 transitive 충돌**은 Phase 4의 `pnpm.overrides`로 이미 해결 — Phase 5에서 추가 설정 불필요

### 컨벤션 회고 (이 단계에서 확립 / 강화)

- **두 앱이 같은 폴더 컨벤션** — Phase 4의 `<name>/<name>.tsx + index.ts` 패턴이 Vite에서도 동작 (트리 셰이킹 영향 없음). 향후 새 앱도 동일 패턴
- **MSW handlers 단일 파일이 server + browser 둘 다 공급** — Phase 4는 `msw/node`만, Phase 5에서 `msw/browser` 추가. 양쪽이 같은 mock 정의를 공유하는 구조
- **`@repo/api-client` 통합 패턴**이 Next/Vite 모두 동일 — `lib/api-client.{ts|server.ts|client.ts}`에서 인스턴스 생성, lazy `getAuthToken` getter

### 이터레이션 — SPA 관점 리팩토링 라운드

초기 commit은 nextjs 패턴을 일대일로 이식했으나, "SPA 답지 않다"는 리뷰 후 다음을 수정. **Server Component 모델 산물인 indirection 제거**가 핵심:

| 항목                              | Before (nextjs 이식)                                                                                         | After (SPA idiomatic)                                                                                                            | 이유                                                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 데이터 페칭 레이어                | `HealthRoute` → `HealthSection` ('use client' + useQuery + 분기) → `HealthStatus` (presentational) — 3 layer | `HealthRoute` (Component)가 직접 useHealth + 분기 → `HealthStatus` 매핑 — 2 layer                                                | SPA에는 'use client' 경계가 없어 Section이 indirection만 됨                                                                                               |
| `features/<n>/api/` 폴더 + barrel | `api/{get-x.ts, use-x.ts, index.ts}` (nextjs)                                                                | `features/<n>/queries.ts` 단일 파일 (배럴 X) — _후속 "구조 정착 라운드"에서 `api/{queries,mutations}.ts + index.ts`로 다시 묶음_ | server/client 분리 대신 read/write 분리. SPA는 둘 다 client라 두 파일이면 충분                                                                            |
| route 컴포넌트 export             | `lazy(() => import('./routes/x').then(m => ({ default: m.XRoute })))` wrapper × 라우트 수                    | `Component` named export + `lazy: () => import('./routes/x')` (route-level lazy)                                                 | react-router 7 표준. 보일러플레이트 제거 + `loader`/`ErrorBoundary`도 같은 모듈에서 export 가능                                                           |
| `<Suspense>`                      | `app.tsx`의 `<RouterProvider>` 바깥에 wrap (React.lazy 호환용)                                               | 제거 — react-router 7 route-level lazy가 자체 처리                                                                               | route lazy는 React Suspense를 throw하지 않음. 외부 Suspense 불필요                                                                                        |
| `HealthStatusProps`               | discriminated union (`'loading' \| 'ok' \| 'fail'`)                                                          | `{ label: string; tone?: 'ok' \| 'fail' }`                                                                                       | Next 데모는 streaming SSR 시 같은 컴포넌트가 loading/data 둘 다라 union이 의미 — SPA는 useQuery 분기가 라우트에 있어 컴포넌트는 (tone, label)만 받으면 됨 |
| MSW dev 활성화                    | `import.meta.env.DEV`이면 항상 worker.start                                                                  | `env.VITE_USE_MOCK === '1'`일 때만                                                                                               | 실 백엔드 붙일 때 main.tsx 수정 없이 `.env.local` 한 줄로 끔. production에서도 worker chunk가 dynamic import + 분기로 미로드                              |
| `ErrorBoundary` 위치              | `RootErrorBoundary`를 `errorElement`에 직접 element로 전달                                                   | route 모듈에서 `ErrorBoundary` named export → 부모 route가 `lazy: () => import('./routes/root-error-boundary')`로 흡수           | route-level lazy 패턴과 일관 — 모든 라우트 모듈이 같은 export 형태                                                                                        |
| 통합 테스트 위치                  | `features/health/components/health-section/health-section.test.tsx`                                          | `app/routes/health.test.tsx` (`MemoryRouter` wrap)                                                                               | Section 제거에 따라. 통합 시나리오는 라우트 단위로 검증                                                                                                   |
| 컴포넌트 폴더 + inner barrel      | 유지 (`<name>/index.ts` + outer barrel)                                                                      | **유지** (사용자 결정 — SPA에서도 일관성 우선)                                                                                   | nextjs와 통일. 트리 셰이킹 영향 X                                                                                                                         |

#### SPA가 nextjs와 의도적으로 다른 부분 (정착)

- **page = thin container 원칙 안 강제**: nextjs는 RSC 경계 때문에 page.tsx가 얇아야 하지만, SPA의 라우트 컴포넌트는 데이터 페칭/분기를 직접 — 재사용이 정말 필요할 때만 추출
- **features는 평평**: `queries.ts` 단일 파일. 여러 query/mutation이 늘면 도메인별로 추가 파일 (e.g. `mutations.ts`) 그래도 폴더는 여전히 X
- **`Section` 명명 안 씀**: `<HealthCard>`, `<HealthView>`, `<HealthPanel>` 같은 view-역할 명명 사용. `Section`은 nextjs의 'use client' 경계를 가리키는 잔재
- **discriminated union props 보수적**: 단순 데이터 표시는 그냥 props (`label + tone`). 진짜 상태 머신(예: stepper, wizard)에서만 union

### 이터레이션 — useSuspenseQuery + 라우트 boundary 위임 라운드

이전 라운드는 라우트가 `useQuery` + 분기 + mapping을 직접 했지만, **데모 코드 + 분기 책임 분산** 문제로 다시 리뷰 → SPA 표준 패턴(`useSuspenseQuery` + 라우트 boundary)으로 재정착:

| 항목                      | Before (early return + mapping)                                                     | After (suspense + boundary)                                                           | 이유                                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `useHealth`               | `useQuery` (`{ data?, isLoading, error }`)                                          | `useSuspenseQuery` (`{ data }` 항상 정의)                                             | suspense가 표준 — loading/error 분기 책임을 인프라(Suspense, ErrorBoundary)로 위임                     |
| `health.tsx` 본문         | `toDisplay(useHealth())` 헬퍼 + `(tone, label)` 매핑                                | `const { data } = useHealth()` happy path만                                           | 분기 코드 0줄. 페이지가 의미 있는 컨텐츠만 표현                                                        |
| 로딩 표시                 | 인라인 텍스트 ("확인 중…") + 같은 컴포넌트가 분기 별 다른 모양                      | `root.tsx`의 `<Suspense fallback>` (전역 fallback)                                    | 라우트 단위 통일된 로딩 UX, 페이지 코드 단순화                                                         |
| 에러 표시                 | 인라인 (`HealthStatus tone="fail"`)                                                 | `root.tsx`의 `ErrorBoundary` (`useRouteError()`로 메시지 표시)                        | 라우트별 에러 격리, 사용자 친화 폴백 UI 한 곳                                                          |
| `root-error-boundary.tsx` | only `ErrorBoundary` export                                                         | `root.tsx`로 rename + `Component` (`<Suspense><Outlet /></Suspense>`) 추가            | 루트 라우트 모듈에 layout + error boundary 둘 다. 의미상 "root"가 더 정확                              |
| `HealthStatusTone` import | 라우트가 컴포넌트 내부 타입에 의존                                                  | outer barrel에서 노출 제거 (컴포넌트 내부 타입)                                       | 라우트는 도메인 데이터(`string`, `boolean`)만 컴포넌트에 전달 — 결합도 ↓                               |
| 라우트 함수 export        | `export function HealthPage()` (직접 export) + `export { HealthPage as Component }` | `function HealthPage()` (named declaration) + `export { HealthPage as Component }` 만 | named declaration이 스택트레이스/DevTools 이름 보존 — `export` 중복은 외부 노출 표면만 늘림            |
| 통합 테스트               | `MemoryRouter` + 라우트 컴포넌트 직접 마운트                                        | `createMemoryRouter`에 root.tsx + 라우트 둘 다 lazy 등록 + `RouterProvider`           | 실 production 라우터 wiring(Suspense+ErrorBoundary)까지 통합 검증. 에러 케이스가 실제 폴백 UI로 검증됨 |
| 에러 테스트 assertion     | 인라인 에러 텍스트 (`HTTP 503`, `연결 실패`)                                        | 루트 ErrorBoundary 헤딩 (`문제가 발생했어요`)                                         | UI 책임 일치 — 페이지 자체에 에러 분기 없으므로 폴백 UI 검증                                           |

#### 트레이드오프

- **장점**: 페이지 본문 50% 축소, loading/error 분기 책임이 인프라로, mutation 외 모든 페이지가 같은 패턴, 통합 테스트가 production 인프라까지 검증
- **단점**: route boundary 인프라가 _반드시_ 있어야 함. 새 라우트 추가 시 root.tsx의 Suspense/ErrorBoundary가 자동 적용되지만, 도메인별 격리가 필요하면 자식 라우트에 자체 boundary 추가 필요
- **`useSuspenseQuery` 안 쓰는 케이스**: 데이터가 옵션 (있으면 보너스), 인터랙션 후 fetch (검색 입력 등) — 이 둘은 일반 `useQuery` 유지

### 데모 확장 — orders 도메인 (목록 + 폼)

react-vite가 `/health` 한 페이지뿐이라 SPA 핵심 패턴 일부만 시연 → **주문 도메인** 2 페이지 추가:

| 항목                                    | 내용                                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/orders`                               | `useSuspenseQuery`로 주문 목록 조회. `OrderList` presentational 컴포넌트가 렌더                                                                                       |
| `/orders/new`                           | `react-hook-form + zodResolver` 폼 + `useMutation` 제출. 성공 시 `invalidateQueries` + `navigate('/orders')`                                                          |
| `features/order/api/queries.ts`         | `useOrders` (suspense) + `orderKeys` 팩토리                                                                                                                           |
| `features/order/api/mutations.ts`       | `useCreateOrder` — `mutationFn` + `onSuccess`에서 list invalidate                                                                                                     |
| `features/order/components/order-list/` | presentational 리스트 (빈 상태 + 행 렌더). Intl.DateTimeFormat으로 한국어 날짜                                                                                        |
| `features/order/components/order-form/` | `react-hook-form + zodResolver` + `useCreateOrder` 통합. 라우트는 `<OrderForm onSuccess={() => navigate('/orders')} />` 한 줄. 폼 검증/제출/에러 표시는 컴포넌트 내부 |
| MSW handlers                            | in-memory `orders[]` + `nextId`. `resetOrders()` 헬퍼 export → 테스트 `beforeEach`에서 초기화                                                                         |
| api-client `services/example.ts`        | `/orders` GET/POST 타입 inline 추가 (데모 서비스 확장)                                                                                                                |
| 통합 테스트                             | `routes/order/list/list.test.tsx` — 목록 표시 + ErrorBoundary 캐치 (2건). `createMemoryRouter` + root.tsx 합성                                                        |
| 의존성 추가                             | `@hookform/resolvers` (zod ↔ react-hook-form 연결, 표준 패턴)                                                                                                         |

#### 패턴 정착

- **`features/<n>/{queries,mutations}.ts` 분리** — read와 write를 다른 파일로. 같은 도메인이라 `orderKeys`는 `queries.ts`에 두고 mutations에서 import (cross-file 같은 폴더, 직접 경로)
- **mutation 후 `invalidateQueries` 패턴** — 옵티미스틱 업데이트 안 할 때 가장 단순. 옵티미스틱은 `onMutate` + `setQueryData` 추가
- **폼 = react-hook-form + zod + useMutation 조합** — submit 핸들러는 `handleSubmit((values) => mutate(values, { onSuccess: navigate }))`. 단순.
- **`<form onSubmit={(e) => void onSubmit(e)}>` 패턴** — `handleSubmit`이 Promise<void>를 반환해 `no-misused-promises` 룰에 걸림. `void` 캐스트가 표준 회피
- **MSW in-memory 상태 + `resetOrders()` 헬퍼** — POST 핸들러가 mutate한 상태를 다음 테스트에서 격리하기 위해. `beforeEach(resetOrders)`

### 이터레이션 — 구조 정착 라운드

데모 확장(orders) 직후 _명명·폴더·import 표면을 한 번에 정리_. 이 라운드의 결정으로 react-vite 구조가 최종 형태로 굳어짐:

| 항목                                     | Before                                                      | After                                                                                    | 이유                                                                                                                    |
| ---------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 라우트 함수명                            | `Component` (export 이름과 동일)                            | `HealthStatusPage` / `HomePage` 등 명시 함수명 + `export { XxxPage as Component }` alias | 스택 트레이스/DevTools 가독성 — `Component` 단독은 의미 없음                                                            |
| 라우트 export 표면                       | `export function HealthPage` (직접 export)                  | `function HealthPage` (named declaration, export X) + alias만 노출                       | 외부 진입점은 `Component` 하나로 단일화                                                                                 |
| `routes/<n>/index.ts` 배럴               | health/orders 각 폴더에 barrel                              | **제거** — router가 view 파일을 직접 lazy import                                         | 외부 import 표면이 router.tsx 한 곳뿐이라 barrel 가치 X                                                                 |
| view 파일명                              | `health/health.tsx`, `orders/orders.tsx` (folder/file 동일) | `health/status/status.tsx`, `order/list/list.tsx` 등 view 명시                           | 한 도메인에 view 여러 개 가능해짐 (예: `/health/incidents`)                                                             |
| 라우트 도메인 폴더                       | `routes/orders/` (plural)                                   | `routes/order/` (singular)                                                               | 도메인 entity = singular 컨벤션 통일 (health도 singular)                                                                |
| view 폴더                                | view가 단일 파일이면 도메인 폴더 직속 (`health/status.tsx`) | view마다 폴더 (`health/status/{status.tsx, status.test.tsx}`)                            | 테스트/scss 등 보조 파일이 늘어도 일관 — 컴포넌트 컨벤션과 동일                                                         |
| `features/orders/`                       | plural                                                      | `features/order/` (singular) — 라우트와 통일                                             | health/order 모두 단수, 도메인 entity 명명 일관                                                                         |
| `features/<n>/` 평면 (Phase 5 초기 결정) | `queries.ts` + `mutations.ts` 평면, barrel 없음             | `features/<n>/api/{index.ts, queries.ts, mutations.ts}` 폴더 + outer barrel              | feature가 커질 때 cross-cut 영역(api / components / hooks 등) 분리 여지 확보. import 진입점도 `@/features/<n>/api` 단일 |
| 폼 위치                                  | `routes/order/new/new.tsx` 인라인 (~120줄)                  | `features/order/components/order-form/` 컴포넌트 (~85줄) + 라우트는 30줄                 | 라우트 happy-path 원칙과 일관 — mutation hook까지 폼이 캡슐화, 라우트는 `<OrderForm onSuccess={navigate} />`            |
| `HealthStatusTone` 외부 노출             | `features/health/components/index.ts`에서 re-export         | 제거 (컴포넌트 내부 타입)                                                                | 라우트가 컴포넌트 내부 타입에 의존 X — 결합도 ↓                                                                         |

#### 패턴 정착 (이 라운드 이후 굳어진 컨벤션)

- **라우트 모듈 = `<view>.tsx` 안에 named function + `Component` alias** — 모든 라우트가 같은 export 모양
- **`routes/<domain>/<view>/<view>.tsx`** — 폴더 깊이는 일정, 파일명만 의미 부여
- **`features/<domain>/{api,components}/index.ts` outer barrel** — feature는 두 진입점만 노출 (`@/features/<n>/api`, `@/features/<n>/components`)
- **단수 도메인 명명** — `health`, `order` (URL은 `/orders` plural 유지 — REST collection 의미)
- **폼 컴포넌트가 mutation hook 소유** — 라우트는 callback (`onSuccess`)만 주입
- **`api/queries.ts`(useSuspenseQuery)와 `api/mutations.ts`(useMutation) 분리** — read/write가 다른 파일
  - `react-hook-form` 데모 — 패키지는 설치만 (Phase 6에서 form feature 데모 추가 검토)
  - `loader` 사용 데모 — React Query만으로 충분한 단순 케이스라 미사용. 페이지 진입 시 prefetch가 필요해지면 `queryClient.prefetchQuery` 패턴 추가
  - `<ProtectedRoute>` 래퍼 — auth feature가 없어 미구현
  - 다크모드 토글 — `data-theme` 인프라는 있으나 토글 UI 없음
  - 가상화 데모 — 큰 리스트 demo가 없어 보류

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
