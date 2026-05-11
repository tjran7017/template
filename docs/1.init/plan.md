# Agent Implementation Plan

모노레포 템플릿 실 구현 + CLAUDE.md 경량화 계획.  
작성일: 2026-04-29

## 전제

- 현재 상태: 문서(CLAUDE.md)만 있는 빈 레포. `package.json`, `turbo.json`, `pnpm-workspace.yaml` 미존재.
- 모든 구현이 처음부터 필요.
- 각 Phase = 1 PR. Phase 완료 즉시 해당 CLAUDE.md 경량화 포함.
- Phase 2↔3, Phase 4↔5는 병렬 에이전트로 동시 실행.

---

## Phase 0 — 모노레포 골격

**브랜치**: `feat/phase-0-monorepo-skeleton`  
**에이전트**: `code-architect` (설계/구현) → `code-reviewer` (검토)  
**병렬 여부**: 순차 (모든 후속의 기반)

### 산출물

- `package.json` (name, scripts, lint-staged, prettier, commitlint 설정)
- `pnpm-workspace.yaml`
- `.npmrc` (`shamefully-hoist=false`, `auto-install-peers=true`)
- `turbo.json` (pipeline: `build`, `dev`, `lint`, `typecheck`, `test`, `generate` + `^build` 의존)
- `.gitignore` (`node_modules`, `dist`, `.turbo`, `src/generated`, `.env*`)
- `.editorconfig`
- `.env.example` (루트)
- `tsconfig.json` (루트 — 참조 전용, 실 빌드는 워크스페이스별)
- Husky + lint-staged 셋업 (pre-commit: lint + format + typecheck)
- commitlint 셋업 (commit-msg: Conventional Commits 강제)

### 성공 기준

- [ ] `pnpm install` clean clone에서 통과
- [ ] `pnpm lint && pnpm typecheck` 통과 (대상 없어도 에러 없음)
- [ ] Husky pre-commit hook 실 작동 확인
- [ ] commitlint가 `feat(scope): ...` 형식 강제 확인

### CLAUDE.md 경량화 (Phase 0 완료 후)

대상 없음 (루트 CLAUDE.md는 Phase 6에서 일괄 정리).

---

## Phase 1 — `@repo/config`

**브랜치**: `feat/phase-1-config`  
**에이전트**: `code-architect` (preset 설계) → `tdd-guide` (검증 테스트) → `code-reviewer` (검토)  
**병렬 여부**: 순차 (다른 모든 워크스페이스가 의존)

### 산출물

- `packages/config/package.json` (exports 9개, peer: eslint/typescript)
- `typescript/base.json`
- `typescript/next.json`
- `typescript/vite.json`
- `typescript/library.json`
- `eslint/base.js` (TypeScript, import order, prettier)
- `eslint/react.js`
- `eslint/next.js`
- `eslint/vite-react.js`
- `eslint/library.js`
- `prettier/index.js`

### 성공 기준

- [ ] `pnpm --filter=@repo/config typecheck` 통과
- [ ] 다른 패키지에서 `extends: "@repo/config/typescript/base"` 사용 가능

### CLAUDE.md 경량화 (Phase 1 완료 후)

`packages/config/CLAUDE.md`에서 제거:

- tsconfig 본문 전체 인용 코드 블록
- preset별 설정값 예제 코드
- 장문의 "왜 이 값인가" 설명 (README로 이동)

유지:

- 각 preset이 언제 적합한지 (1-2줄 요약 + 실제 파일 링크)
- ESLint flat config 호환성 주의사항
- "변경 시 모든 워크스페이스 빌드 확인" 체크리스트

---

## Phase 2 — `@repo/api-client` (Phase 3과 병렬)

**브랜치**: `feat/phase-2-api-client`  
**에이전트**: `tdd-guide` 주도 (Red→Green→Refactor) → `code-architect` (codegen 스크립트 검토) → `code-reviewer`  
**병렬 여부**: Phase 3과 동시 실행 (서로 무의존)

### 산출물

