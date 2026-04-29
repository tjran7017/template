# 모노레포 템플릿 구현 + CLAUDE.md 경량화 진행 계획

## Context

이 레포는 5개의 CLAUDE.md(총 1,701줄)에 의도된 아키텍처가 정밀하게 기술되어 있지만 **실제 코드/설정은 0**이다 (`package.json`, `turbo.json`, `pnpm-workspace.yaml`조차 없음 — 순수 문서 템플릿 상태).

목표:

1. **CLAUDE.md를 명세서로 삼아** 모노레포 셋업과 각 영역(패키지/앱)을 차례로 구현
2. **각 영역 구현 직후** 해당 CLAUDE.md를 경량화 — 실제 코드로 대체 가능한 인라인 예시, 중복, 도메인 특화 샘플(`users`/`orders`/`payments`)을 정리하여 "규칙 + 네비게이션" 중심 문서로 압축

이전 평가에서 도출한 문제(api-client 569줄 등 비대, 인라인 코드 다수)를 구현과 동시에 자연스럽게 해소하는 것이 핵심.

## 진행 방식 (사용자 결정사항)

- 각 영역마다 **구현 + 경량화 함께** 처리 (신선한 컨텍스트로 정확도 확보)
- 같은 의존 레벨도 **직렬 진행** (검토 단순화)
- **단계마다 커밋 후 사용자 검토 대기**
- **메인 세션에서 직접 작업** (에이전트 위임 없음, 패턴 일관성 메인이 책임)

## 의존 그래프 기반 진행 순서

```
[1] 루트 셋업
        ↓
[2] packages/config
        ↓
[3] packages/api-client    (config에 의존)
        ↓
[4] packages/ui            (config에 의존)
        ↓
[5] apps/nextjs            (config + api-client + ui에 의존)
        ↓
[6] apps/react-vite        (config + api-client + ui에 의존)
```

각 단계 종료 시 — 구현 + CLAUDE.md 경량화 + `pnpm install` / typecheck / lint 검증 + 커밋 + 사용자 검토 대기.

---

## 단계별 산출물

### [1] 루트 셋업

**구현:**
- `package.json` (name, scripts: `dev`/`build`/`lint`/`typecheck`/`test`, devDependencies: turbo/husky/lint-staged/commitlint/prettier)
- `pnpm-workspace.yaml` (`apps/*`, `packages/*`)
- `turbo.json` (pipeline: build/lint/typecheck/test/dev, cache 설정)
- `.gitignore` (node_modules, dist, .turbo, .next, .env, generated)
- `.prettierrc`, `.prettierignore`
- `commitlint.config.cjs` (Conventional Commits + 한국어 subject 허용, scope 제한)
- `.husky/pre-commit` (lint-staged), `.husky/commit-msg` (commitlint)
- `.lintstagedrc` (변경 파일에 prettier + eslint --fix)
- 루트 `tsconfig.json` (가능하면 base는 packages/config로 위임)
- `.editorconfig`

**CLAUDE.md 경량화 (루트):**
- `packages/CLAUDE.md`와 중복되는 의존 그래프 → 루트는 한 줄 요약, 상세는 `packages/CLAUDE.md`로 위임
- "공통 명령어" 섹션 — 실제 `package.json`의 scripts와 동기화 (불일치 시 코드 우선)
- "절대 하지 말 것" / "문서 맵" 등 네비게이션·규칙은 유지

**검증:** `pnpm install` 성공, husky 훅이 등록되었는지 확인.

---

### [2] packages/config

**구현:**
- `package.json` (name: `@repo/config`, private, exports: `./eslint`, `./eslint-next`, `./eslint-react`, `./tsconfig/base.json`, `./tsconfig/next.json`, `./tsconfig/vite.json`, `./prettier`)
- `eslint/index.js` (TS strict, import 순서, no-explicit-any 등)
- `eslint/next.js`, `eslint/react.js` (각 앱용 preset, `import/no-restricted-paths` 강제)
- `tsconfig/base.json`, `tsconfig/next.json`, `tsconfig/vite.json`
- `prettier/index.js`

