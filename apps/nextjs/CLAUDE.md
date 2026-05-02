# nextjs

Next.js 16 (App Router) 기반 앱 베이스 템플릿. feature 단위 모듈 + 단방향 의존 + RSC streaming/CSR Suspense 패턴 데모.

> **상위 문서:** 루트 `CLAUDE.md` (모노레포 공통 규칙)
> **이 문서가 우선:** Next.js 특화 결정 — 디렉토리 구조, 데이터 페칭 패턴, 의존 규칙

## 앱 목적

SSR / SEO / BFF가 필요한 프로젝트의 출발점. SPA로 충분한 경우는 `apps/react-vite`.

## 기술 스택

- **Next.js 16** (App Router, Turbopack 기본)
- **React 19** + **TypeScript** strict
- **React Query 5** — Client-side server state (+ Devtools, dev only)
- **Zustand** — 전역 클라이언트 상태
- **react-hook-form + zod** — 폼/검증 / **zod** — 환경변수 검증
- **SCSS Modules** — `.module.scss + .module.scss.d.ts` 페어
- **Vitest** + **MSW 2** + **@testing-library/react** + **jest-axe**
- **`@repo/ui`**, **`@repo/api-client`** (workspace)

## 디렉토리 구조

App Router는 `app/`을 라우팅에 점유. 앱 초기화(프로바이더 등)는 `app/providers.tsx`.

`packages/*`가 대신 제공하는 폴더는 앱에서 제거됨:

| 일반 React 폴더          | 이 템플릿 처리                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `src/types/` (전역 타입) | API 타입은 `@repo/api-client`의 namespace, UI 타입은 `@repo/ui`. 앱 전역 타입 생기면 `lib/` |
| `src/assets/`            | Next의 `public/`                                                                            |
| `features/<n>/types/`    | API 타입은 `@repo/api-client`, 그 외는 같은 feature 안에서 직접 정의                        |

```
apps/nextjs/
├── src/
│   ├── app/                      Next App Router (라우팅 + 레이아웃)
│   │   ├── api/<route>/route.ts  Route Handlers (BFF)
│   │   ├── <segment>/
│   │   │   ├── page.tsx          페이지 (얇은 컨테이너)
│   │   │   ├── loading.tsx       자동 Suspense fallback
│   │   │   └── error.tsx         자동 Error Boundary ('use client')
│   │   ├── layout.tsx
│   │   ├── providers.tsx         QueryClientProvider + Devtools (dev only)
│   │   └── globals.scss          @repo/ui CSS import + .page-container + 키프레임
│   ├── components/               앱 전용 위젯 (디자인 시스템은 @repo/ui)
│   │   ├── index.ts              outer barrel
│   │   └── <name>/
│   │       ├── index.ts          inner barrel
│   │       └── <name>.tsx
│   ├── config/env.ts             zod 검증된 환경변수 (process.env 직접 접근 금지)
│   ├── features/                 기능 단위 모듈
│   │   └── <name>/
│   │       ├── api/
│   │       │   ├── index.ts      barrel (server + client 함수 모두)
│   │       │   ├── get-<n>.ts    'server-only'
│   │       │   └── use-<n>.ts    'use client' + RQ
│   │       └── components/
│   │           ├── index.ts      outer barrel
│   │           └── <name>/
│   │               ├── index.ts  inner barrel
│   │               ├── <name>.tsx
│   │               ├── <name>.module.scss
│   │               ├── <name>.module.scss.d.ts
│   │               └── <name>.test.tsx
│   ├── lib/
│   │   ├── api-client/
│   │   │   ├── server.ts         'server-only' — 서비스 인스턴스
│   │   │   └── client.ts         'use client' — 서비스 인스턴스 (zustand 토큰)
│   │   └── logger.ts
│   ├── stores/                   전역 zustand store
│   └── testing/
│       ├── mocks/{handlers,server}.ts
│       └── test-utils.tsx        renderWithProviders (QueryClient wrapper)
├── public/
├── .env.example / .env.local (gitignored)
├── next.config.js                transpilePackages + optimizePackageImports
├── tsconfig.json                 extends @repo/config/typescript/next + allowArbitraryExtensions
├── vitest.config.ts              jsdom + globals + esbuild jsx automatic
├── vitest.setup.ts               vi.mock('server-only') + env stub + MSW listen
└── package.json                  sideEffects: ["**/*.css","**/*.scss"]
```

