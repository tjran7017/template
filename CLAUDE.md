# fe-monorepo-template

Turborepo 기반 프론트엔드 모노레포 **스타터 템플릿**. 새 프로젝트를 시작할 때 이 레포를 clone(또는 GitHub Template으로 사용)하여 빠르게 셋업하고, `apps/`에 실제 애플리케이션을 추가하는 방식으로 사용.

## 템플릿 목적

다음을 사전에 셋업해두어, 모든 신규 프로젝트가 동일한 기반 위에서 시작되도록 함:

- 모노레포 구조 (Turborepo + pnpm workspaces)
- TypeScript strict / ESLint / Prettier 공통 설정
- 자주 쓰는 두 가지 앱 베이스: **Next.js** (SSR/BFF가 필요한 앱) + **React + Vite** (SPA)
- 공통 패키지 골격 (`@repo/ui`, `@repo/api-client`, `@repo/config`)
- 백엔드 MSA 환경 대응 — 서비스별 API 클라이언트 팩토리 (`@repo/api-client`)
- Husky + lint-staged + commitlint
- 테스트 도구 (Vitest + React Testing Library + MSW)
- API 타입 자동 생성 (openapi-typescript)

이 문서의 역할은, Claude Code가 새 프로젝트에서 이 레포 위에 작업할 때 **위 셋업을 훼손하지 않으면서** 프로젝트 고유 요구사항을 추가하도록 가이드하는 것.

## 모노레포 구조

```
fe-monorepo-template/
├── apps/
│   ├── nextjs/           Next.js 16 (App Router) — SSR/BFF가 필요한 앱 베이스
│   └── react-vite/       Vite + React — SPA 앱 베이스 (대시보드/관리자 등)
├── packages/
│   ├── api-client/       백엔드 서비스별 API 클라이언트 팩토리 (openapi-typescript 기반)
│   ├── ui/               공통 디자인 시스템 (Storybook 문서화)
│   └── config/           eslint, tsconfig, prettier 공통 설정
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

각 앱/패키지에는 자체 `CLAUDE.md`가 있을 수 있음. **하위 `CLAUDE.md`가 있으면 그것이 우선**, 없으면 이 문서를 따름.

## 작업 위치별 문서 맵

작업하려는 위치에 따라 어떤 `CLAUDE.md`를 읽어야 하는지 정리. **위에서 아래로** 누적해서 적용 (하위 문서가 우선).

```
fe-monorepo-template/
├── CLAUDE.md                       ← [전역] 모노레포 공통 규칙 (이 문서)
├── apps/
│   ├── nextjs/
│   │   └── CLAUDE.md               ← [앱] Next.js 16 (App Router) 특화 규칙
│   └── react-vite/
│       └── CLAUDE.md               ← [앱] Vite + React SPA 특화 규칙
└── packages/
    ├── CLAUDE.md                   ← [패키지 공통] 공개 API / 의존 / 버전 / 빌드 정책
    ├── api-client/
    │   └── CLAUDE.md               ← [패키지 개별] 서비스별 codegen / namespace / 미들웨어
    ├── ui/
    │   └── CLAUDE.md               ← [패키지 개별] (있을 경우) 디자인 토큰 / Storybook 등
    └── config/
        └── CLAUDE.md               ← [패키지 개별] (있을 경우) eslint / tsconfig 변경 영향
