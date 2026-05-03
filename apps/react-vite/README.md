# react-vite

`fe-monorepo-template`의 Vite + React 19 SPA 베이스. React Router 7 data router + React Query + MSW + 단방향 의존.

- **`useSuspenseQuery` + 라우트 boundary 위임** — 페이지 본문은 happy path만. loading/error는 부모 라우트의 Suspense fallback / ErrorBoundary가 흡수
- **Route-level lazy** — `lazy: () => import('./routes/x')` + `Component` alias export
- **단방향 의존** — `app → features → shared` (ESLint zone 강제)
- **단일 환경변수 진입점** — `src/config/env.ts`에서 zod 검증 (`VITE_` 프리픽스)
- **`VITE_USE_MOCK=1` 플래그**로 MSW dev 활성화 — 실 백엔드 붙일 때 끄기 쉬움
- **`@repo/api-client` 통합** — 단일 인스턴스, zustand 토큰 + 401 redirect
- **번들 최적화** — `manualChunks` + route-level lazy + `sideEffects`

## Quick Start

```bash
cp apps/react-vite/.env.example apps/react-vite/.env.local
pnpm install
pnpm --filter=react-vite dev          # http://localhost:5173
```

> `public/mockServiceWorker.js`는 커밋되어 있음. 누락되면 `pnpm --filter=react-vite exec msw init public/`로 재생성.

## 데모 페이지

| 경로          | 패턴                            | 설명                                          |
| ------------- | ------------------------------- | --------------------------------------------- |
| `/`           | 정적 (Home)                     | 데모 페이지 링크                              |
| `/health`     | `useSuspenseQuery`              | happy path만, loading/error는 root.tsx가 흡수 |
| `/orders`     | `useSuspenseQuery` 목록         | 주문 목록 + 생성 버튼                         |
| `/orders/new` | `react-hook-form + useMutation` | zod 검증 폼 + invalidateQueries → navigate    |
| `/*`          | NotFound                        | 미정의 경로 catch-all                         |

## 디렉토리 구조

```
apps/react-vite/src/
├── app/
│   ├── routes/                       routes 하위 배럴 X (도메인/view 폴더 파일을 직접 lazy)
│   │   ├── root.tsx                  RootLayout (Suspense+Outlet) + RootErrorBoundary
│   │   ├── home.tsx                  HomePage (단일 파일)
│   │   ├── not-found.tsx             NotFoundPage (단일 파일)
│   │   ├── health/                   /health 도메인 폴더
│   │   │   └── status/                   view 폴더
│   │   │       ├── status.tsx            HealthStatusPage (useSuspenseQuery)
│   │   │       └── status.test.tsx       통합 테스트
│   │   └── order/                    /orders 도메인 폴더
│   │       ├── list/
│   │       │   ├── list.tsx              OrderListPage (useSuspenseQuery)
│   │       │   └── list.test.tsx         통합 테스트
│   │       └── new/
│   │           └── new.tsx               OrderNewPage (OrderForm 조립)
│   ├── app.tsx                <RouterProvider>
│   ├── provider.tsx           QueryClientProvider + Devtools (dev only)
│   └── router.tsx             createBrowserRouter + route-level lazy
├── styles/global.scss         @repo/ui CSS + .page-container + 키프레임
├── components/                앱 전용 위젯 (BackLink 등)
├── config/env.ts              zod로 검증된 환경변수
├── features/<n>/             싱글 도메인 (단수 — health, order)
│   ├── api/                   서버 통신 (read/write 분리 + barrel)
│   │   ├── index.ts               outer barrel
│   │   ├── queries.ts             useX (useSuspenseQuery) + 쿼리 키 팩토리
│   │   └── mutations.ts           useMutation + invalidateQueries (필요 시)
│   └── components/            presentational 리스트 + 폼 컴포넌트 (폼은 mutation hook까지 캡슐화)
├── lib/
│   ├── api-client.ts          @repo/api-client 인스턴스 (zustand 토큰)
│   └── logger.ts
├── stores/auth.ts             전역 zustand
├── testing/                   MSW handlers + node/browser worker + renderWithProviders
├── main.tsx                   엔트리 (env.VITE_USE_MOCK 분기 → MSW 부트 → createRoot)
└── vite-env.d.ts              ImportMetaEnv 타입 augment
```

