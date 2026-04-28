# react-vite

Vite + React 기반 SPA 앱 베이스 템플릿. feature 단위 모듈 구조 + 단방향 의존 규칙 적용.

> **상위 문서:** 루트 `CLAUDE.md` (모노레포 공통 규칙)
> **이 문서가 우선:** Vite 특화 결정, 디렉토리 구조 / 의존 규칙

## 앱 목적

SEO가 불필요하고 인증된 사용자 대상의 **SPA**(대시보드, 관리자, 사내 툴 등)에 적합한 출발점. SSR/SEO가 필요한 경우는 `apps/nextjs`를 사용.

## 기술 스택

- **Vite 5** (rolldown 마이그레이션 대비)
- **React 19** + **TypeScript** strict
- **React Router 7** (data router 모드, `react-router`에서 단일 import)
- **React Query** — 서버 상태
- **Zustand** — 전역 클라이언트 상태
- **react-hook-form + zod** — 폼 / 검증
- **SCSS Modules**
- **Vitest + React Testing Library** + **MSW** — 테스트
- **Storybook** — 컴포넌트 카탈로그

## 디렉토리 구조

모노레포 환경이라 `packages/*`가 대신 제공하는 폴더는 앱에서 제거됨:

| 일반 React 프로젝트의 폴더 | 이 템플릿에서 처리 |
|---|---|
| `src/types/` (전역 타입) | API 타입은 `@repo/api-client`의 서비스별 namespace(`UsersComponents['schemas']` 등), UI 타입은 `@repo/ui`. 정말 앱 전역 타입이 생기면 `lib/`에 둠 |
| `features/{name}/types/` | API 타입은 `@repo/api-client`, 그 외는 같은 feature 내부에서 필요한 파일에 직접 정의 |

전체 구조:

```
apps/react-vite/
├── src/
│   ├── app/                  앱 초기화 레이어
│   │   ├── routes/           라우트 정의 (페이지 컴포넌트들)
│   │   ├── app.tsx           최상위 앱 컴포넌트
│   │   ├── provider.tsx      QueryClient, Router, Theme 등 전역 프로바이더
│   │   └── router.tsx        React Router 설정
│   ├── assets/               앱 특화 정적 파일 (이미지, 폰트)
│   ├── components/           앱 특화 레이아웃/위젯 (디자인 시스템은 @repo/ui)
│   ├── config/               환경변수(env.ts), 앱 상수
│   ├── features/             기능 단위 모듈 (가장 많은 코드가 위치)
│   │   └── {feature-name}/
│   │       ├── api/          이 기능의 React Query 훅 + 쿼리 키
│   │       ├── components/   이 기능 전용 컴포넌트
│   │       ├── hooks/        이 기능 전용 훅
│   │       ├── stores/       이 기능 전용 zustand store
│   │       └── utils/        이 기능 전용 유틸
│   ├── hooks/                앱 전역 공유 훅 (두 곳 이상에서 사용될 때만)
│   ├── lib/                  외부 라이브러리 래퍼 / 인스턴스화
│   │   ├── api-client.ts     @repo/api-client 서비스별 인스턴스 (zustand 토큰)
│   │   └── logger.ts
│   ├── stores/               전역 zustand store
│   ├── testing/              MSW handlers, 테스트 유틸
│   ├── utils/                앱 전역 공유 유틸 (두 곳 이상에서 사용될 때만)
│   └── main.tsx              엔트리포인트 (app.tsx를 mount)
├── public/
├── index.html
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

> **`components/` vs `@repo/ui` 구분**
> - `@repo/ui`: 도메인 비종속 디자인 시스템 (Button, Input, Modal, Toast 등)
> - `components/`: 이 앱 전용 레이아웃/위젯 (AppShell, Sidebar, PageHeader 등)
> - 두 앱이 같은 패턴을 쓰기 시작하면 `@repo/ui`로 추출

> **배럴 파일(`index.ts`) 사용 안 함.** Vite 트리 셰이킹과 빌드 성능, IDE 자동 import 정확도를 우선. 외부에서는 파일 경로를 직접 import.

## 의존 방향 규칙 (단방향)

```
app  ──→  features  ──→  shared modules (components, hooks, lib, stores, utils)
                                   ↑
                              app도 직접 import 가능