- `packages/api-client/package.json` (exports `.`, devDeps: openapi-typescript, tsx)
- `src/types.ts` (Schema, PathOf, Method, RequestBody, RequestQuery, RequestParams, ResponseBody)
- `src/errors.ts` (`ApiError`, `isApiError`)
- `src/core.ts` (`createServiceClient`, `Middleware`, `ServiceConfig`, fillPath/buildUrl/request)
- `src/services/example.ts` (데모용 service 1개 — Swagger 스펙 없이 시작)
- `scripts/generate.ts` (`*_SWAGGER_URL` 환경변수 자동 감지, 스펙 없을 때 친절한 에러)
- `.env.example` (EXAMPLE_SWAGGER_URL 예시)
- `.gitignore` (`src/generated/`, `.env`)
- `src/index.ts` (공개 API export)
- 단위 테스트: `core.test.ts` (401 핸들러, path 치환, 미들웨어), `errors.test.ts`

### 성공 기준

- [ ] `pnpm --filter=@repo/api-client test` 통과
- [ ] `pnpm --filter=@repo/api-client typecheck` 통과
- [ ] `pnpm --filter=@repo/api-client generate` — 스펙 없을 때 친절한 에러 메시지 출력
- [ ] `createExampleClient(config)` 호출 가능

### CLAUDE.md 경량화 (Phase 2 완료 후)

`packages/api-client/CLAUDE.md`에서 제거:

- `core.ts` 전체 코드 블록
- `types.ts` 전체 코드 블록
- `generate.ts` 전체 코드 블록
- `src/` 디렉토리 구조 ASCII tree (README로 이동)
- 장문의 "새 서비스 추가 절차" 단계별 설명

유지:

- 네이밍 규칙 (`*_SWAGGER_URL`, namespace 패턴)
- 미들웨어 순서 규칙
- "services/ 파일은 generated/ 타입에만 의존" 의존 방향
- `src/generated/`는 git ignore, 빌드 산출물 아님
- 체크리스트: 새 서비스 추가 시 2줄 요약 + README 링크

---

## Phase 3 — `@repo/ui` (Phase 2와 병렬)

**브랜치**: `feat/phase-3-ui`  
**에이전트**: `code-architect` (토큰/컴포넌트 구조 설계) → `tdd-guide` (RTL + jest-axe a11y 테스트) → `code-reviewer`  
**병렬 여부**: Phase 2와 동시 실행 (api-client 무의존)

### 산출물

- `packages/ui/package.json` (subpath exports, peer: react/react-dom 19)
- `src/tokens/tokens.css` + `theme.css` + `tokens.ts`
- `src/styles/reset.css` + `base.scss`
- `src/lib/cn.ts` (clsx wrapper)
- primitives 4개: `button/`, `input/`, `label/`, `card/`
  - 각각: `.tsx` + `.module.scss` + `.stories.tsx` + `.test.tsx`
- `.storybook/main.ts` + `preview.ts` (`@storybook/react-vite`)

### 성공 기준

- [ ] `pnpm --filter=@repo/ui test` 통과 (RTL + a11y)
- [ ] `pnpm --filter=@repo/ui build` 통과
- [ ] `pnpm --filter=@repo/ui storybook` 기동, 4개 primitive 스토리 노출
- [ ] `import { Button } from '@repo/ui/button'` 두 앱에서 동작 (Phase 4/5에서 검증)

### CLAUDE.md 경량화 (Phase 3 완료 후)

`packages/ui/CLAUDE.md`에서 제거:

- `tokens.css` 전체 코드 블록
- `button.tsx` 전체 코드 블록
- `button.module.scss` 전체 코드 블록
- 컴포넌트 추가 절차 장문 설명

유지:

- 디자인 토큰 네이밍 규칙 (`--color-*`, `--spacing-*`)
- 배럴 파일 사용하지 않는 이유 (subpath export 사용)
- `cn()` 사용 규칙
- a11y 테스트 필수 명시
- Storybook 스토리 작성 기준

---

## Phase 4 — `apps/nextjs` (Phase 5와 병렬)

