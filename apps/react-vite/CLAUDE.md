# react-vite

Vite + React 19 SPA 베이스 템플릿. feature 단위 모듈 + 단방향 의존 + React Router 7 data router + React Query.

> **상위 문서:** 루트 `CLAUDE.md` (모노레포 공통 규칙)
> **이 문서가 우선:** Vite/SPA 특화 결정 — 디렉토리 구조, 라우팅, 의존 규칙

## 앱 목적

SEO가 불필요하고 인증된 사용자 대상 SPA(대시보드, 관리자, 사내 툴)에 적합. SSR/SEO/BFF가 필요한 경우는 `apps/nextjs`.

## SPA 컨벤션 (Next와 다른 부분)

`apps/nextjs`는 Server Component 모델 때문에 page = 얇은 컨테이너 + Section 레이어 분리가 강제되지만, **이 앱은 모든 게 Client Component**라 그 indirection이 없습니다. 핵심 차이:

- **`useSuspenseQuery` + 라우트 boundary 위임** — 페이지 본문은 happy path만. loading/error 분기는 부모 라우트의 Suspense fallback / ErrorBoundary가 받음. early return / state mapping 헬퍼 불필요
- **`features/<n>/api/{queries,mutations}.ts` + barrel** — read/write 분리. nextjs는 server/client 분리(`'server-only'` vs `'use client'`)였지만 SPA는 둘 다 client라 read/write로 나눔. `api/index.ts`가 외부 노출 진입점
- **route-level lazy** — `lazy(() => import('./routes/x').then(m => ({ default: m.X })))` 대신 react-router 7의 `lazy: () => import('./routes/x')` + `Component`/`ErrorBoundary` alias-only export
- **루트 레이아웃이 Suspense + Outlet** — `app/routes/root.tsx`의 `Component`가 `<Suspense fallback><Outlet /></Suspense>`로 자식 라우트의 suspense를 받음. `ErrorBoundary`는 같은 모듈에서 자식 라우트 에러까지 캐치
- **MSW dev 활성화는 `VITE_USE_MOCK=1` 플래그** — 항상 켜두는 게 아니라 명시적 opt-in. 실 백엔드 붙일 때 끄기 쉬움

## 기술 스택

- **Vite 5** + **React 19** + **TypeScript** strict
- **React Router 7** (data router 모드, `react-router`에서 단일 import — `react-router-dom`은 v7에서 폐기)
- **React Query 5** — 서버 상태 (+ Devtools, dev only)
- **Zustand** — 전역 클라이언트 상태
- **react-hook-form + zod** — 폼/검증 / **zod** — 환경변수 검증
- **SCSS Modules** — `.module.scss + .module.scss.d.ts` 페어
- **Vitest** + **MSW 2** + **@testing-library/react**
- **MSW browser worker** — `VITE_USE_MOCK=1`일 때만 fetch 가로채기
- **`@repo/ui`**, **`@repo/api-client`** (workspace)

## 디렉토리 구조