```

원칙:

1. `shared modules`(components, hooks, lib, stores, utils)는 **features와 app을 import할 수 없음**
2. `features/*`끼리 **서로 import 금지** — 두 feature가 무언가를 공유해야 한다면 `shared modules`로 끌어올리거나, app 레벨에서 조립
3. `app/`은 features와 shared modules 모두 import 가능
4. 라우트 컴포넌트(`app/routes/`)는 features를 조립하는 역할만 — 비즈니스 로직을 직접 담지 않음

이 규칙은 ESLint `import/no-restricted-paths`로 강제:

```json
"import/no-restricted-paths": [
  "error",
  {
    "zones": [
      // features끼리 import 금지
      {
        "target": "./src/features/auth",
        "from": "./src/features",
        "except": ["./auth"]
      },
      // shared modules은 features/app을 참조하지 않음
      {
        "target": [
          "./src/components",
          "./src/hooks",
          "./src/lib",
          "./src/stores",
          "./src/utils"
        ],
        "from": ["./src/features", "./src/app"]
      },
      // 단방향: app은 features를 import하지만 그 반대는 안 됨
      {
        "target": "./src/features",
        "from": "./src/app"
      }
    ]
  }
]
```

## 라우팅 (React Router 7)

- **`react-router`에서만 import** — `react-router-dom`은 v7에서 폐기됨

```ts
// ✅
import { createBrowserRouter, RouterProvider, useNavigate } from 'react-router'
// ❌
import { ... } from 'react-router-dom'
```

- 라우트 정의는 `src/app/router.tsx`에 집중
- **모든 페이지는 `lazy` + Suspense** (초기 번들 최소화)
- 라우트 단위 에러 바운더리는 `errorElement` 활용
- 검색 파라미터 상태는 `useSearchParams` + zod 스키마 검증
- 동적 세그먼트 파라미터도 zod로 검증
- 인증/권한이 필요한 라우트는 `<ProtectedRoute>` 래퍼로 처리
- 데이터 로딩은 `loader` 함수 적극 활용 — React Query와 병행 시 초기 페이지 로드는 `loader`, 이후 갱신은 React Query

```tsx
// src/app/router.tsx 패턴
import { createBrowserRouter, RouterProvider, lazy } from 'react-router'

const UsersRoute = lazy(() => import('./routes/users'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppRoot />,
    errorElement: <RootErrorBoundary />,
    children: [
      {
        path: 'users',
        element: <UsersRoute />,
        // 초기 데이터 로드: loader 활용
        loader: async () => {
          const { data, error } = await usersApi.GET('/users', {})
          if (error) throw error
          return data
        },
      },
    ],
  },
])

// src/app/app.tsx
export function App() {
  return <RouterProvider router={router} />
}
```

## 환경변수

- 정의: `src/config/env.ts`에서 zod로 검증된 객체로 export
- 클라이언트 노출 변수는 **`VITE_` 프리픽스 필수**
- 컴포넌트에서 `import.meta.env.X` 직접 접근 금지 — 항상 `env` 객체 경유

```ts
// src/config/env.ts 패턴
import { z } from 'zod'

const envSchema = z.object({
  // 서비스별 baseURL — 게이트웨이 경유 시 path prefix만 다를 수 있음
  VITE_USERS_API_URL: z.string().url(),
  VITE_ORDERS_API_URL: z.string().url(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
})

export const env = envSchema.parse(import.meta.env)
```

## 데이터 페칭

- **API 클라이언트는 `@repo/api-client`를 통해** (직접 `fetch`/`axios` 금지)
- `@repo/api-client`는 백엔드 **서비스별 클라이언트 팩토리**를 제공 (예: `createUsersClient`, `createOrdersClient`)
- API 클라이언트 인스턴스는 `src/lib/api-client.ts`에서 **사용하는 서비스만 인스턴스화**
- 이 앱에서 사용하지 않는 서비스는 인스턴스화하지 않음 → 트리 셰이킹으로 번들에서 제외
- React Query 키 팩토리는 각 feature의 `api/queries.ts`에 정의
- 도메인 타입은 서비스별 namespace에서 가져옴 — `UsersComponents['schemas']['User']` 등

```ts
// src/lib/api-client.ts 패턴
import {
  createUsersClient,
  createOrdersClient,
  type ServiceConfig,
} from '@repo/api-client'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth'

const sharedConfig: Pick<ServiceConfig, 'getAuthToken' | 'onUnauthorized'> = {
  getAuthToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => {
    useAuthStore.getState().clear()
    window.location.href = '/login'
  },
}

export const usersApi = createUsersClient({
  baseUrl: env.VITE_USERS_API_URL,
  ...sharedConfig,
})

export const ordersApi = createOrdersClient({
  baseUrl: env.VITE_ORDERS_API_URL,
  ...sharedConfig,
})
```

```ts
// features/users/api/get-user.ts 패턴
import { usersApi } from '@/lib/api-client'
import type { UsersComponents } from '@repo/api-client'
import { useQuery } from '@tanstack/react-query'

type User = UsersComponents['schemas']['User']

export const userKeys = {
  all: ['users'] as const,
  list: (filter: { search?: string }) =>
    [...userKeys.all, 'list', filter] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
}

export function useUsers(filter: { search?: string }) {
  return useQuery({
    queryKey: userKeys.list(filter),
    queryFn: async () => {
      const { data, error } = await usersApi.GET('/users', {
        params: { query: filter },
      })
      if (error) throw error
      return data
    },
  })
}
```

> **두 서비스에 같은 이름 스키마가 있어도 충돌 안 됨** — `UsersComponents['schemas']['User']`와 `OrdersComponents['schemas']['User']`는 서로 다른 namespace.

> **API Gateway / 직접 통신 둘 다 가능** — 게이트웨이 경유라면 `baseUrl: 'https://api.example.com/users'`, 직접 통신이라면 `baseUrl: 'https://users.api.example.com'`. 패키지는 모르고 앱 설정만으로 전환.

- 무한 스크롤 / 페이지네이션은 `useInfiniteQuery`
- 에러 바운더리: 라우트 레벨 + 위젯 레벨 2단계
- React Query `staleTime`은 도메인별로 합리적 설정 (모든 곳 0 금지)

## 상태관리

| 종류 | 도구 |
|---|---|
| 서버 상태 | React Query |
| 폼 상태 | react-hook-form + zod |
| 컴포넌트 로컬 상태 | useState |
| 전역 클라이언트 상태 | Zustand (도메인별 store 분리) |
| URL로 표현 가능한 상태 | URL 파라미터 (필터, 페이지네이션, 정렬) |

> **원칙:** URL로 표현 가능한 상태는 반드시 URL에 둔다. 새로고침/공유 시 동일한 화면이 재현되어야 함.

## Vite 설정 핵심

- `vite.config.ts`에서 **chunk 분리 전략 명시** (vendor / router / charts / ui 등) — 초기 번들 최소화
- `@/*` 경로 alias 설정 (`tsconfig.json` + `vite.config.ts` 양쪽 동기화)
- 개발 서버 프록시: `vite.config.ts`의 `server.proxy`로 백엔드 API 우회
- 번들 분석: `pnpm analyze` (rollup-plugin-visualizer)
- 환경별 모드 분기는 `--mode` 플래그 + `.env.<mode>` 활용

## 스타일링

- SCSS Modules (`*.module.scss`)
- `@repo/ui`의 디자인 토큰(CSS 변수) 사용
- 글로벌 스타일은 `src/app/styles/global.scss`에만
- 다크모드는 CSS 변수 기반 (`data-theme` 속성)

## 테스트

- **단위 테스트**: shared modules의 유틸/훅, features의 비즈니스 로직 (100% 커버리지 지향)
- **컴포넌트 테스트**: features의 주요 화면 (RTL + MSW)
- **시각적 회귀**: Storybook 스토리로 대체
- 테스트 파일 위치: 대상 파일 옆 `*.test.ts(x)` 또는 feature 내부 `__tests__/`
- MSW handlers는 `src/testing/mocks/`에 도메인별 분리

## React 19 주요 패턴

React 19에서 새로 쓸 수 있는 것들. 기존 방식을 강제로 바꿀 필요는 없으나, 새 코드는 아래 패턴 우선:

- **`use()` 훅** — Promise나 Context를 조건부로 읽을 수 있음. Suspense와 함께 데이터 로딩 간소화

```ts
// 이전 (useEffect + useState)
const [data, setData] = useState(null)
useEffect(() => { fetchUser(id).then(setData) }, [id])

// React 19 (use + Suspense)
const data = use(fetchUser(id))  // Suspense가 로딩 처리
```

- **`ref`를 prop으로 직접** — `forwardRef` 래핑 불필요

```tsx
// 이전
const Input = forwardRef((props, ref) => <input ref={ref} {...props} />)

// React 19
function Input({ ref, ...props }) { return <input ref={ref} {...props} /> }
```

- **`useActionState`** — 폼 뮤테이션 상태 관리. react-hook-form 없이 간단한 폼에 적합

```tsx
const [state, action, isPending] = useActionState(async (prev, formData) => {
  const { error } = await usersApi.POST('/users', { body: { name: formData.get('name') } })
  if (error) return { error: error.message }
  return { success: true }
}, null)
```

- **`useOptimistic`** — 낙관적 업데이트. React Query의 `onMutate` 대안으로 단순한 케이스에 사용

> React Query와 중복되는 기능이 있지만, 서버 상태 캐싱/동기화가 필요하면 React Query를 유지. 단순한 뮤테이션 피드백에는 `useActionState` / `useOptimistic`이 더 가볍다.

## 성능 가이드

- 페이지/라우트 컴포넌트는 모두 `lazy` (`react-router`에서 import)
- 큰 라이브러리(차트, 테이블 등)는 dynamic import 고려
- 100행 이상 테이블은 가상화 (`@tanstack/react-virtual` 등)
- `<img>`는 적절한 `width`/`height` 속성 (CLS 방지) + `loading="lazy"`
- React Query `staleTime` 도메인별 합리적 설정

## 명령어

```bash
pnpm dev              # 개발 서버 (localhost:5173)
pnpm build            # 프로덕션 빌드
pnpm preview          # 빌드 결과 로컬 실행
pnpm test
pnpm test:watch
pnpm typecheck
pnpm lint
pnpm analyze          # 번들 분석
pnpm storybook        # 컴포넌트 카탈로그
```

## Claude Code 변경 시 체크리스트

- [ ] **의존 방향**을 위반하지 않는가 (shared → features/app 금지, features 끼리 import 금지)
- [ ] 새 코드를 어디에 둘지 결정했는가 (한 feature 전용 → `features/<n>/`, 여러 곳에서 사용 → shared modules)
- [ ] 라우트 컴포넌트가 비즈니스 로직 없이 features를 조립만 하는가
- [ ] 페이지 컴포넌트가 `React.lazy`로 로드되는가
- [ ] 환경변수가 zod로 검증되고 `env` 객체로 통일되어 사용되는가
- [ ] URL로 표현 가능한 상태가 URL 밖에 갇혀있지 않은가
- [ ] 큰 테이블/리스트에 가상화가 적용되어 있는가
- [ ] API 호출이 `@repo/api-client`의 서비스별 클라이언트(`usersApi`, `ordersApi` 등)를 통하는가
- [ ] 도메인 타입을 서비스별 namespace(`UsersComponents['schemas']` 등)에서 가져오는가 (직접 재정의 X)
- [ ] 외부 입력(쿼리 파라미터, URL 세그먼트)을 zod로 검증하는가
- [ ] `components/`에 추가한 게 `@repo/ui`로 빠져야 할 도메인 비종속 컴포넌트는 아닌가

## 참고 패턴

```ts
// 환경변수
import { env } from '@/config/env'              // ✅
// import.meta.env.X                              // ❌

// API 호출 — 서비스별 인스턴스
import { usersApi, ordersApi } from '@/lib/api-client'
// fetch('https://...')                          // ❌

// 도메인 타입 — 서비스별 namespace
import type { UsersComponents, OrdersComponents } from '@repo/api-client'
type User = UsersComponents['schemas']['User']
type Order = OrdersComponents['schemas']['Order']

// feature 내부 import (배럴 파일 없음, 직접 경로)
import { UserList } from '@/features/users/components/user-list'

// 디자인 시스템
import { Button } from '@repo/ui/button'

// 로깅
import { logger } from '@/lib/logger'
// console.log(...)                              // ❌
```
