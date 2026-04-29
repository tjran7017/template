# @repo/api-client

백엔드 MSA 환경을 위한 타입 안전 API 클라이언트. OpenAPI 스펙으로부터 타입을 자동 생성하고, 서비스마다 독립된 클라이언트 인스턴스를 만들 수 있는 팩토리를 제공.

## Why — 왜 만들었나

앱이 늘어날수록, 그리고 백엔드가 마이크로서비스로 쪼개질수록 다음 패턴이 반복됐다:

- 백엔드 API 응답 타입을 손으로 다시 작성하고, 백엔드가 필드를 바꾸면 런타임에 가서야 깨진다
- 인증 헤더 주입, 401 처리, 에러 변환 로직을 앱마다 복붙한다
- 서비스가 여러 개일 때 `User`, `Order` 같은 같은 이름 타입이 충돌해서 `UserDto`, `UserResponse` 같은 임시 이름을 짓는다
- 앱마다 baseURL, 토큰 저장소, 로그인 redirect 동작이 달라서 공통 클라이언트로 묶기 어렵다

이 패키지는 위 문제를 한 번에 해결하면서, 앱이 환경 차이를 흡수할 수 있도록 **인스턴스 대신 팩토리**를 제공한다.

## How — 어떻게 풀었나

### 1. OpenAPI 스펙 = 단일 진실 공급원

타입은 `openapi-typescript`로 자동 생성한다. 백엔드의 Swagger 엔드포인트(`/v3/api-docs` 등)를 환경변수로 받아 빌드 타임에 fetch한다.

```bash
# .env
USERS_SWAGGER_URL=https://api.example.com/users/v3/api-docs
ORDERS_SWAGGER_URL=https://api.example.com/orders/v3/api-docs
```

```bash
pnpm --filter=@repo/api-client generate
# → src/generated/users.d.ts
# → src/generated/orders.d.ts
```

새 서비스를 추가할 때 `.env`에 한 줄만 더하면 스크립트가 자동 감지한다.

### 2. 서비스별 namespace로 타입 충돌 방지

각 서비스의 타입은 독립된 namespace로 re-export된다:

```ts
import type { UsersComponents, OrdersComponents } from '@repo/api-client'

type User = UsersComponents['schemas']['User']    // users 서비스의 User
type Order = OrdersComponents['schemas']['Order'] // orders 서비스의 Order
// 같은 이름 'User'가 양쪽에 있어도 충돌 없음
```

깊게 중첩된 path 기반 타입은 헬퍼로 짧게 꺼낸다:

```ts
import type { Schema, RequestBody, ResponseBody } from '@repo/api-client'

type User = Schema<UsersComponents, 'User'>
type CreateUserBody = RequestBody<UsersPaths, '/users', 'post'>
type UserListResponse = ResponseBody<UsersPaths, '/users', 'get'>
```

### 3. 팩토리 + 표준 fetch

패키지는 인스턴스를 export하지 않는다. 앱이 환경에 맞춰 직접 만든다:

```ts
import { createUsersClient, createOrdersClient } from '@repo/api-client'

const sharedConfig = {
  getAuthToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => {
    useAuthStore.getState().clear()
    window.location.href = '/login'
  },
}

export const usersApi = createUsersClient({
  baseUrl: import.meta.env.VITE_USERS_API_URL,
  ...sharedConfig,
})

export const ordersApi = createOrdersClient({
  baseUrl: import.meta.env.VITE_ORDERS_API_URL,
  ...sharedConfig,
})
```

런타임은 표준 `fetch` 위에 얇은 타입 wrapper만 얹었다:

```ts
const user = await usersApi.request('/users/{id}', {
  method: 'get',
  params: { path: { id: '1' } },
})
// user의 타입은 OpenAPI 스펙에서 자동 추론
```

path 파라미터 치환, 인증 헤더 주입, 401 처리, 에러 변환은 wrapper가 담당한다.

## Result — 무엇이 좋아졌나

- **백엔드 변경을 즉시 감지** — Swagger 갱신 → `pnpm generate` → 모든 사용처에서 컴파일 에러로 영향 파악
- **새 앱 추가 시 패키지 수정 0** — `createXxxClient(...)` 한 줄로 인스턴스 생성
- **런타임 의존성 0** — 표준 fetch 사용. 번들 크기 영향 없음, DevTools Network 탭에서 그대로 디버깅
- **트리 셰이킹 친화** — 앱이 사용하는 서비스 namespace만 번들에 포함
- **MSA / Gateway / BFF 모두 같은 코드** — `baseUrl`만 달라질 뿐, 호출 방식은 동일

## 사용법

### 설치 (모노레포 워크스페이스)

```json
// apps/<your-app>/package.json
{
  "dependencies": {
    "@repo/api-client": "workspace:*"
  }
}
```

### 서비스 인스턴스 생성

```ts
// apps/<your-app>/src/lib/api-client.ts
import { createUsersClient, type ServiceConfig } from '@repo/api-client'

export const usersApi = createUsersClient({
  baseUrl: import.meta.env.VITE_USERS_API_URL,
  getAuthToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => { window.location.href = '/login' },
})
```

### 호출

```ts
// GET /users?search=jane
const list = await usersApi.request('/users', {
  method: 'get',
  params: { query: { search: 'jane' } },
})

// POST /users
const created = await usersApi.request('/users', {
  method: 'post',
  body: { name: 'Jane', email: 'jane@example.com' },
})

// GET /users/{id}
const user = await usersApi.request('/users/{id}', {
  method: 'get',
  params: { path: { id: '1' } },
})
```

