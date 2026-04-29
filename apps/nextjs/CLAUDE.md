# nextjs

Next.js 16 (App Router) 기반 앱 베이스 템플릿. feature 단위 모듈 구조 + 단방향 의존 규칙 적용.

> **상위 문서:** 루트 `CLAUDE.md` (모노레포 공통 규칙)
> **이 문서가 우선:** Next.js 특화 결정, 디렉토리 구조 / 의존 규칙

## 앱 목적

SSR / SEO / BFF가 필요한 프로젝트의 출발점. SPA로 충분한 경우는 `apps/react-vite`를 사용.

## 기술 스택

- **Next.js 16** (App Router, Server Components 기본)
- **React 19** + **TypeScript** strict
- **React Query** — 클라이언트 사이드 서버 상태
- **Zustand** — 클라이언트 전역 상태
- **react-hook-form + zod** — 폼 / 검증
- **SCSS Modules**
- **Vitest + React Testing Library** + **MSW** — 테스트
- **Storybook** — 컴포넌트 카탈로그

## 디렉토리 구조

Next.js App Router는 `app/` 폴더를 라우팅에 점유하므로, 앱 초기화 코드(프로바이더 등)는 `app/providers.tsx`에 두고 `RootLayout`에서 사용.

모노레포 환경이라 `packages/*`가 대신 제공하는 폴더는 앱에서 제거됨:

| 일반 React 프로젝트의 폴더 | 이 템플릿에서 처리 |
|---|---|
| `src/types/` (전역 타입) | API 타입은 `@repo/api-client`의 서비스별 namespace(`UsersComponents['schemas']` 등), UI 타입은 `@repo/ui`. 정말 앱 전역 타입이 생기면 `lib/`에 둠 |
| `src/assets/` | Next.js의 `public/`을 사용 |
| `features/{name}/types/` | API 타입은 `@repo/api-client`, 그 외는 같은 feature 내부에서 필요한 파일에 직접 정의 |

전체 구조:

```
apps/nextjs/
├── src/
│   ├── app/                  Next.js App Router (라우팅 + 레이아웃)
│   │   ├── (routes)/         route group — 페이지들
│   │   ├── api/              Route Handlers (BFF)
│   │   ├── layout.tsx
│   │   ├── providers.tsx     QueryClient, Theme 등 클라이언트 프로바이더
│   │   └── globals.scss
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
│   │   ├── api-client/
│   │   │   ├── server.ts     server-only — 서비스별 인스턴스 (쿠키 기반 인증)
│   │   │   └── client.ts     'use client' — 서비스별 인스턴스 (zustand 토큰)
│   │   └── logger.ts
│   ├── stores/               전역 zustand store
│   ├── testing/              MSW handlers, 테스트 유틸
│   └── utils/                앱 전역 공유 유틸 (두 곳 이상에서 사용될 때만)
├── public/                   정적 자산 (이미지, 폰트, favicon 등)
├── .env.example
├── next.config.js
├── tsconfig.json
└── package.json
```

> **`components/` vs `@repo/ui` 구분**
> - `@repo/ui`: 도메인 비종속 디자인 시스템 (Button, Input, Modal, Toast 등)
> - `components/`: 이 앱 전용 레이아웃/위젯 (AppHeader, PageLayout, AuthGate 등)
> - 두 앱이 같은 패턴을 쓰기 시작하면 `@repo/ui`로 추출

