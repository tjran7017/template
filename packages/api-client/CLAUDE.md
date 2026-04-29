# @repo/api-client

백엔드 **MSA 환경**에 대응하는 타입 안전 API 클라이언트 팩토리. OpenAPI 스펙으로부터 타입을 자동 생성하고, 서비스마다 독립된 클라이언트 인스턴스를 만들 수 있는 팩토리 함수를 제공.

> **상위 문서:** 루트 `CLAUDE.md` → `packages/CLAUDE.md`
> **이 문서가 우선:** api-client 패키지 특화 규약 — 서비스 추가, codegen, namespace, 미들웨어

## 패키지 목적

- **타입 안전 API 호출** — OpenAPI 스펙을 단일 진실 공급원(SSOT)으로 두고, 백엔드 변경을 즉시 컴파일 에러로 감지
- **MSA 대응** — 백엔드가 여러 서비스로 나뉜 환경에서, 각 서비스를 독립된 namespace + 인스턴스로 분리
- **앱 비종속** — 패키지는 HTTP만 책임. 인증 토큰, 401 처리, baseURL은 앱이 주입
- **트리 셰이킹 친화** — 앱이 사용하는 서비스만 번들에 포함

## 무엇을 / 무엇을 하지 않는가

| 패키지가 하는 일 | 패키지가 하지 않는 일 |
|---|---|
| OpenAPI 스펙 → TypeScript 타입 자동 생성 | React Query 훅 정의 (앱의 feature 책임) |
| HTTP 클라이언트 인스턴스 팩토리 제공 | 인스턴스 자체를 export (앱이 만듦) |
| 인증/401/에러 변환 미들웨어 제공 | 토큰 저장 / 라우팅 (앱 책임) |
| 서비스별 namespace로 타입 충돌 방지 | 환경변수 직접 접근 |

## 디렉토리 구조

```
packages/api-client/
├── src/
│   ├── generated/              codegen 산출물 (gitignored, Swagger URL에서 직접 fetch)
│   │   ├── users.d.ts
│   │   ├── orders.d.ts
│   │   └── payments.d.ts
│   ├── core.ts                 createServiceClient — 모든 서비스 공통 fetch wrapper
│   ├── errors.ts               ApiError, isApiError
│   ├── types.ts                Schema / RequestBody / ResponseBody 등 타입 헬퍼
│   ├── services/               서비스별 팩토리 (얇은 wrapper)
│   │   ├── users.ts            createUsersClient + UsersComponents/UsersPaths re-export
│   │   ├── orders.ts
│   │   └── payments.ts
│   └── index.ts                패키지 공개 API
├── scripts/
│   └── generate.ts             백엔드 Swagger URL → 타입 일괄 생성
├── .gitignore                  src/generated/ 무시
├── .env.example                서비스별 SWAGGER_URL 예시
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## 핵심 라이브러리

- **`openapi-typescript`** — OpenAPI 3.x 스펙 → TypeScript 타입 정의 생성 (빌드 타임)
- **표준 `fetch`** — 런타임 HTTP는 추가 라이브러리 없이 표준 fetch 사용. 패키지는 fetch 위에 얇은 타입 안전 wrapper만 제공

> 타입은 `openapi-typescript`로 자동 생성하지만, 런타임은 fetch + 얇은 wrapper 조합. 외부 의존을 최소화하고 디버깅이 쉽도록.

## 공개 API (export)

```ts
// src/index.ts
// 코어
export { ApiError, isApiError } from './errors'
export type { ServiceConfig, Middleware } from './core'

// 타입 헬퍼 (서비스 namespace에서 자주 쓰는 타입을 짧게 꺼냄)
export type {
  Schema,
  PathOf,
  Method,
  RequestBody,
  RequestQuery,
  RequestParams,
  ResponseBody,
} from './types'

// 서비스별 팩토리
export { createUsersClient } from './services/users'
export { createOrdersClient } from './services/orders'
export { createPaymentsClient } from './services/payments'

