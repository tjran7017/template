# nextjs

`fe-monorepo-template`의 Next.js 16 앱 베이스. App Router + React 19 + 데이터 페칭 패턴 비교 데모.

- **Server Component 기본** — 인터랙션 leaf만 `'use client'`
- **단방향 의존** — `app → features → shared` (ESLint zone 강제)
- **단일 환경변수 진입점** — `src/config/env.ts`에서 zod 검증
- **`@repo/api-client` 통합** — server/client 컨텍스트별 인스턴스 분리
- **MSW + Vitest** — 통합 테스트 (성공/실패 시나리오)
- **트리 셰이킹 최적화** — `sideEffects` + `optimizePackageImports`

## Quick Start

```bash
cp apps/nextjs/.env.example apps/nextjs/.env.local
pnpm install
pnpm --filter=nextjs dev          # http://localhost:3000
```

## 데모 페이지

| 경로          | 패턴                              | 설명                                                                                                        |
| ------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `/`           | Server Component (정적)           | 두 데모 페이지로의 링크                                                                                     |
| `/ssr`        | Server Component (동적)           | **page-level await** + **async Server Component + Suspense** 두 패턴 비교. `error.tsx` + `loading.tsx` 동반 |
| `/csr`        | Server Component + Client Section | `useQuery` + 'use client' Section 패턴. `error.tsx` + `loading.tsx` 동반                                    |
| `/api/health` | Route Handler                     | `{ status: 'ok' }` 즉시 반환                                                                                |
| `/api/stats`  | Route Handler                     | `{ uptime, requestsPerMin }` — 1.5초 인위 지연으로 streaming 효과 시연                                      |

## 디렉토리 구조

```
apps/nextjs/src/
├── app/
│   ├── api/<route>/route.ts   Route Handlers (BFF)
│   ├── <segment>/
│   │   ├── page.tsx
│   │   ├── loading.tsx        자동 Suspense fallback
│   │   └── error.tsx          자동 Error Boundary
│   ├── layout.tsx
│   ├── providers.tsx          QueryClientProvider + Devtools (dev only)
│   └── globals.scss           @repo/ui CSS + .page-container + 키프레임
├── components/                앱 전용 위젯 (BackLink 등)
├── config/env.ts              zod로 검증된 환경변수
├── features/<n>/
│   ├── api/                   getX (server-only) + useX (use client) + 쿼리 키
│   └── components/            <name>/<name>.tsx + index.ts 폴더 + barrels
├── lib/
│   ├── api-client/{server,client}.ts
│   └── logger.ts
├── stores/auth.ts             전역 zustand
└── testing/                   MSW handlers + renderWithProviders
```

자세한 컨벤션·의존 규칙은 [`CLAUDE.md`](./CLAUDE.md).

## 데이터 페칭 패턴

### SSR — page-level await

페이지 본체가 데이터 기다린 뒤 렌더. 실패는 throw → `error.tsx`. SEO/필수 정보용.

### SSR — async Server Component + Suspense (streaming)

page에서 Promise만 시작 → async sub-component가 await → Suspense fallback → resolve 후 RSC 청크 streaming. 보조 정보·느린 쿼리·panel 단위 fail 격리.

### CSR — Client Section + React Query

page는 Server Component, 데이터 부분만 Client Component (`useQuery` + early return). Devtools 자동 활성 (dev).

세 패턴 모두 같은 presentational 컴포넌트(`HealthStatus`, `StatsPanel`)를 재사용.

## 환경변수

`src/config/env.ts`만 `process.env`에 접근 (ESLint로 강제). 나머지는 `import { env } from '@/config/env'`.

| 변수                          | 용도                                               |
| ----------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_EXAMPLE_API_URL` | api-client baseUrl (클라이언트 노출)               |
| `NEXT_PUBLIC_APP_ENV`         | development \| staging \| production (dev 분기 등) |
| `INTERNAL_API_TOKEN`          | (선택) 서버 전용 시크릿                            |

## 주요 패턴

- **컴포넌트 폴더**: `<name>/<name>.tsx + index.ts + (.module.scss + .d.ts + .test.tsx)`
- **API 모듈**: `getX` ('server-only', SSR) + `useX` ('use client', CSR) + 쿼리 키 팩토리
- **Discriminated union props** — 상태 머신 타입 안전 (예: `StatsPanelProps`)
- **`page-container` 글로벌 클래스** — 모든 페이지 공통 레이아웃 (`globals.scss`)
- **`pulse` 키프레임** — skeleton/loading 애니메이션
- **`vi.mock('server-only')`** — vitest setup에서 (api 배럴 호환)

## 명령어

```bash
pnpm --filter=nextjs dev          # 개발 서버
pnpm --filter=nextjs build        # 프로덕션 빌드
pnpm --filter=nextjs start        # 프로덕션 실행
pnpm --filter=nextjs test         # vitest run
pnpm --filter=nextjs typecheck
pnpm --filter=nextjs lint
```

## Contributing

작성/수정 규약, 의존 방향, 변경 시 체크리스트는 [`CLAUDE.md`](./CLAUDE.md).