> **배럴 파일(`index.ts`)을 의도적으로 사용하지 않음.** Next의 트리 셰이킹 효율과 빌드 성능, IDE 자동 import 정확도를 우선. 외부에서는 파일 경로를 직접 import.

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
4. Next.js App Router의 라우트 컴포넌트는 features를 조립하는 역할만 — 비즈니스 로직을 직접 담지 않음

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
      }
    ]
  }
]
```

## App Router 사용 규칙

### Server / Client 컴포넌트 구분

- **Server Component가 기본** — `'use client'`는 인터랙션이 필요한 leaf 컴포넌트에만
- 데이터 페칭은 가능한 한 **Server Component에서** 직접 (서버 fetch + cache)
- 클라이언트 측 데이터 갱신/뮤테이션은 React Query로
- 서버 액션(Server Actions)은 폼 / 단순 뮤테이션에 활용 가능, 단 권한·검증은 명시적으로
- **`use()` 훅** — React 19. Client Component에서 Promise를 Suspense와 함께 읽을 수 있음. Server Component에서 Context를 조건부로 접근할 때도 사용
- **`ref`를 prop으로 직접** — `forwardRef` 래핑 불필요 (React 19)

### 라우팅 컨벤션

- 페이지 컴포넌트(`page.tsx`)는 **얇은 컨테이너** — features를 import해서 조립만
- 라우트 그룹 `(group)/`으로 도메인별 묶기 권장
- 라우트 단위 에러 바운더리(`error.tsx`), 로딩(`loading.tsx`), not-found(`not-found.tsx`) 적극 사용
- 동적 세그먼트의 파라미터는 **항상 zod로 검증**

### Route Handlers (BFF)

- 외부 API 호출 시 시크릿/내부 토큰이 필요하면 클라이언트가 아니라 Route Handler 경유
- 입력 바디·쿼리는 **zod 스키마로 검증**
- 에러 응답은 일관된 포맷 (예: `{ ok: false, error: { code, message } }`)
- 응답 캐싱은 `next/cache`의 `revalidateTag` / `revalidatePath` 활용

## 환경변수

- 정의: `src/config/env.ts`에서 zod로 검증된 객체로 export
- 클라이언트 노출 변수는 **`NEXT_PUBLIC_` 프리픽스 필수**, 그 외는 서버 전용
- 컴포넌트에서 `process.env.X` 직접 접근 금지 — 항상 `env` 객체 경유

```ts
// src/config/env.ts 패턴
import { z } from 'zod'