```
apps/react-vite/
├── src/
│   ├── app/                      앱 초기화 + 라우팅
│   │   ├── routes/               XxxPage named declaration + alias-only export, routes 하위 배럴 X
│   │   │   ├── root.tsx                  RootLayout (Suspense+Outlet) + RootErrorBoundary
│   │   │   ├── home.tsx                  HomePage (단일 파일)
│   │   │   ├── not-found.tsx             NotFoundPage (단일 파일)
│   │   │   ├── health/                   /health 도메인 폴더
│   │   │   │   └── status/                   view 폴더
│   │   │   │       ├── status.tsx                HealthStatusPage (useSuspenseQuery happy path)
│   │   │   │       └── status.test.tsx           통합 테스트 (createMemoryRouter)
│   │   │   └── order/                    /orders 도메인 폴더
│   │   │       ├── list/
│   │   │       │   ├── list.tsx                  OrderListPage (useSuspenseQuery)
│   │   │       │   └── list.test.tsx             통합 테스트
│   │   │       └── new/
│   │   │           └── new.tsx                   OrderNewPage (OrderForm 조립 + navigate)
│   │   ├── app.tsx               <RouterProvider>
│   │   ├── provider.tsx          QueryClientProvider + Devtools (dev only)
│   │   └── router.tsx            createBrowserRouter + route-level lazy
│   ├── styles/global.scss        @repo/ui CSS import + .page-container + 키프레임
│   ├── components/               앱 전용 위젯 (디자인 시스템은 @repo/ui)
│   │   ├── index.ts              outer barrel
│   │   └── <name>/
│   │       ├── index.ts          inner barrel
│   │       └── <name>.tsx
│   ├── config/env.ts             zod 검증된 환경변수 (import.meta.env 직접 접근 금지)
│   ├── features/                 기능 단위 모듈
│   │   └── <name>/                          싱글 도메인 (단수 — health, order)
│   │       ├── api/                         서버 통신 — read/write 분리 + barrel
│   │       │   ├── index.ts                     outer barrel (queries + mutations)
│   │       │   ├── queries.ts                   useSuspenseQuery + 쿼리 키 팩토리
│   │       │   └── mutations.ts                 useMutation + invalidateQueries (필요 시)
│   │       └── components/
│   │           ├── index.ts      outer barrel
│   │           ├── <n>-list/                presentational
│   │           ├── <n>-form/                react-hook-form + mutation 통합 (form 컴포넌트가 mutation hook까지 소유)
│   │           └── <name>/
│   │               ├── index.ts  inner barrel
│   │               ├── <name>.tsx
│   │               ├── <name>.module.scss
│   │               └── <name>.module.scss.d.ts
│   ├── lib/
│   │   ├── api-client.ts         @repo/api-client 인스턴스 (zustand 토큰 + 401 redirect)
│   │   └── logger.ts
│   ├── stores/                   전역 zustand store
│   ├── testing/
│   │   ├── mocks/{handlers,server,browser}.ts   server (vitest) + browser (dev)
│   │   └── test-utils.tsx        renderWithProviders (QueryClient wrapper)
│   ├── main.tsx                  엔트리 (env.VITE_USE_MOCK 분기 → MSW 부트 → createRoot)
│   └── vite-env.d.ts             ImportMetaEnv 타입 augment
├── public/
│   └── mockServiceWorker.js      msw init으로 생성 (커밋됨)
├── index.html
├── .env.example / .env.local (gitignored)
├── vite.config.ts                react + manualChunks + 옵션 visualizer
├── vitest.config.ts              jsdom + globals
├── vitest.setup.ts               import.meta.env stub + MSW listen
├── tsconfig.json                 extends @repo/config/typescript/vite + allowArbitraryExtensions
└── package.json                  sideEffects: ["**/*.css","**/*.scss"]
```

> **`components/` vs `@repo/ui` 구분**
>
> - `@repo/ui`: 도메인 비종속 디자인 시스템 (Button, Card 등)
> - `components/`: 이 앱 전용 위젯 (BackLink 등)
> - 두 앱이 같은 패턴을 쓰면 `@repo/ui`로 추출

## 컴포넌트 폴더 컨벤션

`apps/nextjs`와 동일 — 각 컴포넌트는 자체 폴더 + inner barrel:

```
<name>/
├── index.ts              export { Foo } from './foo'
├── <name>.tsx            컴포넌트 본체
├── <name>.module.scss    (필요 시)
├── <name>.module.scss.d.ts (필요 시)
└── <name>.test.tsx       (필요 시 — presentational 단위 테스트만)
```

> **통합 테스트는 라우트에**: presentational 컴포넌트는 props 단위 테스트만. `useSuspenseQuery` suspense + ErrorBoundary 통합 검증은 view 폴더 안 `<view>.test.tsx`에 두고 `createMemoryRouter` + root.tsx와 합성해 production 인프라까지 검증.

**Import 규칙:**