자세한 컨벤션·의존 규칙은 [`CLAUDE.md`](./CLAUDE.md).

## 데이터 페칭

`useSuspenseQuery` + 라우트 boundary 위임 패턴. 페이지 본문은 happy path만:

```tsx
// features/health/api/queries.ts
export function useHealth() {
  return useSuspenseQuery({
    queryKey: healthKeys.status(),
    queryFn: () => exampleApi.request('/health', { method: 'get' }),
  })
}

// app/routes/health/status.tsx
function HealthStatusPage() {
  const { data } = useHealth() // suspends until resolved, throws on error
  return <HealthStatus tone="ok" label={data.status} />
}
export { HealthStatusPage as Component }
```

loading은 root.tsx의 `<Suspense fallback>`이, error는 root.tsx의 `ErrorBoundary`가 받음. 페이지 코드 분기 0줄.

## 라우팅 (React Router 7)

- 라우트 함수는 **명시적 함수명**으로 정의 (`HomePage`, `HealthStatusPage` 등) + react-router lazy 픽업용 `export { HomePage as Component }` alias 추가 — 스택 트레이스/DevTools 가독성 + lazy 호환 둘 다
- `router.tsx`가 `lazy: () => import('./routes/x')`로 등록 → 라우트별 청크 자동 분리
- 데이터/에러 핸들러도 같은 모듈에서 `loader` / `action` / `ErrorBoundary` alias로 export 가능

## 환경변수

`src/config/env.ts`만 `import.meta.env`에 접근 (ESLint로 강제). 나머지는 `import { env } from '@/config/env'`.
새 변수는 `src/vite-env.d.ts`의 `ImportMetaEnv`도 함께 augment.

| 변수                   | 용도                                                 |
| ---------------------- | ---------------------------------------------------- |
| `VITE_EXAMPLE_API_URL` | api-client baseUrl                                   |
| `VITE_APP_ENV`         | development \| staging \| production (dev 분기 등)   |
| `VITE_USE_MOCK`        | `'1'`이면 MSW browser worker 활성 (백엔드 없이 데모) |

## MSW

- **테스트**: `msw/node` `setupServer` (`vitest.setup.ts`에서 `beforeAll(server.listen)`)
- **dev**: `msw/browser` `setupWorker` — `VITE_USE_MOCK=1`일 때만 `main.tsx`가 `worker.start()`
- **handlers는 한 번만**: `src/testing/mocks/handlers.ts`가 양쪽이 공유 (wildcard URL — `*/api/health`)
- **production**: `VITE_USE_MOCK !== '1'`이면 dynamic import가 실행되지 않아 worker chunk 미로드

## 주요 패턴

- **컴포넌트 폴더**: `<name>/<name>.tsx + index.ts + (.module.scss + .d.ts + .test.tsx)` (`apps/nextjs`와 동일)
- **`features/<n>/api/{queries,mutations}.ts`** — read/write 분리. `useSuspenseQuery` + 키 팩토리는 `queries.ts`, `useMutation`은 `mutations.ts` (nextjs의 server/client 분리와 다름 — 둘 다 client)
- **route-level lazy** — `Component` named export + `lazy: () => import('./routes/x')`
- **통합 테스트는 라우트에** — `app/routes/<n>.test.tsx` + `MemoryRouter`로 wrap
- **`page-container` 글로벌 클래스** — 모든 페이지 공통 레이아웃 (`global.scss`)
- **`pulse` 키프레임** — skeleton/loading 애니메이션
- **`vite-env.d.ts` augment** — `ImportMetaEnv`에 새 `VITE_` 변수 타입 추가

## 명령어

```bash
pnpm --filter=react-vite dev          # 개발 서버 (localhost:5173)
pnpm --filter=react-vite build        # tsc 체크 + vite build
pnpm --filter=react-vite preview      # 빌드 결과 로컬 실행
pnpm --filter=react-vite test         # vitest run
pnpm --filter=react-vite typecheck
pnpm --filter=react-vite lint
pnpm --filter=react-vite analyze      # rollup-plugin-visualizer 리포트 (dist/stats.html)
```

## Contributing

작성/수정 규약, 의존 방향, 변경 시 체크리스트는 [`CLAUDE.md`](./CLAUDE.md).
