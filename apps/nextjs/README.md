# nextjs

`fe-monorepo-template`의 Next.js 16 앱 베이스. App Router + React 19 + React Query + Zustand + zod 검증된 환경변수.

- **Server Component 기본** — 인터랙션 leaf만 `'use client'`
- **단방향 의존** — `app → features → shared modules` (ESLint zone으로 강제)
- **단일 환경변수 진입점** — `src/config/env.ts`에서 zod 검증
- **`@repo/api-client` 통합** — server/client 컨텍스트별 인스턴스 분리
- **MSW + Vitest** — `src/testing/`에 셋업

## Quick Start

```bash
cp apps/nextjs/.env.example apps/nextjs/.env.local
pnpm install
pnpm dev --filter=nextjs       # http://localhost:3000
```

## 디렉토리 구조

```
apps/nextjs/
├── src/
│   ├── app/                Next App Router (layout, page, providers, globals)
│   ├── components/         앱 특화 위젯 (디자인 시스템은 @repo/ui)
│   ├── config/env.ts       zod로 검증된 환경변수 (process.env 직접 접근 금지)
│   ├── features/           기능 단위 모듈 (가장 많은 코드)
│   │   └── health/         데모 feature — Server-state + 컴포넌트
│   ├── lib/
│   │   ├── api-client/     server.ts (server-only) / client.ts ('use client')
│   │   └── logger.ts
│   ├── stores/             전역 zustand store
│   └── testing/            MSW handlers + 테스트 유틸
├── next.config.js
├── tsconfig.json           extends @repo/config/typescript/next
└── eslint.config.js        extends @repo/config/eslint/next + import zone
```

## 환경변수

`src/config/env.ts`만 `process.env`에 접근. 나머지는 `import { env } from '@/config/env'`.

| 변수                          | 용도                                 |
| ----------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_EXAMPLE_API_URL` | api-client baseUrl (클라이언트 노출) |
| `NEXT_PUBLIC_APP_ENV`         | development \| staging \| production |
| `INTERNAL_API_TOKEN`          | (선택) 서버 전용 시크릿              |

ESLint `no-restricted-properties` 규칙으로 `env.ts` 외부에서 `process.env` 직접 접근을 차단한다.

## 명령어

```bash
pnpm dev --filter=nextjs           # 개발 서버
pnpm build --filter=nextjs         # 프로덕션 빌드
pnpm test --filter=nextjs          # vitest run
pnpm typecheck --filter=nextjs
pnpm lint --filter=nextjs
```

## Contributing

작성/수정 규약, 의존 방향, 변경 시 체크리스트는 [`CLAUDE.md`](./CLAUDE.md) 참조.