- 외부에서: outer barrel 사용 (`from '@/features/health/components'`)
- 같은 폴더 안: 직접 파일

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
4. 라우트 컴포넌트(`app/routes/`)는 **happy path만** 작성 — `useSuspenseQuery`로 데이터 받고 features 컴포넌트 조립. 분기(loading/error)는 root.tsx의 Suspense/ErrorBoundary가 흡수. 폼·테이블 같은 도메인 로직은 `features/<n>/components/`로 추출하고 라우트는 callback (`onSuccess` 등)만 주입

루트 [`eslint.config.js`](../../eslint.config.js)에서 `import/no-restricted-paths`로 강제. **새 feature 추가 시 zone 한 줄 추가** (`{ target: './apps/react-vite/src/features/<n>', from: './apps/react-vite/src/features', except: ['./<n>'] }`).

## 라우팅 (React Router 7 data router)

- **`react-router`에서만 import** — `react-router-dom`은 v7에서 폐기됨
- 라우트 정의는 `src/app/router.tsx`에 집중 — `createBrowserRouter`
- **명시적 함수명 + alias-only export 패턴** — 함수는 `HomePage` / `HealthStatusPage` 등으로 named declaration (export X), 외부엔 `export { HomePage as Component }` alias만 노출. 스택 트레이스/DevTools엔 함수 이름이 그대로, lazy/외부 import는 단일 진입점(`Component`)으로 일관
- 에러 바운더리도 동일: `function RootErrorBoundary` 선언 + `export { RootErrorBoundary as ErrorBoundary }`
- **루트 라우트(`root.tsx`)는 layout + error boundary** — `Component`가 `<Suspense fallback><Outlet /></Suspense>`. 자식 라우트의 useSuspenseQuery suspension + 에러 throw를 모두 흡수
- **`routes/` 하위는 배럴 X** — URL 도메인이 여러 view를 가지면 도메인 폴더로 묶음 (`routes/health/`, `routes/order/`). view가 단순하면 도메인 폴더 직속 파일 (`health/status.tsx`), view가 자체 헬퍼/테스트가 많으면 view별 폴더 (`order/list/list.tsx + list.test.tsx`). router.tsx는 파일을 직접 lazy import (`./routes/health/status`, `./routes/order/list/list`)
- 검색/동적 세그먼트 파라미터는 zod로 검증
- 인증/권한 라우트는 `<ProtectedRoute>` 래퍼로 처리
- 데이터 로딩 — 단순 SPA에서는 React Query만으로 충분. 진입 시 prefetch가 필요하면 `loader`에서 `queryClient.prefetchQuery` (전역 queryClient 인스턴스를 export하는 패턴)

```ts
// 패턴: app/router.tsx — 도메인 폴더의 view 파일을 직접 lazy
createBrowserRouter([
  {
    path: '/',
    lazy: () => import('./routes/root'), // Component (Suspense+Outlet) + ErrorBoundary
    children: [
      { index: true, lazy: () => import('./routes/home') },
      { path: 'health', lazy: () => import('./routes/health/status/status') },
      { path: 'orders', lazy: () => import('./routes/order/list/list') },
      { path: 'orders/new', lazy: () => import('./routes/order/new/new') },
      { path: '*', lazy: () => import('./routes/not-found') },
    ],
  },
])

// 패턴: app/routes/health/status/status.tsx — happy path만
function HealthStatusPage() {
  const { data } = useHealth() // useSuspenseQuery → data 항상 정의됨
  return (
    <main className="page-container">
      ...<HealthStatus tone="ok" label={data.status} />...
    </main>
  )
}
export { HealthStatusPage as Component }
```

## 환경변수

- `src/config/env.ts`만 `import.meta.env` 접근 (ESLint `no-restricted-syntax`로 강제)
- 클라이언트 노출 변수는 **`VITE_` 프리픽스 필수**
- `VITE_APP_ENV` (development/staging/production)는 dev-only 기능 분기에 사용 (`provider.tsx`의 ReactQueryDevtools)
- `VITE_USE_MOCK` (`'0'` | `'1'` | unset) — `'1'`이면 MSW browser worker 활성
- 컴포넌트는 항상 `import { env } from '@/config/env'`
- 새 변수는 `src/vite-env.d.ts`의 `ImportMetaEnv`도 함께 augment