// 서비스별 도메인 타입 (namespace 분리)
export type { UsersComponents, UsersPaths } from './services/users'
export type { OrdersComponents, OrdersPaths } from './services/orders'
export type { PaymentsComponents, PaymentsPaths } from './services/payments'
```

```json
// package.json
{
  "name": "@repo/api-client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "generate": "tsx scripts/generate.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest"
  },
  "dependencies": {
    "@repo/config": "workspace:*"
  },
  "devDependencies": {
    "openapi-typescript": "^7.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  }
}
```

> **런타임 의존성 없음** — 표준 `fetch`만 사용. 번들 크기에 거의 영향이 없고, 디버깅 시 표준 도구(브라우저 DevTools Network 탭 등)로 충분.
> **`peerDependencies` 없음** — React에 의존하지 않는 순수 HTTP 패키지.

## 코어 구현 패턴

### `src/types.ts` — 타입 헬퍼

OpenAPI에서 생성된 `paths` / `components`는 깊게 중첩되어 있어, 사용처에서 직접 풀어쓰면 가독성이 떨어짐. 자주 쓰는 패턴을 짧은 별칭으로 제공.

```ts
// 모든 서비스의 paths/components 형태가 동일하므로 제너릭으로 작성

/** components.schemas.<K> 를 짧게 꺼냄 */
export type Schema<
  Components extends { schemas: Record<string, unknown> },
  K extends keyof Components['schemas'],
> = Components['schemas'][K]

/** Paths 객체에서 path 문자열만 추출 */
export type PathOf<Paths> = keyof Paths & string

/** HTTP 메서드 — paths[P] 안에 정의된 것만 허용 */
export type Method<Paths, P extends PathOf<Paths>> = keyof Paths[P] & string

/** 요청 바디 추출 — 예: RequestBody<UsersPaths, '/users', 'post'> */
export type RequestBody<
  Paths,
  P extends PathOf<Paths>,
  M extends Method<Paths, P>,
> = Paths[P][M] extends {
  requestBody?: { content: { 'application/json': infer B } }
}
  ? B
  : never

/** 쿼리 파라미터 추출 */
export type RequestQuery<
  Paths,
  P extends PathOf<Paths>,
  M extends Method<Paths, P>,
> = Paths[P][M] extends { parameters: { query?: infer Q } } ? Q : never

/** path 파라미터 추출 */
export type RequestParams<
  Paths,
  P extends PathOf<Paths>,
  M extends Method<Paths, P>,
> = Paths[P][M] extends { parameters: { path?: infer P2 } } ? P2 : never

/** 200 응답 바디 추출 */
export type ResponseBody<
  Paths,
  P extends PathOf<Paths>,
  M extends Method<Paths, P>,
> = Paths[P][M] extends {
  responses: { 200: { content: { 'application/json': infer R } } }
}
  ? R
  : never
```

사용 예시:

```ts
import type { Schema, RequestBody, ResponseBody, UsersComponents, UsersPaths } from '@repo/api-client'

// 길게 쓰는 대신
type User = UsersComponents['schemas']['User']
// 짧게
type User = Schema<UsersComponents, 'User'>

// 요청/응답 타입 추출
type CreateUserBody = RequestBody<UsersPaths, '/users', 'post'>
type UserListResponse = ResponseBody<UsersPaths, '/users', 'get'>
```

### `src/core.ts` — fetch wrapper + 공통 인증/에러 처리

```ts
import { ApiError } from './errors'
import type {
  PathOf,
  Method,
  RequestBody,
  RequestQuery,
  RequestParams,
  ResponseBody,
} from './types'

export type Middleware = {
  onRequest?: (init: RequestInit & { url: string }) => RequestInit & { url: string } | Promise<RequestInit & { url: string }>
  onResponse?: (response: Response) => Response | Promise<Response>
}

