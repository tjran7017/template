# @repo/api-client

백엔드 **MSA 환경**에 대응하는 타입 안전 HTTP 클라이언트 팩토리. OpenAPI 스펙 → TypeScript 타입 자동 생성 + 표준 fetch 위에 얇은 wrapper.

> **상위 문서:** 루트 `CLAUDE.md` → `packages/CLAUDE.md`
> **이 문서가 우선:** api-client 패키지 특화 규약 — 서비스 추가, codegen, namespace, 미들웨어

## 패키지 목적

- **타입 안전 API 호출** — OpenAPI 스펙을 단일 진실 공급원(SSOT), 백엔드 변경 = 즉시 컴파일 에러
- **MSA 대응** — 서비스마다 독립 namespace + 인스턴스 → 같은 이름 타입 충돌 방지
- **앱 비종속** — 패키지는 HTTP만 책임. 토큰/401/baseURL은 앱이 주입
- **트리 셰이킹 친화** — 앱이 사용하는 서비스만 번들에 포함

## 무엇을 / 무엇을 하지 않는가

| 패키지가 하는 일                      | 패키지가 하지 않는 일                   |
| ------------------------------------- | --------------------------------------- |
| OpenAPI → TypeScript 타입 자동 생성   | React Query 훅 정의 (앱의 feature 책임) |
| HTTP 클라이언트 인스턴스 팩토리 제공  | 인스턴스 자체를 export (앱이 만듦)      |
| 인증/401/에러 변환 미들웨어 슬롯 제공 | 토큰 저장 / 라우팅 (앱 책임)            |
| 서비스별 namespace로 타입 충돌 방지   | 패키지 내부에서 환경변수 직접 접근      |

## 디렉토리 구조

```
packages/api-client/
├── src/
│   ├── generated/              codegen 산출물 (gitignored, 매 빌드마다 fetch)
│   │   └── <service>.d.ts
│   ├── core.ts                 createServiceClient — 모든 서비스 공통 fetch wrapper
│   ├── errors.ts               ApiError, isApiError
│   ├── types.ts                Schema / RequestBody / ResponseBody 등 타입 헬퍼
│   ├── services/               서비스별 팩토리 (얇은 wrapper)
│   │   └── example.ts          데모용 — inline ExamplePaths, codegen 없이 동작
│   ├── core.test.ts            createServiceClient 통합 테스트
│   ├── errors.test.ts          ApiError 단위 테스트
│   └── index.ts                패키지 공개 API
├── scripts/
│   └── generate.ts             *_SWAGGER_URL 환경변수 자동 감지 → 타입 일괄 생성
├── .gitignore                  src/generated/, .env 무시
├── .env.example                서비스별 SWAGGER_URL 예시
├── package.json
├── tsconfig.json               include: ["src", "scripts", "vitest.config.ts"], rootDir: "."
├── vitest.config.ts            node 환경
└── CLAUDE.md
```

> 현재 실제 서비스는 `services/example.ts` (데모) 하나뿐. 실 서비스는 codegen 후 동일 패턴으로 추가.

## 핵심 라이브러리

- **`openapi-typescript`** (devDep) — OpenAPI 3.x 스펙 → TS 타입 정의 생성 (빌드 타임)
- **표준 `fetch`** — 런타임 HTTP는 추가 라이브러리 없이 표준 fetch만 사용

> 런타임 의존성 0 — `dependencies: {}`. 디버깅 시 DevTools Network 탭이 그대로 작동.

## 공개 API

[`src/index.ts`](./src/index.ts) 참조. 카테고리:

- **Errors** — `ApiError`, `isApiError`
- **Core types** — `ServiceConfig`, `Middleware`, `ServiceClient`
- **Type helpers** — `Schema`, `PathOf`, `Method`, `RequestBody`, `RequestQuery`, `RequestParams`, `ResponseBody` (OpenAPI 깊은 path 타입을 짧게 꺼내는 유틸)
- **Service factories** — `createExampleClient` + 서비스 namespace re-export (실 서비스 추가 시 같은 패턴)

