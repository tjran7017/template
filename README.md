# fe-monorepo-template

Turborepo + pnpm workspaces 기반 프론트엔드 모노레포 템플릿. 새 프로젝트를 시작할 때 이 레포를 clone하여 바로 개발에 집중할 수 있도록 공통 설정을 사전에 셋업해둔다.

## 구조

```
fe-monorepo-template/
├── apps/
│   ├── nextjs/           Next.js (App Router) — SSR/BFF가 필요한 앱
│   └── react-vite/       Vite + React — SPA (대시보드/관리자 등)
├── packages/
│   ├── api-client/       서비스별 API 클라이언트 팩토리 (openapi-typescript 기반)
│   ├── ui/               공통 디자인 시스템 (Storybook)
│   └── config/           eslint, tsconfig, prettier 공통 설정
├── turbo.json
└── pnpm-workspace.yaml
```

## 포함된 것

- Turborepo 파이프라인 (`build`, `dev`, `lint`, `typecheck`, `test`, `generate`)
- TypeScript strict / ESLint / Prettier 공통 설정 (`@repo/config`)
- 서비스별 API 클라이언트 팩토리 + OpenAPI codegen (`@repo/api-client`)
- 공통 UI 컴포넌트 + 디자인 토큰 (`@repo/ui`)
- Husky + lint-staged + commitlint (Conventional Commits)
- Vitest + React Testing Library + MSW

## 시작하기

### 1. 레포 생성

```bash
# GitHub Template으로 생성하거나
gh repo create my-project --template <this-repo>

# 또는 clone
git clone <this-repo> my-project && cd my-project
```

### 2. 프로젝트 정보 업데이트

루트 `package.json`의 `name`, `description` 필드를 프로젝트에 맞게 수정한다.

### 3. 불필요한 앱 제거

SSR이 필요 없으면 `apps/nextjs`를, SPA가 필요 없으면 `apps/react-vite`를 삭제한다.

### 4. 의존성 설치

```bash
pnpm install
```

### 5. API 타입 생성 (선택)

백엔드 OpenAPI 스펙을 `packages/api-client/openapi/`에 서비스별로 배치한 뒤:

```bash
pnpm --filter=@repo/api-client generate
```

## 명령어

```bash
pnpm dev                              # 전체 앱 개발 모드
pnpm dev --filter=nextjs              # 특정 앱만
pnpm build                            # 전체 빌드
pnpm lint                             # 전체 린트
pnpm typecheck                        # 전체 타입체크
pnpm test                             # 전체 테스트
pnpm --filter=@repo/api-client generate  # API 타입 재생성
```

## 새 앱/패키지 추가

- 앱: `apps/<kebab-case-name>/` 형태로 추가
- 패키지: `packages/<kebab-case-name>/` 형태로 추가, [의존 방향 규칙](CLAUDE.md#패키지-의존-규칙)을 준수
- 프로젝트 고유 컨벤션은 해당 앱의 `CLAUDE.md`에 기록 (루트는 손대지 않음)