**CLAUDE.md 경량화 (`packages/config/CLAUDE.md` 271줄):**
- 인라인 설정 예시 → 실제 preset 파일 참조로 대체
- 사용법은 README로 이동, CLAUDE.md는 "preset 추가/수정 절차"와 "변경 시 영향 범위(루트 + 두 앱)" 규칙만 유지

**검증:** `pnpm --filter=@repo/config build` (필요 시), 다른 패키지가 import 가능한지.

---

### [3] packages/api-client

**구현:**
- `package.json` (`openapi-typescript`, `openapi-fetch`, peerDeps 없음 — 표준 fetch 사용)
- `src/core.ts` (`createServiceClient`, `ServiceConfig`, `Middleware`)
- `src/errors.ts` (`ApiError`, `isApiError`)
- `src/types.ts` (`Schema`, `PathOf`, `Method`, `RequestBody`, `RequestQuery`, `RequestParams`, `ResponseBody` 헬퍼)
- `src/services/_template.ts` (서비스 추가용 템플릿 — 도메인 비종속)
- `src/index.ts` (공개 API)
- `scripts/generate.ts` (Swagger URL → 타입 일괄 생성)
- `.env.example` (`<SERVICE>_SWAGGER_URL` 패턴)
- `.gitignore` (`src/generated/`)
- 단위 테스트 (`core.test.ts`, `errors.test.ts`)

**CLAUDE.md 경량화 (569줄 → 목표 ~250줄):**
- 도메인 특화 예시 (`createUsersClient`, `UsersComponents` 등) → `_template.ts` 한 곳에 두고 CLAUDE.md는 "서비스 추가 시 `_template.ts` 복사" 한 줄
- 인라인 코드 블록 다수 → 실제 파일 경로 참조로 교체
- 미들웨어/인증 패턴 — 핵심 규칙만 남기고 사용 예시는 README로
- 중복된 "무엇을/무엇을 하지 않는가" — 공개 API 섹션과 통합

**검증:** `pnpm --filter=@repo/api-client test`, `pnpm --filter=@repo/api-client typecheck`.

---

### [4] packages/ui

**구현:**
- `package.json` (peerDeps: react/react-dom, deps: clsx, `@repo/config`)
- `src/tokens.css` (디자인 토큰 — CSS 변수, `data-theme` 다크모드 대응)
- 최소 primitive 1-2개 (`src/button/`, 또는 빈 골격) — 템플릿이므로 과도한 컴포넌트 구현 X
- `src/index.ts` 및 subpath exports
- Storybook 셋업 (선택 — README와 일치하면 추가, 아니면 다음 단계로 미룸)
- 단위 테스트 1개 (패턴 데모용)

**CLAUDE.md 경량화 (`packages/ui/CLAUDE.md` 401줄):**
- Storybook / 토큰 / 다크모드 인라인 예시 → 실제 파일로
- "@repo/ui 컴포넌트 추가 절차" 위주로 압축

**검증:** typecheck, 다른 패키지에서 import 가능 여부.

---

### [5] apps/nextjs

**구현:**
- `package.json` (next 14, react 19, react-query, zustand, react-hook-form, zod, vitest, MSW)
- `next.config.js`, `tsconfig.json` (config 패키지 상속)
- `src/app/layout.tsx`, `src/app/providers.tsx`, `src/app/globals.scss`, `src/app/(routes)/page.tsx` (최소 페이지)
- `src/config/env.ts` (zod 검증)
- `src/lib/api-client/server.ts` (`import 'server-only'`), `src/lib/api-client/client.ts` (`'use client'`)
- `src/lib/logger.ts`
- `src/features/_template/` (feature 단위 템플릿 — api/components/hooks/stores/utils)
- `src/testing/` (MSW 셋업)
- ESLint 설정 (`@repo/config/eslint-next` + `import/no-restricted-paths` zones)
- `.env.example`

**CLAUDE.md 경량화 (`apps/nextjs/CLAUDE.md` 330줄):**
- env / api-client 인라인 코드 (155-243줄) → 실제 파일 경로 참조
- 도메인 특화 예시 (`UsersComponents`, `userKeys` 등) → `_template` feature 참조
- 체크리스트 10개 → 핵심 5개로 압축
- 디렉토리 구조 다이어그램 — 실제 파일이 있으니 핵심만 유지