## 코어 패턴

### 1. 서비스 팩토리 — 얇은 wrapper

각 서비스의 `services/<name>.ts`는 `createServiceClient<paths>(config)` 한 줄로 끝나는 얇은 wrapper. 추가 로직 금지 (필요하면 `config.middleware`로):

```ts
// services/<name>.ts (실 서비스 — codegen 후)
import { createServiceClient, type ServiceConfig } from '../core.js'
import type { paths } from '../generated/<name>.js'

export function create<Name>Client(config: ServiceConfig) {
  return createServiceClient<paths>(config)
}

export type {
  components as <Name>Components,
  paths as <Name>Paths,
  operations as <Name>Operations,
} from '../generated/<name>.js'
```

데모 서비스(`services/example.ts`)는 codegen 없이 동작하도록 `ExamplePaths`를 inline으로 정의. 패턴 학습용이며 실 서비스에는 사용하지 않음.

### 2. 서비스 namespace 분리

같은 이름 스키마(`User`)가 여러 서비스에 있어도 충돌하지 않도록 namespace로 분리:

```ts
import type { UsersComponents, OrdersComponents } from '@repo/api-client'

type User = UsersComponents['schemas']['User'] // users 서비스
type Order = OrdersComponents['schemas']['Order'] // orders 서비스
```

### 3. 타입 헬퍼

OpenAPI에서 생성된 path 기반 타입은 깊게 중첩되어 가독성이 떨어짐. 자주 쓰는 패턴은 `src/types.ts`의 헬퍼로 짧게 꺼냄:

```ts
import type { Schema, RequestBody, ResponseBody } from '@repo/api-client'

type User = Schema<UsersComponents, 'User'>
type CreateUserBody = RequestBody<UsersPaths, '/users', 'post'>
type UserListResponse = ResponseBody<UsersPaths, '/users', 'get'>
```

전체 정의는 [`src/types.ts`](./src/types.ts) 참조.

### 4. 미들웨어 패턴

서비스별 특수 처리(요청 ID, 로깅, 재시도)는 `config.middleware`로 주입. 패키지 내부 수정 금지:

```ts
import type { Middleware } from '@repo/api-client'

const requestId: Middleware = {
  onRequest(init) {
    return { ...init, headers: { ...init.headers, 'X-Request-Id': crypto.randomUUID() } }
  },
}
```

`onRequest`/`onResponse` 둘 다 선택적. 등록 순서대로 실행.

## codegen 파이프라인

### 환경변수 패턴

서비스별 Swagger URL을 `<SERVICE>_SWAGGER_URL` 형태로 환경변수에 주입. prefix가 namespace가 됨:

```bash
# packages/api-client/.env (gitignored)
USERS_SWAGGER_URL=https://api.example.com/users/v3/api-docs
ORDERS_SWAGGER_URL=https://api.example.com/orders/v3/api-docs
```

`scripts/generate.ts`가 모든 `*_SWAGGER_URL`을 자동 감지 → `src/generated/<name>.d.ts` 생성. 새 서비스 추가 시 스크립트 수정 불필요. 환경변수가 하나도 없으면 친절한 에러로 종료.

### gitignore

`src/generated/`, `.env`, `.env.local`은 [`/.gitignore`](./.gitignore) 대상. CI에서 secret으로 주입 후 `pnpm generate`를 빌드 직전 실행.

### codegen 실행 시점

- **로컬**: 처음 클론 후 1회 + 백엔드 스펙 변경 알림 시 수동 실행
- **CI**: 빌드 직전 항상 실행 (최신 스펙 반영)
- **자동 PR (선택)**: `schedule: cron`으로 매일 generate 후 변경분이 있으면 PR 자동 생성

## 새 서비스 추가 절차

