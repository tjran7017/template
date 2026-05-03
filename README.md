# fe-monorepo-template

Turborepo + pnpm workspaces 기반 프론트엔드 모노레포 템플릿. 새 프로젝트 시작 시 clone하여 빌드 파이프라인 / 디자인 시스템 / API 클라이언트 / 폼·상태·테스트 도구의 공통 셋업 없이 도메인 코드부터 작성할 수 있게 한다.

## 목적

- **스택을 매번 새로 짜지 않는다** — Turborepo 파이프라인, ESLint·TS strict, Vitest+MSW, Husky+commitlint 사전 셋업
- **MSA를 가정한 API 클라이언트** — 서비스마다 namespace 분리, OpenAPI codegen, 토큰/401 미들웨어 슬롯
- **공통 디자인 시스템** — CSS 변수 토큰 + React 19 단순 primitive, Storybook 카탈로그
- **두 앱 패턴 시연** — Next.js (SSR/RSC) / Vite SPA. 같은 패키지(`@repo/ui`, `@repo/api-client`)를 다른 환경에서 어떻게 쓰는지

## 워크스페이스 구조

```
fe-monorepo-template/
├── apps/
│   ├── nextjs/           Next.js 16 App Router — SSR/SEO/BFF가 필요한 앱
│   └── react-vite/       Vite 5 + React 19 — SPA (대시보드/관리자 등)
├── packages/
│   ├── config/           ESLint / TypeScript / Prettier preset
│   ├── api-client/       서비스별 API 클라이언트 팩토리 (OpenAPI codegen)
│   └── ui/               디자인 토큰 + primitive 컴포넌트 + Storybook
├── docs/                 ADR / phase 로그 / 작업 계획
├── turbo.json
└── pnpm-workspace.yaml
```

의존 방향 (단방향, ESLint zone으로 강제):

```
apps/* ─→ packages/*
packages/ui, packages/api-client ─→ packages/config
packages/ui ✗ packages/api-client     (UI는 데이터 비종속)
```

## 데모 페이지

| 앱         | 경로                        | 시연                                                                 |
| ---------- | --------------------------- | -------------------------------------------------------------------- |
| nextjs     | `/`                         | Server Component (정적) — 두 데모 링크                               |
| nextjs     | `/ssr`                      | page-level await + async Server Component + Suspense streaming       |
| nextjs     | `/csr`                      | Server Component + `'use client'` Section + React Query              |
| nextjs     | `/api/health`, `/api/stats` | Route Handler (BFF)                                                  |
| react-vite | `/`                         | 정적 — 데모 링크                                                     |
| react-vite | `/health`                   | `useSuspenseQuery` + 라우트 boundary 위임 (Suspense + ErrorBoundary) |
| react-vite | `/orders`                   | `useSuspenseQuery` 주문 목록                                         |
| react-vite | `/orders/new`               | `react-hook-form + zod + useMutation` → `invalidateQueries`          |

