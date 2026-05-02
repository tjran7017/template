# @repo/api-client

타입 안전 HTTP 클라이언트 팩토리. OpenAPI 스펙을 단일 진실 공급원으로, 표준 `fetch` 위에 얇은 wrapper를 제공한다.

- **타입 자동 생성** — `openapi-typescript`로 OpenAPI 스펙 → TypeScript 타입
- **MSA 친화** — 서비스마다 독립된 namespace + 클라이언트 인스턴스
- **런타임 의존성 0** — 표준 `fetch`만 사용 (번들 영향 없음, DevTools 그대로 작동)
- **앱 비종속** — baseURL, 토큰, 401 처리는 앱이 주입
- **확장 가능** — 미들웨어 (`onRequest` / `onResponse`) 패턴으로 서비스별 특수 처리

## Installation

모노레포 워크스페이스 내부에서 사용:

```json
{
  "dependencies": {
    "@repo/api-client": "workspace:*"
  }
}
```

## Setup — codegen

서비스별 Swagger(OpenAPI) URL을 환경변수로 주입. 변수명 prefix가 namespace가 된다:

```bash
# packages/api-client/.env
USERS_SWAGGER_URL=https://api.example.com/users/v3/api-docs
ORDERS_SWAGGER_URL=https://api.example.com/orders/v3/api-docs
```

```bash
pnpm --filter=@repo/api-client generate
# → src/generated/users.d.ts
# → src/generated/orders.d.ts
```

`src/generated/`는 `.gitignore` 대상. CI에서는 빌드 직전 secret으로 주입 후 generate를 실행한다.

## Quick Start

```ts
import { createExampleClient } from '@repo/api-client'

const exampleApi = createExampleClient({
  baseUrl: 'https://api.example.com',
  getAuthToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    window.location.href = '/login'
  },
})

const result = await exampleApi.request('/health', { method: 'get' })
// result: { status: string }  ← OpenAPI 스펙에서 자동 추론
```

`/example` 서비스는 데모용 inline 타입. 실제 서비스는 codegen 후 `services/<name>.ts`에서 동일 패턴으로 생성한다 ([CLAUDE.md](./CLAUDE.md) "새 서비스 추가 절차" 참조).

## API

### `createServiceClient<Paths>(config)`

서비스별 클라이언트 팩토리. 서비스마다 얇은 wrapper로 한 번 더 감싸 사용 (`createExampleClient`처럼).

#### `ServiceConfig`

| 옵션              | 타입                                   | 설명                                                    |
| ----------------- | -------------------------------------- | ------------------------------------------------------- |
| `baseUrl`         | `string`                               | 서비스별 baseURL (gateway 경유 시 path prefix까지 포함) |
| `getAuthToken?`   | `() => string \| null \| Promise<...>` | 매 요청마다 호출 — lazy 평가로 토큰 갱신 자동 대응      |
| `onUnauthorized?` | `() => void \| Promise<void>`          | 401 응답 시 호출 (로그인 redirect, 토큰 리프레시 등)    |
| `fetch?`          | `typeof fetch`                         | 테스트/SSR에서 fetch 주입                               |
| `middleware?`     | `Middleware[]`                         | 서비스별 미들웨어                                       |

#### `request(path, options)`

```ts
await api.request('/users/{id}', {
  method: 'get',
  params: {
    path: { id: '1' },
    query: { include: 'profile' },
  },
})

await api.request('/users', {
  method: 'post',
  body: { name: 'Jane', email: 'jane@example.com' },
})
```

`path`, `method`, `params`, `body`, 응답 모두 OpenAPI 스펙에서 추론된 타입.

### `Middleware`

```ts
import type { Middleware } from '@repo/api-client'

const requestId: Middleware = {
  onRequest(init) {
    return { ...init, headers: { ...init.headers, 'X-Request-Id': crypto.randomUUID() } }
  },
}
```

`onRequest`/`onResponse` 둘 다 선택. 등록한 순서대로 실행.

### `ApiError` / `isApiError`

모든 비-2xx 응답은 `ApiError`로 throw:

```ts
import { isApiError } from '@repo/api-client'

try {
  await api.request('/users/{id}', { method: 'get', params: { path: { id } } })
} catch (e) {
  if (isApiError(e)) {
    if (e.status === 404) showToast('사용자를 찾을 수 없습니다')
    else if (e.code === 'RATE_LIMITED') showToast('잠시 후 다시 시도해주세요')
    else throw e
  }
}
```

`ApiError` 필드: `status`, `code?`, `message`, `response`.

### 타입 헬퍼

깊게 중첩된 OpenAPI 타입을 짧게 꺼내는 유틸리티:

```ts
import type {
  Schema,
  RequestBody,
  RequestQuery,
  RequestParams,
  ResponseBody,
} from '@repo/api-client'

type User = Schema<UsersComponents, 'User'>
type CreateUserBody = RequestBody<UsersPaths, '/users', 'post'>
type UserListResponse = ResponseBody<UsersPaths, '/users', 'get'>
```

## Pattern: Service Namespace

서비스별로 독립된 namespace로 분리해 같은 이름 스키마(`User` 등)가 충돌하지 않게 한다:

```ts
import type { UsersComponents, OrdersComponents } from '@repo/api-client'

type User = UsersComponents['schemas']['User'] // users 서비스의 User
type Order = OrdersComponents['schemas']['Order'] // orders 서비스의 Order
```

새 서비스의 `services/<name>.ts`는 codegen 결과를 namespace로 re-export하는 얇은 wrapper만 작성한다 ([CLAUDE.md](./CLAUDE.md) 참조).

## React Query와 함께

```ts
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/lib/api-client'

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => usersApi.request('/users/{id}', { method: 'get', params: { path: { id } } }),
  })
}
```

> React Query 훅은 패키지에 포함하지 않는다. 쿼리 키 전략과 캐시 정책은 앱/feature별로 다르므로 사용처에서 정의한다.

## Testing

`config.fetch`로 fetch를 주입할 수 있어 MSW 또는 vi.fn() 모킹이 간단:

```ts
import { vi } from 'vitest'
import { createExampleClient } from '@repo/api-client'

const fetchMock = vi
  .fn()
  .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }))

const api = createExampleClient({ baseUrl: 'http://test', fetch: fetchMock })
```

## Scripts

```bash
pnpm --filter=@repo/api-client generate   # OpenAPI → TypeScript 타입 일괄 생성
pnpm --filter=@repo/api-client typecheck
pnpm --filter=@repo/api-client test       # vitest
```

## Contributing

새 서비스 추가 절차, 미들웨어 패턴, codegen 컨벤션은 [`CLAUDE.md`](./CLAUDE.md) 참조.