> **`components/` vs `@repo/ui` 구분**
>
> - `@repo/ui`: 도메인 비종속 디자인 시스템 (Button, Card 등)
> - `components/`: 이 앱 전용 위젯 (BackLink 등 — 페이지/feature 모두에서 재사용)
> - 두 앱이 같은 패턴을 쓰면 `@repo/ui`로 추출

## 컴포넌트 폴더 컨벤션

각 컴포넌트는 자체 폴더 + inner barrel:

```
<name>/
├── index.ts              export { Foo } from './foo'
├── <name>.tsx            컴포넌트 본체
├── <name>.module.scss    (필요 시)
├── <name>.module.scss.d.ts (필요 시 — 명시적 클래스 타입)
└── <name>.test.tsx       (필요 시)
```

**outer barrel** (`<카테고리>/index.ts`)이 외부에 노출:

```ts
// features/health/components/index.ts
export { HealthSection } from './health-section'
export { HealthStatus, type HealthState } from './health-status'
```

**Import 규칙:**

- 외부에서: barrel 사용 (`from '@/features/health/components'`)
- 같은 폴더 안: 직접 파일 (자기 자신 barrel 참조 회피)
- 같은 카테고리 cross-folder: inner barrel (`from '../health-status'`)

> **분리 vs 같은 파일**: 단순한 변형(예: `StatsPanelAsync`는 `StatsPanel`의 async wrapper)은 같은 파일에 둠. 분기 로직이 두꺼우면 (예: `HealthSection`이 useHealth + 분기) 별도 폴더.

## 의존 방향 규칙 (단방향, ESLint 강제)

```
app  ──→  features  ──→  shared modules (components, hooks, lib, stores, utils)
                                       ↑
                                  app도 직접 import 가능
```

원칙:

1. shared modules는 features/app을 import 못 함
2. features/\* 끼리 import 금지 — 공유 필요시 shared로 끌어올리거나 app에서 조립
3. app/는 features와 shared 모두 import 가능
4. page.tsx는 **얇은 컨테이너** — features를 import해서 조립만, 비즈니스 로직 X

루트 [`eslint.config.js`](../../eslint.config.js)에서 `import/no-restricted-paths`로 강제. **새 feature 추가 시 zone 한 줄 추가** (`{ target: './apps/nextjs/src/features/<n>', from: './apps/nextjs/src/features', except: ['./<n>'] }`).

## App Router 사용 규칙

### Server / Client 컴포넌트

- **Server Component 기본** — `'use client'`는 인터랙션 leaf만
- 데이터 페칭: 가능한 한 Server Component에서 직접 (서버 fetch + cache)
- 클라이언트 측 갱신/뮤테이션: React Query
- React 19: `ref`를 prop으로 직접 (`forwardRef` X)

### 라우팅

- `page.tsx` = 얇은 컨테이너 (features 조립만)
- 라우트 그룹 `(group)/`으로 도메인별 묶기 권장
- **`error.tsx` + `loading.tsx`를 라우트마다 둘 것** (`'use client'` 필수 / 정적)
- 동적 세그먼트 파라미터는 zod 검증

### Route Handlers (BFF)

- 시크릿/내부 토큰이 필요하면 클라이언트가 아니라 Route Handler 경유
- 입력(body/query)을 zod 검증
- 에러 포맷 일관 (예: `{ ok: false, error: { code, message } }`)
- 캐싱은 `next/cache`의 `revalidateTag`/`revalidatePath`

## 데이터 페칭 패턴

### 1) SSR — page-level await (blocking)

페이지 본체가 데이터를 기다린 뒤 렌더. **SEO 결정 정보, above-the-fold, 없으면 화면이 의미 없는 데이터**에 적합. 실패는 throw → `error.tsx`가 처리.

```ts
// features/<n>/api/get-<n>.ts
import 'server-only'
import { exampleApi } from '@/lib/api-client/server'

export const getHealth = () => exampleApi.request('/health', { method: 'get' })
```

```tsx
// app/<seg>/page.tsx
const data = await getHealth()
return <HealthStatus state="ok" label={data.status} />
```

### 2) SSR — async Server Component + Suspense (streaming)

page에서 Promise만 시작 (await X) → async sub-component가 await → Promise throw → 부모 `<Suspense>`가 fallback → resolve 후 RSC 청크로 스트리밍 hydrate. **느린 쿼리, 보조 정보, panel 단위 fail 격리**에 적합.