1. **백엔드 Swagger URL 확보** — `https://api.example.com/<service>/v3/api-docs` 형태
2. **`.env`에 `<SERVICE>_SWAGGER_URL` 추가** — prefix가 namespace 기준 (`USERS_SWAGGER_URL` → `users`)
3. **`pnpm --filter=@repo/api-client generate` 실행** — `src/generated/<name>.d.ts` 생성 확인
4. **`src/services/<name>.ts` 작성** — "코어 패턴 1. 서비스 팩토리" 템플릿 그대로
5. **`src/index.ts`에 export 추가** — `create<Name>Client`, `<Name>Components`, `<Name>Paths`, `<Name>Operations`
6. **앱에서 인스턴스화** — `apps/<n>/src/lib/api-client.ts`에서 `create<Name>Client(...)` 호출

## 테스트

- **vitest** + **node 환경** (DOM 없이 fetch 모킹만 검증)
- **단위 테스트** — `ApiError.from`, `isApiError` ([`src/errors.test.ts`](./src/errors.test.ts))
- **통합 테스트** — `createServiceClient` 동작: 401 핸들러, 토큰 헤더, path 치환, 미들웨어, 비-2xx 에러 변환 ([`src/core.test.ts`](./src/core.test.ts))
- 테스트는 `config.fetch`로 `vi.fn()` 주입 (MSW도 사용 가능). 패키지 자체 모킹 불필요
- `src/generated/` 자동 생성물은 테스트 대상 아님 (스펙이 진실)
- 테스트 파일에서 `as any` 캐스트는 루트 `eslint.config.js`의 `**/*.test.ts` 오버라이드로 허용

## TypeScript 설정 주의사항

[`tsconfig.json`](./tsconfig.json):

- `extends: "@repo/config/typescript/library"`에서 `composite: true`를 **off** — 소스 직접 export 패키지라 빌드 산출물 불필요
- `rootDir: "."`, `include: ["src", "scripts", "vitest.config.ts"]` — `scripts/`와 `vitest.config.ts`도 포함해야 ESLint projectService가 인식
- 위 설정 없이 `scripts/`만 외부에 두면 ESLint가 "not found by the project service" 에러 발생

## ESLint 오버라이드 (루트)

루트 [`eslint.config.js`](../../eslint.config.js)에서:

- `**/scripts/**/*.ts` — `process.env`, dynamic import 등으로 type-unsafe 규칙 해제
- `**/*.test.ts` — `as any`, 외부 라이브러리 모킹 등 허용

## 명령어

```bash
pnpm --filter=@repo/api-client generate   # OpenAPI → 타입 일괄 생성
pnpm --filter=@repo/api-client typecheck
pnpm --filter=@repo/api-client test       # vitest run
```

## Claude Code 변경 시 체크리스트

- [ ] 새 서비스 추가 시 **6단계 절차** 모두 완료 (Swagger URL → `.env` → generate → service.ts → index.ts → 앱 인스턴스화)
- [ ] 서비스별 팩토리는 **얇은 wrapper만** — 비즈니스 로직 / 도메인 변환 금지
- [ ] 도메인 타입은 namespace 분리 (`UsersComponents['schemas']['User']`) 또는 헬퍼(`Schema<UsersComponents, 'User'>`) 사용
- [ ] 패키지 내부에서 환경변수 직접 접근 금지 — 모든 설정은 `ServiceConfig`로 받음 (codegen 스크립트는 빌드 타임 예외)
- [ ] React / 라우터 등 프레임워크 의존 추가 금지 — 패키지는 HTTP만 책임
- [ ] 새 미들웨어가 모든 서비스 공통이면 `core.ts`, 특정 서비스만이면 앱이 `config.middleware`로 주입
- [ ] codegen 산출물(`src/generated/`)과 `.env`가 커밋되지 않는가
- [ ] 새 서비스 export가 `src/index.ts`에 등록됐는가 (factory + namespace types + operations)
- [ ] 백엔드 스펙 갱신 시 영향 받는 앱이 모두 빌드/타입체크 통과하는가