```

| 작업 위치 | 읽어야 할 문서 (순서대로) |
|---|---|
| 루트 설정 (`turbo.json`, `package.json` 등) | 루트 `CLAUDE.md` |
| `apps/nextjs/` 안 어디든 | 루트 → `apps/nextjs/CLAUDE.md` |
| `apps/react-vite/` 안 어디든 | 루트 → `apps/react-vite/CLAUDE.md` |
| `packages/` 안 모든 곳 | 루트 → `packages/CLAUDE.md` |
| `packages/<n>/` 개별 패키지 | 루트 → `packages/CLAUDE.md` → 해당 패키지 `CLAUDE.md` (있을 때) |
| 두 앱에 영향을 미치는 변경 | 루트 → 두 앱 `CLAUDE.md` 모두 |
| 패키지 + 앱에 모두 영향 | 루트 → `packages/CLAUDE.md` → 해당 앱 `CLAUDE.md` |

**규칙**

- 충돌 시 더 깊은(좁은 범위의) 문서가 우선
- 새 패키지/앱을 추가할 때 자체 `CLAUDE.md`가 필요하면 작성하고 이 표를 갱신. 동시에 사용자용 `README.md`도 함께 작성 (역할 분리는 "문서화 원칙" 참고)
- `CLAUDE.md` 자체를 수정한 경우, 같은 PR에 영향 받는 다른 `CLAUDE.md`도 함께 갱신 (예: 의존 그래프 변경 → 루트 + `packages/CLAUDE.md` 동시 수정)

## 새 프로젝트 시작 절차

이 템플릿으로 새 프로젝트를 시작할 때:

1. 이 레포를 새 이름으로 clone (또는 GitHub Template 기능으로 생성)
2. 루트 `package.json`의 `name`, `description`, `repository` 필드 업데이트
3. 사용하지 않을 앱은 삭제 (예: SSR이 불필요하면 `apps/nextjs` 제거)
4. 새 앱을 추가할 경우 `apps/<n>` 형태로, 이름은 **kebab-case**
5. 백엔드 OpenAPI 스펙을 `packages/api-client/openapi/`에 서비스별로 배치하고 codegen 실행
6. 프로젝트 고유 컨벤션/도메인 규칙은 해당 앱의 `CLAUDE.md`에 기록 (루트는 손대지 않음)
7. 프로젝트 고유 패키지가 필요하면 `packages/<n>`에 추가, 의존 방향 규칙(아래) 준수

## 패키지 매니저

- **pnpm 전용** (npm/yarn 사용 금지)
- 워크스페이스 의존성은 `workspace:*` 프로토콜 사용
- 새 의존성 추가는 항상 해당 워크스페이스 안에서 (`pnpm --filter=<n> add ...`)

## 공통 명령어

```bash
# 전체 의존성 설치
pnpm install

# 전체 앱 개발 모드
pnpm dev

# 특정 앱만
pnpm dev --filter=nextjs
pnpm dev --filter=react-vite

# 전체 빌드 / 린트 / 타입체크 / 테스트
pnpm build
pnpm lint
pnpm typecheck
pnpm test