**브랜치**: `feat/phase-4-nextjs`  
**에이전트**: `code-explorer` (Phase 1-3 산출물 확인) → `code-architect` (앱 골격) → `tdd-guide` (env/feature 테스트) → `code-reviewer`  
**병렬 여부**: Phase 5와 동시 실행 (두 앱 독립)  
**선행 조건**: Phase 1, 2, 3 완료 후 진입

### 산출물

- `apps/nextjs/package.json` (Next.js 16, React 19, react-query, zustand, react-hook-form, zod, @repo/\*)
- `next.config.js`
- `tsconfig.json` (extends `@repo/config/typescript/next`)
- `eslint.config.js` (`@repo/config/eslint/next` + import zone 규칙)
- `src/config/env.ts` (zod 검증된 환경변수 객체)
- `.env.example`
- `src/lib/api-client/server.ts` + `client.ts` (example service 인스턴스)
- `src/lib/logger.ts`
- `src/app/layout.tsx`, `providers.tsx`, `globals.scss`, `page.tsx`
- `src/stores/auth.ts` (zustand 베이스)
- `src/testing/` (MSW 셋업, Vitest 설정: `vitest.config.ts`, `vitest.setup.ts`)
- `src/features/health/` (데모 feature — ESLint zone 검증용)

### 성공 기준

- [ ] `pnpm dev --filter=nextjs` 기동
- [ ] `pnpm --filter=nextjs typecheck` 통과
- [ ] `pnpm --filter=nextjs test` 통과
- [ ] ESLint import zone이 의존 방향 위반 시 차단 확인
- [ ] `process.env` 직접 접근이 `env.ts` 외부에서 ESLint 에러 발생

### CLAUDE.md 경량화 (Phase 4 완료 후)

`apps/nextjs/CLAUDE.md`에서 제거:

- `env.ts` 전체 코드 블록
- `api-client/server.ts`, `api-client/client.ts` 전체 코드 블록
- feature 디렉토리 구조 ASCII tree
- MSW 셋업 코드 블록

유지:

- 의존 방향 규칙 + ESLint zone 설정 위치
- `env.ts`가 SSOT인 이유 (1줄)
- Server Component vs Client Component 경계 규칙
- API Route Handler 작성 기준
- "절대 하지 말 것" 목록 (process.env 직접 접근, console.log 등)
- 체크리스트: 새 feature 추가 시

---

## Phase 5 — `apps/react-vite` (Phase 4와 병렬)

**브랜치**: `feat/phase-5-react-vite`  
**에이전트**: `code-explorer` → `code-architect` → `tdd-guide` → `code-reviewer`  
**병렬 여부**: Phase 4와 동시 실행  
**선행 조건**: Phase 1, 2, 3 완료 후 진입

### 산출물

- `apps/react-vite/package.json` (Vite 5, React 19, react-router 7, react-query, zustand, react-hook-form, zod, @repo/\*)
- `vite.config.ts` (alias, chunk split, rollup-plugin-visualizer)
- `tsconfig.json` (extends `@repo/config/typescript/vite`)
- `eslint.config.js` (`@repo/config/eslint/vite-react` + import zone)
- `src/config/env.ts` (zod 검증)
- `.env.example`
- `src/lib/api-client.ts`, `src/lib/logger.ts`
- `src/app/router.tsx` (data router + lazy), `app.tsx`, `provider.tsx`, `main.tsx`
- `index.html`
- `src/app/styles/global.scss`
- `src/stores/auth.ts`
- `src/testing/` (MSW, Vitest 설정)
- `src/features/health/` (데모 feature)

### 성공 기준

- [ ] `pnpm dev --filter=react-vite` 기동
- [ ] `pnpm --filter=react-vite typecheck` 통과
- [ ] `pnpm --filter=react-vite test` 통과
- [ ] `pnpm --filter=react-vite analyze` — 번들 분석 리포트 생성

### CLAUDE.md 경량화 (Phase 5 완료 후)

`apps/react-vite/CLAUDE.md`에서 제거:

- `env.ts`, `router.tsx`, `api-client.ts` 코드 블록
- feature 구조 ASCII tree
- MSW 셋업 코드 블록

유지:

- React Router 7 data router 패턴 (왜 loader/action 분리인지)
- 코드 스플리팅 기준 (lazy 적용 시점)
- 의존 방향 + ESLint zone 위치
- "절대 하지 말 것" 목록
- 체크리스트: 새 페이지/feature 추가 시

---

## Phase 6 — 통합 검증 + 전체 문서 정리

**브랜치**: `feat/phase-6-integration`  
**에이전트**: `code-reviewer` (통합 검증) → `refactor-cleaner` (knip/depcheck/ts-prune + MD 정리)  
**병렬 여부**: 순차

### 작업 내용

1. 루트에서 전체 파이프라인 실행:
   - `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
2. Husky 훅 실 작동 재확인
3. `pnpm --filter=@repo/api-client generate` 친절한 에러 확인
4. Storybook 빌드 확인
5. `refactor-cleaner`로 미사용 export/dep 제거 (knip, depcheck)
6. 루트 `CLAUDE.md` 경량화 (아래 참고)
7. `packages/CLAUDE.md` 경량화
8. 모든 README Why→How→Result 구조 확인 및 보완

### 성공 기준 (전체)

- [ ] `pnpm install` (clean clone) 한 번에 성공
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` 전부 통과
- [ ] `pnpm dev --filter=nextjs` / `pnpm dev --filter=react-vite` 둘 다 기동
- [ ] `pnpm --filter=@repo/ui storybook` — 4개 primitive 스토리 노출
- [ ] `pnpm --filter=@repo/api-client generate` — 환경변수 없을 때 친절한 에러
- [ ] Husky pre-commit이 변경 파일에만 동작
- [ ] commitlint `feat(scope): ...` 강제
- [ ] ESLint import zone이 의존 방향 위반 차단
- [ ] 모든 CLAUDE.md — 코드 블록 최소화, 규칙/의도만 남음
- [ ] 모든 README — Why→How→Result 구조 완성
- [ ] 루트 CLAUDE.md의 패키지 의존 규칙 다이어그램이 실 구성과 일치

### 루트 CLAUDE.md 경량화 (Phase 6)

제거:

- "새 프로젝트 시작 절차" 장문 설명 (README로 이동)
- "공통 명령어" 코드 블록 (README로 이동)
- 각 패키지/앱 상세 설명 (각 하위 CLAUDE.md로 위임)

유지:

- 문서 맵 표 (어떤 CLAUDE.md를 읽어야 하는지)
- 패키지 의존 규칙 다이어그램
- 코딩 컨벤션 전역 규칙 (네이밍, import 순서, 커밋 컨벤션)
- "절대 하지 말 것" 목록
- "Claude Code 작업 우선순위" 6개 항목

---

## 병렬 실행 구성

```
Phase 0 ──→ Phase 1 ──┬──→ Phase 2 ─────┬──→ Phase 4 ─────┬──→ Phase 6
                      │                  │                  │
                      └──→ Phase 3 ─────┘  └──→ Phase 5 ───┘
```

- Phase 2와 3: 별도 브랜치, 별도 에이전트 동시 실행 (worktree 분리 권장)
- Phase 4와 5: 동일 방식 (Phase 2+3 PR 머지 후 진입)

---

## 리스크

| 리스크                                        | 완화                                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Swagger 스펙 없이 api-client 시작             | `src/services/example.ts` + `src/generated/` gitignore, 사용자 스펙 추가 시 절차 README에 명기 |
| React 19 + Next 16 peer dep 충돌              | 루트 `pnpm.overrides`로 react 19 강제                                                          |
| ESLint 9 flat config 미호환 플러그인          | Phase 1에서 버전 고정, 미호환 시 `FlatCompat` 우회                                             |
| Phase 2/3 병렬 중 `packages/*` 동시 수정 충돌 | Phase 1 완전 안정화 후 진입, 패키지 간 수정 금지                                               |
| CLAUDE.md 경량화 시 설계 의도 소실            | 제거 전 code-reviewer로 "코드만 봐도 자명한가" 검토                                            |
| MSW 셋업 Next/Vite 차이                       | 공통화하지 않음, 동일 패턴 양쪽 적용 후 각 앱 CLAUDE.md에 간단 명기                            |