export type ServiceConfig = {
  /** 서비스별 baseURL (게이트웨이 경유 시 path prefix만 다를 수 있음) */
  baseUrl: string
  /** 매 요청마다 호출되어 토큰을 가져옴 — lazy 평가로 토큰 갱신에 자동 대응 */
  getAuthToken?: () => string | null | Promise<string | null>
  /** 401 응답 시 호출 (예: 로그인 페이지 redirect, 토큰 리프레시) */
  onUnauthorized?: () => void | Promise<void>
  /** 테스트/SSR에서 fetch 주입 가능 */
  fetch?: typeof fetch
  /** 서비스별 추가 미들웨어 */
  middleware?: Middleware[]
}

/** path/메서드/요청/응답이 모두 OpenAPI 타입으로 추론되는 옵션 */
type RequestOptions<
  Paths,
  P extends PathOf<Paths>,
  M extends Method<Paths, P>,
> = {
  method: M
  // params는 path/query 모두 있을 때만 필수, 없으면 생략 가능
  params?: {
    path?: RequestParams<Paths, P, M>
    query?: RequestQuery<Paths, P, M>
  }
  body?: RequestBody<Paths, P, M>
  signal?: AbortSignal
  headers?: HeadersInit
}

export function createServiceClient<Paths extends {}>(config: ServiceConfig) {
  const baseFetch = config.fetch ?? fetch

  /** path 파라미터 치환: '/users/{id}' + { id: '1' } → '/users/1' */
  function fillPath(path: string, params?: Record<string, unknown>): string {
    if (!params) return path
    return path.replace(/\{(\w+)\}/g, (_, key) => {
      const value = params[key]
      if (value === undefined) throw new Error(`Missing path param: ${key}`)
      return encodeURIComponent(String(value))
    })
  }

  function buildUrl(path: string, opts: RequestOptions<Paths, any, any>): string {
    const filled = fillPath(path, opts.params?.path as Record<string, unknown>)
    const url = new URL(filled, config.baseUrl)
    const query = opts.params?.query as Record<string, unknown> | undefined
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue
        url.searchParams.set(k, String(v))
      }
    }
    return url.toString()
  }

  async function request<
    P extends PathOf<Paths>,
    M extends Method<Paths, P>,
  >(path: P, opts: RequestOptions<Paths, P, M>): Promise<ResponseBody<Paths, P, M>> {
    let init: RequestInit & { url: string } = {
      url: buildUrl(path, opts),
      method: opts.method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...opts.headers,
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    }

    // 인증 헤더 주입
    const token = await config.getAuthToken?.()
    if (token) {
      init.headers = { ...init.headers, Authorization: `Bearer ${token}` }
    }

    // 미들웨어 onRequest
    for (const mw of config.middleware ?? []) {
      if (mw.onRequest) init = await mw.onRequest(init)
    }

    const { url, ...fetchInit } = init
    let response = await baseFetch(url, fetchInit)

    // 미들웨어 onResponse
    for (const mw of config.middleware ?? []) {
      if (mw.onResponse) response = await mw.onResponse(response)
    }

    if (response.status === 401) await config.onUnauthorized?.()
    if (!response.ok) throw await ApiError.from(response)

    // 204 No Content 등 빈 응답 처리
    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as ResponseBody<Paths, P, M>
  }

  return { request }
}

export type ServiceClient<Paths extends {}> = ReturnType<typeof createServiceClient<Paths>>
```

### `src/services/users.ts` — 서비스별 팩토리 (얇은 wrapper)

```ts
import { createServiceClient, type ServiceConfig } from '../core'
import type { paths } from '../generated/users'

export function createUsersClient(config: ServiceConfig) {
  return createServiceClient<paths>(config)
}