`logger.ts`는 예외 — `import.meta.env.DEV`만 직접 read (env.ts ↔ logger 순환 회피)

## API 클라이언트

- `src/lib/api-client.ts`에서 `@repo/api-client` 인스턴스 생성
- `getAuthToken: () => useAuthStore.getState().accessToken` lazy getter (매 요청마다 토큰 갱신 자동 반영)
- `onUnauthorized`에서 zustand clear + `/login` redirect
- 도메인 타입은 서비스별 namespace (`UsersComponents['schemas']['User']`)
- 패키지 자체 패턴은 [`@repo/api-client/CLAUDE.md`](../../packages/api-client/CLAUDE.md)

## 데이터 페칭

- **API 호출은 `@repo/api-client` 인스턴스 통해** (직접 `fetch`/`axios` 금지)
- React Query 키는 **팩토리 객체** (`healthKeys.status()`) — 매직 스트링 금지
- `features/<n>/api/queries.ts`에 `useX` + 키 팩토리, `api/mutations.ts`에 `useMutation`. `api/index.ts`가 outer barrel
- **`useSuspenseQuery` 기본** — 페이지가 데이터 의존하면 suspense. loading/error 분기는 부모 라우트가 흡수. early return / mapping 헬퍼 불필요
- 무한 스크롤/페이지네이션은 `useSuspenseInfiniteQuery`
- 에러 바운더리: 루트 라우트의 `ErrorBoundary` + 도메인별 라우트가 자체 `ErrorBoundary` export 가능 (격리)
- React Query `staleTime`은 도메인별 합리적 설정 — suspense 환경에선 fast refetch가 곧 fast suspense라 더 중요

```ts
// 패턴: features/<n>/api/queries.ts
export const fooKeys = {
  all: ['foo'] as const,
  detail: (id: string) => [...fooKeys.all, 'detail', id] as const,
}

export function useFoo(id: string) {
  return useSuspenseQuery({
    queryKey: fooKeys.detail(id),
    queryFn: () => exampleApi.request('/foo/{id}', { method: 'get', params: { id } }),
  })
}
```

```tsx
// 패턴: app/routes/<n>.tsx — happy path만
function FooPage() {
  const { data } = useFoo('123')
  return (
    <main>
      <FooView data={data} />
    </main>
  )
}
export { FooPage as Component }
```

> **mutation**: `useMutation`은 그대로 (suspense 버전 없음) — `features/<n>/api/mutations.ts`에 정의. `onSuccess`에서 `queryClient.invalidateQueries({ queryKey })`로 관련 query 재조회. 낙관적 업데이트는 `onMutate` + `setQueryData`.

```ts
// 패턴: features/<n>/api/mutations.ts
export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { item: string; quantity: number }) =>
      exampleApi.request('/orders', { method: 'post', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.list() })
    },
  })
}
```

```tsx
// 패턴: 폼 컴포넌트는 features/<n>/components/<n>-form/에
// (mutation hook + react-hook-form 둘 다 컴포넌트 내부에 캡슐화 — 라우트는 callback만 주입)
export function OrderForm({ onSuccess }: { onSuccess?: () => void }) {
  const { mutate, isPending, error } = useCreateOrder()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { item: '', quantity: 1 },
  })
  const onSubmit = handleSubmit((values) => {
    mutate(values, { onSuccess: () => onSuccess?.() })
  })
  return <form onSubmit={(e) => void onSubmit(e)}>...</form>
}

// 라우트는 navigate 같은 라우팅 glue만
function OrderNewPage() {
  const navigate = useNavigate()
  return (
    <main>
      <OrderForm onSuccess={() => void navigate('/orders')} />
    </main>
  )
}
```

> **언제 `useSuspenseQuery` 안 쓰나**: 데이터가 *옵션*인 경우(있으면 보너스), 인터랙션 후 fetch (검색 입력 변경 등). 이런 케이스만 일반 `useQuery` 사용.