# API 타입 재생성 (모든 서비스 OpenAPI 스펙으로부터 일괄 생성)
pnpm --filter=@repo/api-client generate
```

## 코딩 컨벤션 (전역)

### 언어 & 스타일

- TypeScript **strict 모드 필수**
- `any` 사용 금지. 불가피하면 `unknown` 우선, 주석으로 사유 명시
- ESM only (`"type": "module"`)
- import 순서: 외부 라이브러리 → 워크스페이스(`@repo/*`) → 절대경로(`@/`) → 상대경로
- 한 파일에서 default export와 named export를 섞지 않음 (named export 선호)

### 네이밍

- 파일/폴더: `kebab-case` (예: `user-profile.tsx`)
- React 컴포넌트: `PascalCase`
- 함수/변수: `camelCase`
- 상수: `SCREAMING_SNAKE_CASE`
- 타입/인터페이스: `PascalCase`, prefix `I` 사용 금지 (`User`, not `IUser`)

### 커밋 컨벤션 (Conventional Commits)

```
<type>(<scope>): <subject>
```

- type: `feat | fix | refactor | docs | test | chore | perf | style`
- scope: `nextjs | react-vite | ui | api-client | config | repo`
- 예시:
  - `feat(nextjs): 인증 미들웨어 추가`
  - `fix(react-vite): 대시보드 차트 렌더링 오류 수정`
  - `chore(repo): turbo.json 캐시 설정 정리`

### Git 브랜치 전략

- `main`: 항상 배포 가능 상태
- 작업 브랜치: `feat/*`, `fix/*`, `refactor/*`, `chore/*`
- PR 머지: **squash merge 기본**
- PR 제목: 커밋 컨벤션과 동일한 형식 사용 (`<type>(<scope>): <subject>`)
  - squash merge 시 PR 제목이 커밋 메시지가 되므로 일관성 유지

### Husky / lint-staged

- pre-commit: 변경 파일에 한해 lint + format + typecheck
- commit-msg: commitlint로 컨벤션 검증

## 패키지 의존 규칙 (요약)

```
apps/* ─→ packages/*       (앱은 패키지를 자유롭게 사용)
packages/ui ─→ packages/config
packages/api-client ─→ packages/config
packages/ui ✗ packages/api-client   (UI는 데이터 비종속)
```

- `packages/*` 끼리 **순환 의존 금지**
- `apps/*` 끼리 직접 import 금지 (공통화가 필요하면 `packages/`로 추출)

> 패키지 작성/유지보수 규약(공개 API, 빌드 산출물, peerDependencies 정책, 새 패키지 추가 절차 등)은 `packages/CLAUDE.md` 참고.

## 절대 하지 말 것

1. ❌ 공통 코드를 `apps/` 안에 두기 → 두 앱이 같은 패턴을 쓰면 즉시 `packages/`로 추출
2. ❌ 한 앱이 다른 앱을 import
3. ❌ `process.env` / `import.meta.env`를 컴포넌트에서 직접 접근 → 각 앱의 `lib/env.ts`(또는 `config/env.ts`)에서 zod로 검증된 객체로 노출
4. ❌ 시크릿/내부 API 키를 클라이언트 번들에 포함 → 반드시 서버 사이드에서만 사용
5. ❌ 프로덕션 코드에 `console.log` 잔류 → `logger` 모듈 사용 (없으면 만들기)
6. ❌ TypeScript 에러를 `@ts-ignore`로 막기 → `@ts-expect-error` + 사유 주석을 사용하거나, 근본 해결

## Claude Code 작업 우선순위

변경 사항을 제안하기 전에:

1. **기존 패턴 먼저 파악** — 이 문서 + 인접 파일/디렉토리의 컨벤션 확인
2. **공통 모듈 재사용 우선** — 새 유틸을 만들기 전 `packages/*`에 이미 있는지 확인
3. **새 의존성 추가는 보수적으로** — 기존 라이브러리로 해결 가능한지 먼저 검토. 추가 시 PR 본문에 사유 명시
4. **변경 영향 범위 확인** — `packages/ui` 또는 `packages/api-client` 수정 시 모든 앱이 빌드/타입체크 통과 확인
5. **테스트 동반** — 도메인 로직, 유틸, 자동화 스크립트 변경에는 테스트 추가/수정
6. **템플릿 vs 프로젝트 구분** — 이 레포의 변경이 *템플릿 자체의 개선*인지 *특정 프로젝트의 요구사항*인지 구분.  
   후자라면 루트 컨벤션이 아니라 해당 앱의 `CLAUDE.md`에 기록.

## 문서화 원칙

### `CLAUDE.md` vs `README.md` 역할 분리

각 앱/패키지는 두 종류의 문서를 갖는다:

| 문서 | 독자 | 다루는 내용 |
|---|---|---|
| **`CLAUDE.md`** | Claude Code, 코드 작성/수정자 | **"이걸 어떻게 작성/수정하나?"** — 디렉토리 구조, 컨벤션, 의존 규칙, 변경 시 체크리스트 |
| **`README.md`** | 사용자, 면접관, 신규 합류자 | **"이게 뭐고 왜 이렇게 만들었나?"** — 소개, 사용법, 설계 의도, FAQ |

원칙:

- 같은 내용을 두 문서에 중복하지 않는다. 자연스럽게 다른 문서를 가리키는 링크로 연결
- *"왜 ~하나?"* 설명은 README로 (사용자 관심사)
- *"~하지 마라 / ~할 때 주의"* 규칙은 CLAUDE.md로 (작성자 관심사)
- 새 패키지/앱 추가 시 두 문서를 **함께** 작성. 한 쪽만 만들지 않음

### `README.md` 작성 규칙

- 각 패키지/앱의 `README.md`는 **Why → How → Result** 구조 유지
- 첫 단락은 한 줄 요약 + 문제 도메인 (면접관이 30초 안에 핵심 파악)

### 기술 결정 기록

- 트레이드오프 있는 기술 결정은 ADR(Architecture Decision Record) 형식으로 `docs/adr/`에 기록 (필요 시)

### 문서 동기화

- 템플릿 자체에 변경이 생기면 루트 `README.md`와 루트 `CLAUDE.md`를 함께 업데이트
- 패키지/앱 변경 시 해당 위치의 `CLAUDE.md`와 `README.md`를 함께 검토 (한 쪽만 수정해 정보가 어긋나지 않도록)