### React Query와 함께

```ts
// features/users/api/get-user.ts
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/lib/api-client'

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () =>
      usersApi.request('/users/{id}', {
        method: 'get',
        params: { path: { id } },
      }),
  })
}
```

> React Query 훅은 패키지에 포함하지 않는다. 쿼리 키 전략과 캐시 정책은 앱/feature별로 다르기 때문에 사용처에서 정의한다.

### 미들웨어 확장

서비스별 특수 처리(요청 ID 헤더, 로깅, 재시도 등)는 미들웨어로 주입:

```ts
import type { Middleware } from '@repo/api-client'

const requestIdMiddleware: Middleware = {
  onRequest(init) {
    return {
      ...init,
      headers: { ...init.headers, 'X-Request-Id': crypto.randomUUID() },
    }
  },
}

export const paymentsApi = createPaymentsClient({
  baseUrl: env.NEXT_PUBLIC_PAYMENTS_API_URL,
  ...sharedConfig,
  middleware: [requestIdMiddleware],
})
```

### 에러 처리

모든 비-2xx 응답은 `ApiError`로 throw된다:

```ts
import { isApiError } from '@repo/api-client'

try {
  await usersApi.request('/users/{id}', { method: 'get', params: { path: { id } } })
} catch (e) {
  if (isApiError(e)) {
    if (e.status === 404) showToast('사용자를 찾을 수 없습니다')
    else if (e.code === 'RATE_LIMITED') showToast('잠시 후 다시 시도해주세요')
    else throw e
  }
}
```

## 자주 묻는 질문

### 왜 인스턴스를 직접 export하지 않나?

앱마다 baseURL, 토큰 소스, 401 처리가 다르다. 패키지가 인스턴스를 만들면 앱별 다양성을 막고 환경변수 의존을 패키지로 끌어와 모듈 경계가 깨진다.

### 왜 `openapi-fetch` 같은 라이브러리 대신 표준 fetch를 쓰나?

외부 의존을 줄여 번들 크기와 학습 부담을 최소화하기 위해서다. 디버깅 시 표준 도구(브라우저 DevTools Network 탭)가 그대로 작동하고, 타입 안전은 `openapi-typescript`로 생성한 `paths` 타입과 얇은 wrapper만으로 확보된다.

### `Schema` / `RequestBody` 같은 헬퍼는 언제 쓰나?

짧고 자주 쓰는 타입은 namespace를 직접 풀어쓰는 게 가독성이 더 좋을 때가 있다 (`UsersComponents['schemas']['User']`). 깊게 중첩된 path 기반 타입을 꺼낼 때(`Paths['/users']['post']['requestBody']['content']['application/json']`) 헬퍼가 빛을 발한다 (`RequestBody<UsersPaths, '/users', 'post'>`). 팀 컨벤션으로 둘 중 하나로 통일해도 되고, 둘 다 같은 타입을 가리키므로 호환된다.

### React Query 훅을 패키지에 두면 안 되나?

쿼리 키 전략, 캐시 정책, invalidation 범위가 앱/feature별로 다르다. 또한 React Query 버전을 앱마다 다르게 쓸 수 있어 peerDependency 부담도 생긴다. 본 모노레포의 컨벤션은 React Query 훅을 `apps/<n>/src/features/*/api/`에 두는 것이다.

### 두 서비스의 같은 이름 스키마(`User`)가 충돌하지 않나?

충돌하지 않는다. `UsersComponents['schemas']['User']`와 `OrdersComponents['schemas']['User']`는 서로 다른 namespace이므로 TypeScript가 별개 타입으로 인식한다. 의미가 정말 같은 객체라면 둘 중 하나로 단일화하는 건 백엔드 팀과의 도메인 합의 영역이다.

### API Gateway 환경에서도 동작하나?

동작한다. `baseUrl`을 게이트웨이 + path prefix로 설정하면 된다 (`https://api.example.com/users`). 패키지는 게이트웨이 유무를 모르고, 앱 설정만으로 직접 통신/게이트웨이 통신을 전환할 수 있다.

### BFF(Backend for Frontend)가 있다면?

BFF 자체를 하나의 서비스로 보면 된다. `services/bff.ts`만 두고 BFF가 내부에서 여러 마이크로서비스를 조율하게 한다. 프론트엔드는 BFF 하나만 호출한다. BFF가 있는 구조와 없는 구조를 같은 패키지로 모두 표현할 수 있다.

### 백엔드 Swagger 엔드포인트에 인증이 필요하다면?

codegen 스크립트는 빌드 타임에만 동작하므로 `.env` 또는 CI secret으로 인증 토큰을 주입하면 된다. 필요하면 `scripts/generate.ts`에서 `openapiTS`에 fetch 옵션을 전달해 헤더를 추가할 수 있다. 단, **codegen 인증과 런타임 인증은 다른 토큰**이라는 점에 유의 — codegen은 사내 빌드 머신용, 런타임은 사용자 인증이다.

## 명령어

```bash
# 모든 서비스 OpenAPI 스펙으로부터 타입 일괄 생성
pnpm --filter=@repo/api-client generate

# 타입 체크
pnpm --filter=@repo/api-client typecheck

# 테스트
pnpm --filter=@repo/api-client test
```

## 새 서비스 추가

자세한 절차와 디렉토리 컨벤션은 [`CLAUDE.md`](./CLAUDE.md) 참고.