## 상태관리

| 종류            | 도구                                         |
| --------------- | -------------------------------------------- |
| 서버 상태       | React Query                                  |
| 폼 상태         | react-hook-form + zod                        |
| 컴포넌트 로컬   | useState                                     |
| 전역 클라이언트 | Zustand (도메인별 store 분리)                |
| URL 표현 가능   | `useSearchParams` (필터, 페이지네이션, 정렬) |

> **원칙:** URL로 표현 가능한 상태는 반드시 URL에 — 새로고침/공유 시 화면 재현

## React 19 패턴

- **`ref`를 prop으로 직접** — `forwardRef` 사용 금지
- **`useActionState` / `useOptimistic`** — 단순한 폼/뮤테이션 피드백. 서버 상태 동기화가 필요하면 React Query 유지
- **`use()` 훅** — Context 조건부 read 같은 실 use case에서만. 데이터 페칭에는 React Query/`useSuspenseQuery`가 표준

## 스타일링

- SCSS Modules (`*.module.scss`) + 동일 이름 `.d.ts` 페어
- 디자인 토큰은 `@repo/ui`의 CSS 변수 (`var(--color-primary)`) — 하드코딩 금지
- 글로벌 스타일은 `styles/global.scss`만 — `.page-container` 클래스, 키프레임
- skeleton/loading 애니메이션: `pulse` 키프레임 (`global.scss`) 활용
- 다크모드는 CSS 변수 기반 (`data-theme` 속성)

## Vite 설정 핵심

- `manualChunks`로 vendor 분리 (`react`, `router`, `query`)
- `@/*` 경로 alias (`tsconfig.json` + `vite.config.ts` 양쪽 동기화)
- `pnpm analyze` (`ANALYZE=1 vite build`) — `rollup-plugin-visualizer`가 `dist/stats.html` 생성
- `@repo/ui`, `@repo/api-client`은 워크스페이스 소스 직접 export — Vite가 자동 처리 (Next의 `transpilePackages` 같은 명시 불필요)

## MSW (Mock Service Worker)

이 앱은 SPA이므로 자체 BFF가 없음. **`VITE_USE_MOCK=1`일 때만 dev에서 MSW browser worker 활성**:

- `src/testing/mocks/handlers.ts` — server (vitest) + browser (dev) 양쪽이 공유
- `src/testing/mocks/server.ts` — `msw/node` `setupServer` (vitest)
- `src/testing/mocks/browser.ts` — `msw/browser` `setupWorker` (dev)
- `public/mockServiceWorker.js` — `pnpm exec msw init public/`로 생성 (커밋됨)
- `main.tsx`가 `env.VITE_USE_MOCK === '1'`일 때만 `worker.start()` 후 createRoot
- 파일 누락 시 fail-soft (logger.warn) — 실 백엔드가 있으면 `VITE_USE_MOCK=0` 또는 미설정으로 끔
- production 빌드에서도 `VITE_USE_MOCK !== '1'`이면 worker chunk가 fetch되지 않음 (dynamic import 분기로 차단)

## 테스트

- **Presentational**: 컴포넌트 단위 (props → DOM 검증). MSW 불필요. 컴포넌트 폴더 옆 `*.test.tsx`
- **통합**: 라우트 단위 (`app/routes/<n>.test.tsx`) — `MemoryRouter` + `renderWithProviders` + MSW 응답 시나리오 (성공/HTTP 5xx/네트워크 실패)
- **MSW handlers는 wildcard URL** (`*/api/health`) — baseUrl 변화에 영향 안 받음
- `renderWithProviders` (test-utils)로 QueryClient wrapping
- `vitest.setup.ts`에서 `import.meta.env`를 mutable cast 후 stub (env.ts의 zod 검증 통과)

## 트리 셰이킹