const envSchema = z.object({
  // 클라이언트 노출 (서비스별 baseURL — 게이트웨이 경유 시 path prefix만 다를 수 있음)
  NEXT_PUBLIC_USERS_API_URL: z.string().url(),
  NEXT_PUBLIC_ORDERS_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
  // 서버 전용 (내부망 URL, 시크릿 등)
  USERS_API_URL_INTERNAL: z.string().url().optional(),
  INTERNAL_API_TOKEN: z.string().min(1).optional(),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_USERS_API_URL: process.env.NEXT_PUBLIC_USERS_API_URL,
  NEXT_PUBLIC_ORDERS_API_URL: process.env.NEXT_PUBLIC_ORDERS_API_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  USERS_API_URL_INTERNAL: process.env.USERS_API_URL_INTERNAL,
  INTERNAL_API_TOKEN: process.env.INTERNAL_API_TOKEN,
})
```

## 데이터 페칭

- **외부 API 호출은 항상 `@repo/api-client`를 통해** (직접 `fetch` 금지)
- `@repo/api-client`는 백엔드 **서비스별 클라이언트 팩토리**를 제공 (예: `createUsersClient`, `createOrdersClient`)
- API 클라이언트는 `src/lib/api-client/`에서 **server / client 두 컨텍스트로 분리**, 각 파일에서 **사용하는 모든 서비스 인스턴스를 한 번에 생성**
  - `server.ts`: `import 'server-only'`, 쿠키 기반 인증
  - `client.ts`: `'use client'`, zustand 토큰
- 이 앱에서 사용하지 않는 서비스는 인스턴스화하지 않음 → 트리 셰이킹으로 번들에서 제외
- Server Component → 직접 호출 후 props 전달
- Client Component → React Query (`features/*/api/`에 정의)
- React Query 키 팩토리는 각 feature의 `api/queries.ts`에 정의
- 도메인 타입은 서비스별 namespace에서 가져옴 — `UsersComponents['schemas']['User']` 등

```ts
// src/lib/api-client/client.ts 패턴
'use client'
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
  baseUrl: env.NEXT_PUBLIC_USERS_API_URL,
  ...sharedConfig,
})

export const ordersApi = createOrdersClient({
  baseUrl: env.NEXT_PUBLIC_ORDERS_API_URL,
  ...sharedConfig,
})
```

```ts
// features/users/api/get-user.ts 패턴
import { usersApi } from '@/lib/api-client/client'
import type { UsersComponents } from '@repo/api-client'
import { useQuery } from '@tanstack/react-query'

type User = UsersComponents['schemas']['User']

export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await usersApi.GET('/users/{id}', {
        params: { path: { id } },
      })
      if (error) throw error
      return data
    },
  })
}
```

> **두 서비스에 같은 이름 스키마가 있어도 충돌 안 됨** — `UsersComponents['schemas']['User']`와 `OrdersComponents['schemas']['User']`는 서로 다른 namespace.

> **API Gateway / 직접 통신 둘 다 가능** — 게이트웨이 경유라면 `baseUrl: 'https://api.example.com/users'`, 직접 통신이라면 `baseUrl: 'https://users.api.example.com'`. 패키지는 모르고 앱 설정만으로 전환.

## 상태관리

| 종류 | 도구 |
|---|---|
| 서버 상태 | React Query |
| 폼 상태 | react-hook-form + zod |
| 컴포넌트 로컬 상태 | useState |
| 전역 클라이언트 상태 | Zustand (도메인별 store 분리) |
| URL로 표현 가능한 상태 | `useSearchParams` (필터, 페이지네이션, 정렬) |

> **원칙:** URL로 표현 가능한 상태는 반드시 URL에 둔다. 새로고침/공유 시 동일한 화면이 재현되어야 함.

## 스타일링

- SCSS Modules (`*.module.scss`)
- 디자인 토큰은 `@repo/ui`의 CSS 변수 사용
- 글로벌 스타일은 `src/app/globals.scss`에만
- 다크모드는 CSS 변수 기반 (`data-theme` 속성)

## 테스트

- **단위 테스트**: shared modules의 유틸/훅, features의 비즈니스 로직
- **컴포넌트 테스트**: features의 주요 화면 (RTL + MSW)
- 테스트 파일 위치: 대상 파일 옆 `*.test.ts(x)` 또는 `__tests__/`
- MSW handlers는 `src/testing/mocks/`에 도메인별 분리

## 명령어

```bash
pnpm dev              # 개발 서버 (localhost:3000)
pnpm build            # 프로덕션 빌드
pnpm start            # 빌드 결과 실행
pnpm test             # Vitest
pnpm test:watch
pnpm typecheck
pnpm lint
pnpm storybook        # 컴포넌트 카탈로그
```

## Claude Code 변경 시 체크리스트

- [ ] **의존 방향**을 위반하지 않는가 (shared → features/app 금지, features 끼리 import 금지)
- [ ] 새 코드를 어디에 둘지 결정했는가 (한 feature 전용 → `features/<n>/`, 여러 곳에서 사용 → shared modules)
- [ ] 페이지 컴포넌트(`page.tsx`)가 비즈니스 로직 없이 features를 조립만 하는가
- [ ] 환경변수가 zod로 검증되고 `env` 객체로 통일되어 사용되는가
- [ ] 시크릿/내부 토큰이 클라이언트 번들에 포함되지 않는가 (`NEXT_PUBLIC_` 없는 변수가 Client Component에서 접근되지 않는가)
- [ ] 외부 입력(쿼리 파라미터, 요청 바디, 동적 라우트 세그먼트)을 zod로 검증하는가
- [ ] API 호출이 `@repo/api-client`의 서비스별 클라이언트(`usersApi`, `ordersApi` 등)를 통하는가 (server/client 인스턴스 올바르게 선택)
- [ ] 도메인 타입을 서비스별 namespace(`UsersComponents['schemas']` 등)에서 가져오는가 (직접 재정의 X)
- [ ] URL로 표현 가능한 상태가 URL 밖에 갇혀있지 않은가
- [ ] 새 외부 도메인/스크립트 추가 시 보안 헤더(CSP)에 반영했는가
- [ ] `components/`에 추가한 게 `@repo/ui`로 빠져야 할 도메인 비종속 컴포넌트는 아닌가

## 참고 패턴

```ts
// 환경변수
import { env } from '@/config/env'              // ✅
// process.env.X                                  // ❌

// API 호출 (Server Component) — 서비스별 인스턴스
import { usersApi, ordersApi } from '@/lib/api-client/server'

// API 호출 (Client Component)
import { usersApi, ordersApi } from '@/lib/api-client/client'

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