// namespace 분리를 위한 re-export
export type {
  components as UsersComponents,
  paths as UsersPaths,
  operations as UsersOperations,
} from '../generated/users'
```

> **모든 서비스 팩토리는 위 패턴을 그대로 따름** — 서비스마다 다른 로직을 넣지 않음. 차이가 필요하면 `config.middleware`로 주입.

### `src/errors.ts` — 표준 에러

```ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
    public readonly response: Response,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static async from(response: Response): Promise<ApiError> {
    let code: string | undefined
    let message = response.statusText
    try {
      const body = (await response.clone().json()) as {
        code?: string
        message?: string
      }
      code = body.code
      if (body.message) message = body.message
    } catch {
      // body가 JSON이 아니면 statusText 유지
    }
    return new ApiError(response.status, code, message, response)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
```

## codegen 파이프라인

### 환경변수 (`.env.example`)

서비스별 Swagger(OpenAPI) URL을 환경변수로 받음. 로컬에선 `.env`, CI에선 secret으로 주입.

```bash
# packages/api-client/.env.example
USERS_SWAGGER_URL=https://api.example.com/users/v3/api-docs
ORDERS_SWAGGER_URL=https://api.example.com/orders/v3/api-docs
PAYMENTS_SWAGGER_URL=https://api.example.com/payments/v3/api-docs
```

> 패턴: `<SERVICE>_SWAGGER_URL` — 접미사로 서비스명 자동 감지. 새 서비스 추가 시 `.env`에 한 줄만 추가하면 됨.

### `scripts/generate.ts` — Swagger URL에서 직접 fetch해 타입 생성

```ts
import openapiTS, { astToString } from 'openapi-typescript'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../src/generated')

const SUFFIX = '_SWAGGER_URL'

async function main() {
  await mkdir(outDir, { recursive: true })

  // 환경변수에서 *_SWAGGER_URL 항목을 모두 수집
  const targets = Object.entries(process.env)
    .filter(([key, value]) => key.endsWith(SUFFIX) && value)
    .map(([key, value]) => ({
      // USERS_SWAGGER_URL → users
      name: key.slice(0, -SUFFIX.length).toLowerCase(),
      url: value as string,
    }))

  if (targets.length === 0) {
    throw new Error(
      `No *_SWAGGER_URL env vars found. Set them in .env or CI secrets. (e.g. USERS_SWAGGER_URL)`,
    )
  }

  await Promise.all(
    targets.map(async ({ name, url }) => {
      console.log(`→ fetching ${name} from ${url}`)
      const ast = await openapiTS(new URL(url))
      await writeFile(join(outDir, `${name}.d.ts`), astToString(ast))
      console.log(`✓ generated: ${name}.d.ts`)
    }),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

> 새 서비스 추가 시 **`.env`에 `<SERVICE>_SWAGGER_URL` 한 줄 추가** → `pnpm generate` → 자동으로 `src/generated/<service>.d.ts` 생성. 스크립트 수정 불필요.

### `.gitignore`

```
src/generated/
.env
.env.local
```

생성물과 환경변수는 커밋하지 않음. CI에서 `.env`를 secret으로 주입한 뒤 `pnpm --filter=@repo/api-client generate`를 빌드 전에 실행.

### codegen 실행 시점

- **로컬 개발**: 처음 클론 후 1회 + 백엔드 스펙 변경 알림 받았을 때 수동 실행
- **CI 빌드**: 빌드 직전 항상 실행 (가장 최신 스펙 반영)
- **자동 PR (선택)**: 별도 스케줄 워크플로우(`schedule: cron`)로 매일 generate 후 변경분이 있으면 PR 자동 생성

## 새 서비스 추가 절차

1. **백엔드 Swagger URL 확보** — 백엔드 팀에서 OpenAPI(Swagger) 엔드포인트 받기 (예: `https://api.example.com/<service>/v3/api-docs`)
2. **`.env`에 `<SERVICE>_SWAGGER_URL` 추가** — 변수명의 prefix가 namespace 기준이 됨 (`USERS_SWAGGER_URL` → `users`)
3. **`pnpm --filter=@repo/api-client generate` 실행** — `src/generated/<service>.d.ts` 생성 확인
4. **`src/services/<service>.ts` 작성** — 팩토리 + namespace re-export (위 `users.ts` 패턴 그대로)
5. **`src/index.ts`에 export 추가** — `create<Service>Client`, `<Service>Components`, `<Service>Paths`
6. **앱에서 인스턴스화** — `apps/<n>/src/lib/api-client*` 에서 `createXxxClient(...)` 호출

```ts
// 예: payments 서비스 추가
// src/services/payments.ts
import { createServiceClient, type ServiceConfig } from '../core'
import type { paths } from '../generated/payments'

export function createPaymentsClient(config: ServiceConfig) {
  return createServiceClient<paths>(config)
}

export type {
  components as PaymentsComponents,
  paths as PaymentsPaths,
} from '../generated/payments'
```

## 미들웨어 확장 패턴

서비스별 특수 처리가 필요하면 `config.middleware`로 주입. 패키지 내부를 수정하지 않음.

```ts
import type { Middleware } from '@repo/api-client'

// 예: 결제 서비스만 요청 ID 헤더 추가
const requestIdMiddleware: Middleware = {
  onRequest(init) {
    return {
      ...init,
      headers: {
        ...init.headers,
        'X-Request-Id': crypto.randomUUID(),
      },
    }
  },
}

export const paymentsApi = createPaymentsClient({
  baseUrl: env.NEXT_PUBLIC_PAYMENTS_API_URL,
  ...sharedConfig,
  middleware: [requestIdMiddleware],
})
```

## 테스트

- **단위 테스트**: `ApiError.from`, `isApiError`, codegen 스크립트 등 순수 로직
- **통합 테스트**: `createServiceClient`의 미들웨어 동작 — 401 핸들러 호출, 토큰 헤더 주입, 에러 변환
- 테스트 시 `config.fetch`로 MSW의 fetch를 주입 — 패키지 자체를 모킹할 필요 없음
- `src/generated/` 자동 생성물은 테스트 대상 아님 (스펙이 진실)

```ts
// src/core.test.ts 패턴
import { describe, it, expect, vi } from 'vitest'
import { createServiceClient } from './core'

it('401 응답 시 onUnauthorized 호출', async () => {
  const onUnauthorized = vi.fn()
  const client = createServiceClient<any>({
    baseUrl: 'https://example.com',
    onUnauthorized,
    fetch: vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
  })

  await expect(
    client.request('/test', { method: 'get' as any }),
  ).rejects.toThrow()
  expect(onUnauthorized).toHaveBeenCalled()
})

it('path 파라미터를 URL에 치환', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response('{"id":"1"}', { status: 200 }),
  )
  const client = createServiceClient<any>({
    baseUrl: 'https://example.com',
    fetch: fetchMock,
  })

  await client.request('/users/{id}' as any, {
    method: 'get' as any,
    params: { path: { id: '1' } },
  })

  expect(fetchMock).toHaveBeenCalledWith(
    'https://example.com/users/1',
    expect.any(Object),
  )
})
```

## 명령어

```bash
# 모든 서비스 OpenAPI 스펙으로부터 타입 일괄 생성
pnpm --filter=@repo/api-client generate

# 타입 체크
pnpm --filter=@repo/api-client typecheck

# 테스트
pnpm --filter=@repo/api-client test
```

## Claude Code 변경 시 체크리스트

- [ ] 새 서비스 추가 시 **6단계 절차** 모두 완료 (Swagger URL 확보 → `.env` 추가 → generate → service.ts → index.ts → 앱 인스턴스화)
- [ ] 서비스별 팩토리는 **얇은 wrapper만** — 비즈니스 로직 / 도메인 변환 금지
- [ ] 도메인 타입은 namespace 분리 (`UsersComponents['schemas']['User']` 형태) 또는 헬퍼(`Schema<UsersComponents, 'User'>`) 사용
- [ ] 패키지 내부에서 환경변수 직접 접근 금지 — 모든 설정은 `ServiceConfig`로 받음 (단, codegen 스크립트는 예외 — 빌드 타임에만 동작)
- [ ] React / 라우터 등 프레임워크 의존 추가 금지 — 패키지는 HTTP만 책임
- [ ] 새 미들웨어가 모든 서비스 공통이면 `core.ts`, 특정 서비스만이면 앱이 `config.middleware`로 주입
- [ ] codegen 산출물(`src/generated/`)과 `.env`가 커밋되지 않는가 (`.gitignore` 확인)
- [ ] Swagger URL이 변경되거나 백엔드 스펙이 갱신되면 영향 받는 앱이 모두 빌드/타입체크 통과하는가