- `package.json`에 `"sideEffects": ["**/*.css", "**/*.scss"]` — JS는 side-effect-free 가정
- 라우트는 모두 route-level `lazy` — 라우트별 청크 자동 분리
- `manualChunks`로 vendor를 분리해 hash 안정성 + cache hit 향상
- MSW worker는 dynamic import + env 분기로 production에서 fetch되지 않음

## 명령어

```bash
pnpm --filter=react-vite dev          # localhost:5173 (VITE_USE_MOCK=1이면 MSW 활성)
pnpm --filter=react-vite build        # tsc 체크 + vite build
pnpm --filter=react-vite preview      # 빌드 결과 로컬 실행
pnpm --filter=react-vite test
pnpm --filter=react-vite typecheck
pnpm --filter=react-vite lint
pnpm --filter=react-vite analyze      # rollup-plugin-visualizer 리포트 (dist/stats.html)
```

## Claude Code 변경 시 체크리스트

- [ ] **의존 방향** 준수 (shared → features/app 금지, features 끼리 금지)
- [ ] 새 코드 위치 결정 (한 feature 전용 → `features/<n>/`, 여러 곳 → shared)
- [ ] 라우트 컴포넌트가 happy path만 작성하고 loading/error는 부모 라우트가 받는가 (`useSuspenseQuery` + `<Suspense>`/`ErrorBoundary` 위임)
- [ ] 라우트 모듈이 명시적 함수명(`XxxPage`/`XxxErrorBoundary`) named declaration + `Component`/`ErrorBoundary` alias-only export 패턴인가
- [ ] `router.tsx`가 route-level `lazy: () => import('./routes/x')` 패턴인가
- [ ] 환경변수가 zod 검증되고 `env` 객체로만 사용되는가 (`vite-env.d.ts` augment 갱신)
- [ ] 외부 입력(쿼리/세그먼트)을 zod 검증
- [ ] API 호출이 `@repo/api-client` 인스턴스 통하는가
- [ ] **새 feature 추가 시**: ESLint zone 한 줄 추가 + `queries.ts` + `components/index.ts` outer barrel 생성
- [ ] **새 컴포넌트 추가 시**: `<name>/<name>.tsx + index.ts` 폴더 생성, outer barrel에 등록
- [ ] **새 라우트 추가 시**: `function XxxPage` named declaration + `export { XxxPage as Component }` alias만 + `router.tsx`에 lazy 등록 (도메인 폴더면 `./routes/<domain>/<view>` 직접 경로, barrel 만들지 않음)
- [ ] 새 컴포넌트의 SCSS Module엔 `.d.ts` 페어 작성
- [ ] 통합 시나리오는 `app/routes/<n>.test.tsx`에서 `createMemoryRouter` + MSW로 1개 (성공 + ErrorBoundary 캐치)
- [ ] React Query 키는 팩토리 객체 (매직 스트링 X)
- [ ] URL로 표현 가능한 상태가 URL 밖에 갇혀있지 않은가
- [ ] `components/`에 추가한 게 `@repo/ui`로 빠져야 할 도메인 비종속 컴포넌트 아닌가
- [ ] 큰 테이블/리스트에 가상화 (`@tanstack/react-virtual` 등) 적용 검토
- [ ] **새 MSW handler 추가 시**: `handlers.ts`만 수정 (server/browser 양쪽이 자동 반영)

## 참고 패턴

```ts
// 환경변수
import { env } from '@/config/env' // ✅
// import.meta.env.X                              // ❌

// API 호출
import { exampleApi } from '@/lib/api-client'

// 도메인 타입 — 서비스별 namespace
import type { ExamplePaths } from '@repo/api-client'

// feature import
import { useHealth, healthKeys } from '@/features/health/api'
import { HealthStatus } from '@/features/health/components'

// 디자인 시스템
import { Button } from '@repo/ui/button'

// 앱 전용 위젯
import { BackLink } from '@/components'

// 라우터
import { Link, useNavigate } from 'react-router' // ❌ 'react-router-dom'

// 로깅
import { logger } from '@/lib/logger'
// console.log(...)                              // ❌ ('warn'/'error'만 허용)
```