세부 패턴 / 결정 근거는 각 앱의 `CLAUDE.md` · `README.md`. 핵심 구현 위치는 아래 ["주요 구현 위치"](#주요-구현-위치).

## 주요 구현 위치

기술 결정의 _증거 코드_ 위치. 각 항목 한 파일만 보면 패턴 의도 파악 가능.

### 인프라

- [`eslint.config.js`](eslint.config.js) — 단방향 의존 zone 강제 (shared → features/app 차단, feature 간 cross-import 차단)
- [`turbo.json`](turbo.json) — 빌드 파이프라인 + 캐시 의존 그래프
- [`commitlint.config.js`](commitlint.config.js) — type/scope enum 화이트리스트

### packages

- [`packages/api-client/src/core.ts`](packages/api-client/src/core.ts) — 타입 안전 fetch wrapper (lazy fetch resolve, 미들웨어 슬롯, 401 hook)
- [`packages/api-client/scripts/generate.ts`](packages/api-client/scripts/generate.ts) — `*_SWAGGER_URL` 자동 감지 OpenAPI codegen
- [`packages/ui/src/primitives/card/card.tsx`](packages/ui/src/primitives/card/card.tsx) — composite 컴포넌트 named export 패턴 (`Card` / `CardHeader` / `CardBody` / `CardFooter` — dot-notation X)

### apps/nextjs (SSR)

- [`apps/nextjs/src/app/ssr/page.tsx`](apps/nextjs/src/app/ssr/page.tsx) — page-level await + async Server Component + Suspense streaming

### apps/react-vite (SPA)

- [`apps/react-vite/src/app/router.tsx`](apps/react-vite/src/app/router.tsx) — react-router 7 route-level lazy + Component alias
- [`apps/react-vite/src/app/routes/root.tsx`](apps/react-vite/src/app/routes/root.tsx) — Suspense + ErrorBoundary 위임 boundary (자식 라우트의 `useSuspenseQuery` throw 흡수)

## 시작하기

```bash
git clone <this-repo> my-project && cd my-project
pnpm install
```

프로젝트 정보 갱신:

- 루트 `package.json`의 `name`, `description` 수정
- 사용하지 않는 앱 제거 (`apps/nextjs` 또는 `apps/react-vite`) — 동시에 `eslint.config.js`의 해당 zone 블록도 제거
- 각 앱의 `.env.example` → `.env.local` 복사 + 값 채우기
- (react-vite) `pnpm --filter=react-vite exec msw init public/` — MSW worker 파일 재생성 (필요 시)

API 타입 생성 (실 백엔드 연결 시):

- `packages/api-client/.env`에 `<SERVICE>_SWAGGER_URL` 형식으로 OpenAPI 스펙 URL 주입
- `pnpm --filter=@repo/api-client generate` 실행 → `packages/api-client/src/generated/<service>.d.ts` 생성
- `src/services/<service>.ts`에 클라이언트 팩토리 추가, `src/index.ts`에 export

## 공통 명령어

| 명령                                      | 동작                                    |
| ----------------------------------------- | --------------------------------------- |
| `pnpm dev`                                | 모든 앱 개발 모드                       |
| `pnpm dev --filter=nextjs`                | 특정 앱만 (`react-vite`도 동일 패턴)    |
| `pnpm build`                              | 전체 빌드                               |
| `pnpm lint`                               | 전체 ESLint (`--max-warnings 0`)        |
| `pnpm typecheck`                          | 전체 `tsc --noEmit`                     |
| `pnpm test`                               | 전체 vitest                             |
| `pnpm --filter=@repo/api-client generate` | API 타입 재생성                         |
| `pnpm --filter=@repo/ui storybook`        | 디자인 시스템 카탈로그 (localhost:6006) |

## 문서

| 위치                                       | 독자                           | 내용                                     |
| ------------------------------------------ | ------------------------------ | ---------------------------------------- |
| 루트 [`CLAUDE.md`](CLAUDE.md)              | 코드 작성/수정자 (사람·Claude) | 모노레포 전역 규칙, 의존 방향, 절대 금지 |
| 루트 [`README.md`](README.md)              | 신규 합류자                    | 이 문서 — 셋업·명령어·문서 맵            |
| [`packages/CLAUDE.md`](packages/CLAUDE.md) | 패키지 작성자                  | 공개 API, 빌드 정책, 새 패키지 추가 절차 |
| 각 패키지/앱 `CLAUDE.md`                   | 해당 위치 작업자               | 패키지/앱 특화 규약                      |
| 각 패키지/앱 `README.md`                   | 사용자                         | 패키지/앱 사용법, 데모                   |
| [`docs/phase-log.md`](docs/phase-log.md)   | 기술 결정 흐름 추적            | Phase 0-6 결정/이터레이션 기록           |
| [`docs/agent-plan.md`](docs/agent-plan.md) | 신규 phase 진입 시             | 단계별 산출물·성공 기준                  |

## 새 앱/패키지 추가

- **앱**: `apps/<kebab-case-name>/` — 자체 `CLAUDE.md` + `README.md` 작성, 루트 `CLAUDE.md` 문서 맵에 한 줄 추가, `eslint.config.js`에 ESLint zone 블록 추가
- **패키지**: `packages/<kebab-case-name>/` — [`packages/CLAUDE.md`](packages/CLAUDE.md) "새 패키지 추가 절차" 8단계 따름

새 의존성은 항상 해당 워크스페이스 안에서 추가:

```bash
pnpm --filter=nextjs add <package>
pnpm --filter=@repo/ui add -D <dev-package>
```

## 컨벤션 요약

- TypeScript strict, `any` 금지 (불가피하면 `unknown` + 사유 주석)
- 파일/폴더 `kebab-case`, 컴포넌트 `PascalCase`, 함수/변수 `camelCase`
- 커밋: Conventional Commits (`<type>(<scope>): <subject>`)
  - type: `feat | fix | refactor | docs | test | chore | perf | style`
  - scope: `nextjs | react-vite | ui | api-client | config | repo`
- PR: squash merge 기본, 제목은 커밋 컨벤션과 동일 (squash 시 PR 제목이 커밋 메시지)

전체 규칙: 루트 [`CLAUDE.md`](CLAUDE.md).

## 요구 사항

- Node.js `>=20`
- pnpm `>=9`