**검증:** `pnpm --filter=nextjs build`, `pnpm --filter=nextjs typecheck`, `pnpm --filter=nextjs lint`, dev 서버 기동 확인.

---

### [6] apps/react-vite

**구현:**
- `package.json` (vite, react 19, react-router(또는 tanstack-router), react-query, zustand, react-hook-form, zod, vitest)
- `vite.config.ts`, `tsconfig.json`, `index.html`
- `src/main.tsx`, `src/router.tsx` (또는 라우트 정의)
- `src/config/env.ts`
- `src/lib/api-client.ts` (단일 컨텍스트, nextjs와 달리 server/client 분리 X)
- `src/lib/logger.ts`
- `src/features/_template/`
- `src/testing/` (MSW)
- ESLint 설정 (`@repo/config/eslint-react`)
- `.env.example`

**CLAUDE.md 경량화 (`apps/react-vite/CLAUDE.md` 406줄):**
- nextjs와 동일한 원칙 — 인라인 코드 → 파일 참조, 도메인 예시 → 템플릿 참조, 체크리스트 압축
- nextjs와 react-vite의 **공통 규칙은 루트로**, 차이점만 각 앱에 두는 방향 검토 (단, 공통 규칙이 너무 많으면 그대로 둠)

**검증:** `pnpm --filter=react-vite build`, `pnpm --filter=react-vite typecheck`, `pnpm --filter=react-vite lint`, dev 서버 기동 확인.

---

## CLAUDE.md 경량화 공통 원칙

각 단계의 경량화 시 일관되게 적용:

1. **인라인 코드 예시 → 실제 starter 파일로 이전.** CLAUDE.md는 "`src/...` 경로의 패턴을 따르라" 한 줄로.
2. **도메인 특화 예시(users/orders/payments) → 도메인 비종속 `_template`으로.** 템플릿 레포의 정체성 유지.
3. **중복 제거**: 좁은 범위 문서가 이김 (루트 의존 그래프는 한 줄 → packages/CLAUDE.md에 상세).
4. **체크리스트 압축**: 10개 내외 → 정말 PR에서 강제할 핵심 3-5개.
5. **README와의 역할 분리**: "왜?" / "이게 뭐?"는 README, "어떻게 작성/수정?" / "하지 말 것"은 CLAUDE.md.
6. **유지할 것**: 문서 맵, 우선순위 규칙(좁은 범위 우선), "절대 하지 말 것" 목록, 의존 방향 핵심 다이어그램.

## 비목표

- 외부 publish, CI 워크플로(.github/workflows), 도커, 배포 설정 — 별도 작업
- 풍부한 디자인 시스템 컴포넌트 (템플릿이므로 골격만)
- 실제 OpenAPI 스펙 연동 (예시 generate 스크립트만, Swagger URL은 사용자가 채움)

## 검증 (전체)

각 단계 끝과 마지막에 모두 통과해야 함:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

마지막 단계 후:
- 두 앱의 dev 서버가 각각 기동되어야 함 (`pnpm dev --filter=nextjs`, `pnpm dev --filter=react-vite`)
- husky 훅이 실제로 작동 (lint-staged + commitlint)
- 의존 그래프 위반 시 ESLint가 에러를 내는지 확인 (`features` 끼리 import 시도해보기)

## 검토 포인트 (사용자가 단계마다 확인할 것)

- [1] 루트 셋업: scripts와 turbo pipeline이 의도와 맞는지
- [2] config: preset이 두 앱에서 공유 가능한 형태인지
- [3] api-client: MSA 가정이 코드에 반영되었는지, namespace 충돌 방지 패턴 제대로 잡혔는지
- [4] ui: 토큰/컴포넌트의 추상화 레벨 적절한지
- [5] nextjs: server/client api-client 분리, env zod 검증, BFF 라우트 패턴
- [6] react-vite: SPA에 맞는 단순화가 적용되었는지 (server/client 분리 없음)
- 매 단계 — CLAUDE.md가 너무 줄어들어 정보가 빠지진 않았는지