```tsx
// features/<feature>/components/<component>/<component>.tsx
export type FooPanelProps =
  | { state: 'loading' } | { state: 'fail' } | { state: 'ok'; ... }

export function FooPanel(props: FooPanelProps) { ... }

export async function FooPanelAsync({ promise }: { promise: Promise<FooPanelProps> }) {
  return <FooPanel {...await promise} />
}
```

```tsx
// page.tsx
const fooPromise = getFoo()
return (
  <Suspense fallback={<FooPanel state="loading" />}>
    <FooPanelAsync promise={fooPromise} />
  </Suspense>
)
```

> **`use()` 훅 사용 안 함** — Promise는 RSC payload로 직렬화되지만 함수(render-prop)는 안 됨. async Server Component 패턴이 더 단순하고 표준. `use()`는 Context 조건부 read 같은 실제 use case에서만.

### 3) CSR — Client Component + React Query

page는 Server Component, 데이터 페칭이 필요한 부분만 'use client' Section.

```ts
// features/<n>/api/use-<n>.ts
'use client'
import { useQuery } from '@tanstack/react-query'
import { exampleApi } from '@/lib/api-client/client'

export const fooKeys = {
  all: ['foo'] as const,
  status: () => [...fooKeys.all, 'status'] as const,
}

export function useFoo() {
  return useQuery({
    queryKey: fooKeys.status(),
    queryFn: () => exampleApi.request('/foo', { method: 'get' }),
  })
}
```

```tsx
// features/<feature>/components/<component>/<component>.tsx
'use client'
import { useFoo } from '../../api'

export function FooSection({ prefix }: { prefix?: string }) {
  const { data, isLoading, error } = useFoo()
  if (isLoading) return <FooStatus state="loading" ... />
  if (error) return <FooStatus state="fail" label={...} />
  return <FooStatus state="ok" label={data?.status ?? 'unknown'} />
}
```

```tsx
// app/csr/page.tsx (Server Component)
return (
  <main className="page-container">
    <FooSection prefix="CSR" />
  </main>
)
```

> **쿼리 키는 팩토리 객체로** (`fooKeys.status()`) — 매직 스트링 금지

## 환경변수

- `src/config/env.ts`만 `process.env` 접근 (ESLint `no-restricted-properties`로 강제)
- 클라이언트 노출 변수는 `NEXT_PUBLIC_` 프리픽스
- `NEXT_PUBLIC_APP_ENV` (development/staging/production)는 dev-only 기능 분기에 사용 (`providers.tsx`의 ReactQueryDevtools 등)
- 컴포넌트는 항상 `import { env } from '@/config/env'`

`logger.ts`는 예외 — `process.env.NODE_ENV`만 직접 read (env.ts ↔ logger 순환 회피, NODE_ENV는 Node 표준)

## API 클라이언트

- `src/lib/api-client/`에서 server/client 컨텍스트 인스턴스 분리
  - `server.ts`: `'server-only'`, 쿠키/헤더 기반 인증
  - `client.ts`: `'use client'`, zustand 토큰 + 401 redirect
- `getAuthToken: () => ...` lazy getter (매 요청마다 호출 → 토큰 갱신 자동 반영)
- 도메인 타입은 서비스별 namespace (`UsersComponents['schemas']['User']`)
- 패키지 자체 패턴은 [`@repo/api-client/CLAUDE.md`](../../packages/api-client/CLAUDE.md) 참조

## 상태관리

| 종류            | 도구                                          |
| --------------- | --------------------------------------------- |
| 서버 상태       | React Query (`useQuery` / `useSuspenseQuery`) |
| 폼 상태         | react-hook-form + zod                         |
| 컴포넌트 로컬   | useState                                      |
| 전역 클라이언트 | Zustand (도메인별 store 분리)                 |
| URL 표현 가능   | `useSearchParams` (필터, 페이지네이션, 정렬)  |

> **원칙:** URL로 표현 가능한 상태는 반드시 URL에 — 새로고침/공유 시 화면 재현

## 스타일링

- SCSS Modules (`*.module.scss`) + 동일 이름 `.d.ts` 페어
- 디자인 토큰은 `@repo/ui`의 CSS 변수 (`var(--color-primary)` 등) — 하드코딩 금지
- 글로벌 스타일은 `app/globals.scss`만 — `.page-container` 클래스, 키프레임 등
- skeleton/loading 애니메이션: `pulse` 키프레임 (globals.scss) 활용

## 테스트

- **Presentational**: 컴포넌트 단위 (props → DOM 검증). MSW 불필요
- **통합**: `<XSection />` (hook + 분기) — MSW로 응답 시나리오 테스트 (성공/HTTP 5xx/네트워크 실패)
- **MSW handlers는 wildcard URL** (`*/api/health`) — baseUrl 변화에 영향 안 받음
- `renderWithProviders` (test-utils)로 QueryClient wrapping
- jest-axe로 a11y 검증

### vitest 셋업 주의사항

- `vi.mock('server-only', () => ({}))` 필수 — api 배럴이 server+client 모듈을 같이 re-export하는 구조라 client 컨텍스트인 vitest가 throw
- `process.env.NEXT_PUBLIC_*` stub을 setup file 최상단에 (env.ts 모듈 로드 전)
- `esbuild: { jsx: 'automatic' }` (tsconfig는 Next용 `jsx: preserve`라 vitest용 별도)

## 트리 셰이킹

- `package.json`에 `"sideEffects": ["**/*.css", "**/*.scss"]` — JS는 side-effect-free 가정
- `next.config.js`에 `experimental.optimizePackageImports: ['@repo/ui', '@repo/api-client']` — barrel을 빌드 타임에 직접 파일로 재작성
- 'use client' 경계를 가로지르는 barrel에 주의 — Next는 잘 처리하지만 'server-only' 모듈은 client 빌드에서 throw로 차단

## 명령어

```bash
pnpm --filter=nextjs dev          # localhost:3000
pnpm --filter=nextjs build
pnpm --filter=nextjs start
pnpm --filter=nextjs test
pnpm --filter=nextjs typecheck
pnpm --filter=nextjs lint         # eslint src --max-warnings 0 (next lint deprecated)
```

## Claude Code 변경 시 체크리스트

- [ ] **의존 방향** 준수 (shared → features/app 금지, features 끼리 금지)
- [ ] 새 코드 위치 결정 (한 feature 전용 → `features/<n>/`, 여러 곳 → shared)
- [ ] page.tsx가 features 조립만 하고 비즈니스 로직 없는가
- [ ] 환경변수가 zod 검증되고 `env` 객체로만 사용되는가
- [ ] 시크릿/내부 토큰이 클라이언트 번들에 안 들어가는가 (`'server-only'` 마커 또는 server.ts/client.ts 분리)
- [ ] 외부 입력(query/body/dynamic segment)을 zod 검증
- [ ] API 호출이 `@repo/api-client` 인스턴스 통하는가 (server/client 올바르게)
- [ ] **새 feature 추가 시**: ESLint zone 한 줄 추가 + `api/index.ts`, `components/index.ts` barrel 생성
- [ ] **새 컴포넌트 추가 시**: `<name>/<name>.tsx + index.ts` 폴더 생성, outer barrel에 등록
- [ ] **새 라우트 추가 시**: `loading.tsx` + `error.tsx` 동반 검토
- [ ] 데이터 페칭이 streaming 가능하면 async Server Component + Suspense 우선
- [ ] 새 컴포넌트의 SCSS Module엔 `.d.ts` 페어 작성
- [ ] 통합 컴포넌트(Section)엔 MSW 통합 테스트 1개 (성공/실패)
- [ ] React Query 키는 팩토리 객체 (매직 스트링 X)
- [ ] URL로 표현 가능한 상태가 URL 밖에 갇혀있지 않은가
- [ ] `components/`에 추가한 게 `@repo/ui`로 빠져야 할 도메인 비종속 컴포넌트 아닌가

## 참고 패턴

```ts
// 환경변수
import { env } from '@/config/env' // ✅
// process.env.X                                  // ❌

// API 호출 (Server Component)
import { exampleApi } from '@/lib/api-client/server'

// API 호출 (Client Component)
import { exampleApi } from '@/lib/api-client/client'

// 도메인 타입 — 서비스별 namespace
import type { ExamplePaths } from '@repo/api-client'

// feature import (barrel)
import { HealthSection, HealthStatus } from '@/features/health/components'
import { getHealth, useHealth } from '@/features/health/api'

// 디자인 시스템
import { Button } from '@repo/ui/button'

// 앱 전용 위젯
import { BackLink } from '@/components'

// 로깅
import { logger } from '@/lib/logger'
// console.log(...)                              // ❌ ('warn'/'error'만 허용)
```
