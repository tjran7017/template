# LLM Harness Engineering 적용 계획

작성일: 2026-06-12

## 목적

이 문서는 React + TypeScript 기반 프론트엔드 모노레포에 LLM 하네스 엔지니어링을 적용하기 위한 실행 계획이다. 다른 컨텍스트에서 이어서 작업해도 목표, 대상 파일, 단계, 리스크, 완료 기준을 놓치지 않도록 인수인계 가능한 수준으로 정리한다.

## 현재 프로젝트 맥락

- 모노레포: Turborepo + pnpm workspace
- 앱:
  - `apps/nextjs`: React + Next.js App Router
  - `apps/react-vite`: React + Vite SPA
- 패키지:
  - `packages/ui`: 공통 UI 패키지
  - `packages/api-client`: API client 패키지
  - `packages/config`: ESLint, TypeScript, Prettier 등 공통 설정 패키지
- 현재 각 주요 루트에 `CLAUDE.md`가 존재한다.
- Codex용 `AGENTS.md`는 아직 생성되어 있지 않다.
- 일부 설정 파일과 주석은 터미널 출력에서 한글이 깨져 보일 수 있으므로, 편집 전 UTF-8 기준으로 실제 파일 내용을 확인한다.
- 루트 `eslint.config.js`에는 env 직접 접근 제한, feature 간 import 제한, `console.log` 제한 등 하네스 성격의 규칙이 이미 일부 존재한다.
- `packages/config`는 현재 `.js`/`.json` preset 중심 패키지라 `typecheck` 스크립트가 없다. TypeScript 컨벤션 파일을 추가할 경우 검증 방식도 함께 정해야 한다.

## 최종 목표

1. 각 루트별 `CLAUDE.md`를 LLM 하네스 엔지니어링 기준으로 개정한다.
2. 각 `CLAUDE.md`와 같은 위치에 Codex용 `AGENTS.md`를 생성한다.
3. 하네스 엔지니어링에 필요한 컨벤션 코드 파일을 추가한다.
4. 문서와 코드 컨벤션이 실제 작업 흐름에서 drift 없이 유지되도록 검증 기준을 둔다.

## 하네스 엔지니어링 정의

이 프로젝트에서 하네스 엔지니어링은 LLM 에이전트가 매번 같은 방식으로 코드를 읽고, 판단하고, 수정하고, 검증하도록 만드는 작업 규약과 보조 코드의 묶음이다.

핵심 원칙:

- 작업 위치별로 반드시 읽어야 하는 문서를 명확히 한다.
- 앱과 패키지의 책임 경계를 문서와 코드 양쪽에서 표현한다.
- 금지 패턴과 권장 패턴을 체크리스트로 만든다.
- 새 기능을 추가할 때 필요한 파일 구조, 테스트, 검증 명령을 예측 가능하게 한다.
- 강제 규칙은 기존 코드 손상을 피하면서 단계적으로 도입한다.

## 대상 문서

다음 `CLAUDE.md`를 개정하고, 같은 위치에 `AGENTS.md`를 생성한다.

```text
CLAUDE.md
apps/nextjs/CLAUDE.md
apps/react-vite/CLAUDE.md
packages/CLAUDE.md
packages/ui/CLAUDE.md
packages/api-client/CLAUDE.md
packages/config/CLAUDE.md
```

생성 대상:

```text
AGENTS.md
apps/nextjs/AGENTS.md
apps/react-vite/AGENTS.md
packages/AGENTS.md
packages/ui/AGENTS.md
packages/api-client/AGENTS.md
packages/config/AGENTS.md
```

## 대상 코드 파일 후보

1차 후보:

```text
packages/config/conventions/index.ts
packages/config/conventions/react.ts
packages/config/conventions/query.ts
packages/config/testing/create-test-query-client.ts
packages/config/testing/render-contracts.ts
```

2차 후보:

```text
packages/config/eslint/harness.js
```

2차 후보는 기존 코드에 미치는 영향이 크므로 처음부터 `error` 강제 규칙으로 연결하지 않는다. 문서화, opt-in, `warn` 단계 도입을 우선한다.

## Phase 0 - 사전 점검

목적: 기존 구조와 변경 범위를 확정한다.

작업:

- `CLAUDE.md`, `AGENTS.md`, `package.json`, `eslint.config.js`, `packages/config/*` 파일 목록을 확인한다.
- 기존 `CLAUDE.md`가 인코딩 문제 없이 편집 가능한지 확인한다.
- 현재 git 상태를 확인하고, 기존 사용자 변경을 되돌리지 않는다.
- `packages/config/package.json`의 export 구조를 확인해서 새 컨벤션 파일의 export 가능 여부를 판단한다.
- 루트 `package.json`과 `eslint.config.js`가 파싱 가능한지 확인하고, 깨져 보이는 한글 설명/주석이 실제 파일 손상인지 터미널 출력 문제인지 구분한다.
- 실제 환경변수 접근 경로를 확인해 문서 표현을 `src/config/env.ts`로 통일한다. 기존 문서에 `lib/env.ts` 표현이 남아 있으면 정리한다.
- 기존 루트 ESLint 규칙이 이미 강제하는 항목과 새로 도입할 항목을 분리한다.

완료 기준:

- 수정 대상 문서와 코드 파일 목록이 확정된다.
- 기존 변경사항과 이번 작업 변경사항을 구분할 수 있다.
- 하네스 컨벤션 코드를 `packages/config`에 넣는 것이 적절한지 확인된다.
- `packages/config`에 TypeScript 파일을 둘 경우 `tsconfig.json`, `typecheck` 스크립트, export 경로를 추가할지 결정되어 있다.

## Phase 1 - 루트 하네스 문서 개정

목적: 전체 모노레포에서 LLM 에이전트가 따라야 할 최상위 규약을 정의한다.

대상:

```text
CLAUDE.md
AGENTS.md
```

작업:

- 루트 `CLAUDE.md`를 agent-neutral 규칙 중심으로 정리한다.
- Claude/Codex 같은 특정 에이전트명은 문서 목적을 설명할 때만 사용하고, 실제 규칙은 "LLM 에이전트" 또는 "작업자" 기준으로 쓴다.
- 작업 위치별 문서 읽기 순서를 명확히 한다.
- 공통 개발 원칙을 정리한다.
  - pnpm 사용
  - TypeScript strict
  - app 간 직접 import 금지
  - shared package 추출 기준
  - 환경 변수 접근 기준
  - 테스트 동반 기준
- 하네스 작업 루프를 추가한다.
  - 읽기
  - 영향 범위 판단
  - 작은 변경
  - 검증
  - 문서 갱신
- 루트 `CLAUDE.md`를 복사해 루트 `AGENTS.md`를 생성한다.

완료 기준:

- 루트 문서만 읽어도 전체 작업 우선순위와 금지 패턴을 알 수 있다.
- `CLAUDE.md`와 `AGENTS.md`의 내용이 일치한다.
- 문서가 너무 길어지지 않도록 읽기 순서, 금지 패턴, 변경 체크리스트, 검증 명령을 중심으로 유지한다.

## Phase 2 - 앱별 하네스 문서 개정

목적: Next.js 앱과 Vite 앱의 서로 다른 실행 모델을 LLM이 혼동하지 않도록 분리한다.

대상:

```text
apps/nextjs/CLAUDE.md
apps/nextjs/AGENTS.md
apps/react-vite/CLAUDE.md
apps/react-vite/AGENTS.md
```

Next.js 문서 작업:

- App Router 기준을 명확히 한다.
- Server Component 기본, Client Component는 interaction leaf에만 둔다.
- `process.env` 직접 접근은 `src/config/env.ts` 내부로 제한한다.
- BFF Route Handler 작성 기준을 정리한다.
- React Query는 client-side server state에만 사용한다.
- `page.tsx`는 얇은 조립 계층으로 둔다.
- route마다 `loading.tsx`, `error.tsx` 필요 여부를 점검하게 한다.

React Vite 문서 작업:

- React Router 7 data router 기준을 명확히 한다.
- route-level lazy와 `Component` alias export 패턴을 고정한다.
- `import.meta.env` 직접 접근은 `src/config/env.ts` 내부로 제한한다.
- `useSuspenseQuery`와 route-level Suspense/ErrorBoundary 사용 기준을 정리한다.
- MSW browser worker는 `VITE_USE_MOCK=1`일 때만 켠다.

완료 기준:

- 각 앱 문서가 서로 다른 runtime 규칙을 명확히 구분한다.
- 앱별 `CLAUDE.md`와 `AGENTS.md`가 일치한다.

## Phase 3 - 패키지별 하네스 문서 개정

목적: 공통 패키지의 공개 API와 유지보수 규칙을 LLM이 안정적으로 따르게 한다.

대상:

```text
packages/CLAUDE.md
packages/AGENTS.md
packages/ui/CLAUDE.md
packages/ui/AGENTS.md
packages/api-client/CLAUDE.md
packages/api-client/AGENTS.md
packages/config/CLAUDE.md
packages/config/AGENTS.md
```

공통 패키지 문서 작업:

- `apps/*`는 `packages/*`를 자유롭게 사용할 수 있으나, `packages/*`끼리 순환 의존을 만들지 않는다.
- 새 공통 로직은 앱 내부 중복이 확인될 때 패키지로 추출한다.
- package export, peer dependency, build output 기준을 정리한다.

`packages/ui` 작업:

- primitive/component 폴더 구조를 명확히 한다.
- SCSS Module과 `.module.scss.d.ts` 작성 기준을 정리한다.
- a11y 테스트와 Storybook 작성 기준을 명시한다.
- domain-specific UI는 앱에 두고, domain-neutral UI만 `@repo/ui`에 둔다.

`packages/api-client` 작업:

- OpenAPI/generated 코드와 수동 service wrapper 경계를 분리한다.
- error model, middleware, typed request 패턴을 정리한다.
- 앱은 직접 `fetch`보다 api-client instance를 우선 사용하도록 적는다.

`packages/config` 작업:

- ESLint, TypeScript, Prettier preset 변경 절차를 정리한다.
- 변경 시 전체 앱과 패키지 검증이 필요함을 명시한다.
- 하네스 컨벤션 파일의 역할과 export 기준을 추가한다.

완료 기준:

- 패키지별 문서만 읽어도 해당 패키지 변경 시 필요한 테스트와 금지 패턴을 알 수 있다.
- 모든 패키지 문서의 `CLAUDE.md`와 `AGENTS.md`가 일치한다.

## Phase 4 - 하네스 컨벤션 코드 추가

목적: 문서 규칙을 코드에서 재사용 가능한 convention helper로 제공한다.

대상 후보:

```text
packages/config/conventions/index.ts
packages/config/conventions/react.ts
packages/config/conventions/query.ts
packages/config/testing/create-test-query-client.ts
packages/config/testing/render-contracts.ts
```

작업:

- `conventions/index.ts`
  - 앱/패키지 공통 규칙 이름과 설명을 export한다.
  - 문서와 테스트에서 참조할 수 있는 안정적인 convention id를 둔다.
- `conventions/react.ts`
  - component folder, barrel, props interface, SCSS module convention을 타입/상수로 표현한다.
- `conventions/query.ts`
  - React Query key factory 패턴을 타입으로 지원한다.
  - query key가 magic string으로 흩어지지 않도록 예시 타입을 제공한다.
- `testing/create-test-query-client.ts`
  - 앱 테스트에서 중복되는 QueryClient 생성 설정을 공통화한다.
  - retry off, predictable cache, test isolation 기준을 둔다.
- `testing/create-test-query-client.ts`는 현재 `apps/nextjs/src/testing/test-utils.tsx`와 `apps/react-vite/src/testing/test-utils.tsx`의 중복 설정을 먼저 줄이는 방향으로 설계한다.
- `testing/render-contracts.ts`
  - 앱별 render helper가 지켜야 할 wrapper contract 타입을 둔다.
- `packages/config`가 TypeScript 소스를 export하게 되면 다음 중 하나를 선택한다.
  - 단순 source export: `package.json` exports에 `.ts` subpath를 추가하고, 앱/패키지 typecheck에서 함께 검증한다.
  - 자체 검증 추가: `packages/config/tsconfig.json`과 `typecheck` 스크립트를 추가해 `pnpm --filter=@repo/config typecheck`를 유효한 명령으로 만든다.

완료 기준:

- 선택한 검증 방식에 따라 새 파일들이 타입 체크를 통과한다.
- 필요하면 `packages/config/package.json` exports가 추가된다.
- 앱 테스트 유틸에서 재사용 가능한 형태다.
- 새 컨벤션 코드가 문서 장식에 그치지 않고, 테스트 유틸 또는 query key helper처럼 실제 반복을 줄이는 지점과 연결되어 있다.

## Phase 5 - ESLint 하네스 규칙 도입 검토

목적: 문서 규칙 중 자동 검증 가능한 항목을 lint로 옮긴다.

대상 후보:

```text
packages/config/eslint/harness.js
eslint.config.js
```

작업:

- env 직접 접근 제한 규칙을 검토한다. 기존 루트 ESLint에 이미 있는 규칙은 유지/정리하고, 새 preset으로 옮길지는 별도로 판단한다.
  - Next.js: `process.env`는 `src/config/env.ts` 또는 logger 예외만 허용
  - Vite: `import.meta.env`는 `src/config/env.ts` 또는 logger 예외만 허용
- `console.log` 제한을 검토한다.
- feature 간 import 제한 규칙을 검토한다.
- app 간 import 금지 규칙을 검토한다.

권장 도입 방식:

- 1차: 문서화와 opt-in config
- 2차: `warn`
- 3차: 기존 코드 정리 후 `error`

완료 기준:

- lint 규칙 추가로 기존 코드가 대량으로 깨지지 않는다.
- 강제 규칙으로 바꾸기 전에 필요한 이주 작업이 별도 TODO로 분리된다.
- 이미 강제 중인 루트 규칙과 신규 opt-in 규칙의 책임 경계가 문서화되어 있다.

## Phase 6 - 문서 동기화 검증

목적: `CLAUDE.md`와 `AGENTS.md`가 drift 없이 유지되도록 한다.

작업:

- 모든 `CLAUDE.md`에 대응하는 `AGENTS.md`가 있는지 확인한다.
- 각 쌍의 내용이 동일하거나, Codex/Claude 이름 차이를 제외하고 동등한지 확인한다.
- 필요하면 문서 복사 검증 스크립트를 추가한다.
- 모든 `README.md`의 문서 맵과 사용 안내가 새 하네스 문서 구조와 충돌하지 않는지 확인한다.
  - 루트, 앱, 패키지 README를 모두 확인한다.
  - `AGENTS.md`가 생성되면 관련 README 문서 표나 개발자 안내에 Codex/LLM 작업자용 문서로 추가할지 판단한다.
  - `docs/2.harness/plan.md`가 실제 인수인계 문서라면 루트 README의 docs 목록에 추가할지 판단한다.
  - README에는 상세 규칙을 중복하지 않고, 문서 위치와 독자만 짧게 안내한다.

검증 후보:

```text
scripts/sync-agent-docs.ts
scripts/check-agent-docs.ts
```

주의:

- 스크립트 추가는 필수는 아니다.
- 단순 복사만으로 충분하면 이번 작업에서는 문서와 수동 체크리스트로 끝낸다.

완료 기준:

- 모든 하네스 문서 쌍이 존재한다.
- 다음 작업자가 어떤 문서를 먼저 읽어야 하는지 명확하다.
- README를 수정하지 않기로 했다면, 사용자-facing 변경이 아니거나 각 README 내용과 충돌하지 않아서 생략했다는 판단 근거가 기록되어 있다.

## Phase 7 - 전체 검증

목적: 문서와 컨벤션 코드 추가가 기존 프로젝트를 깨지 않았는지 확인한다.

권장 명령:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

상황별 명령:

```bash
pnpm --filter=nextjs lint
pnpm --filter=nextjs typecheck
pnpm --filter=nextjs test

pnpm --filter=react-vite lint
pnpm --filter=react-vite typecheck
pnpm --filter=react-vite test

# @repo/config에 typecheck 스크립트를 추가한 경우에만 실행
pnpm --filter=@repo/config typecheck

pnpm --filter=@repo/ui test
pnpm --filter=@repo/api-client test
```

완료 기준:

- TypeScript 컨벤션 파일을 추가했다면, 선택한 검증 방식이 통과한다. `packages/config`에 `typecheck` 스크립트를 추가하지 않았다면 `pnpm --filter=@repo/config typecheck`를 완료 기준으로 삼지 않는다.
- 가능하면 전체 `pnpm lint`, `pnpm typecheck`, `pnpm test`가 통과한다.
- 실패가 있다면 이번 작업으로 생긴 실패인지 기존 실패인지 구분해 기록한다.

## 주요 리스크와 완화책

| 리스크                                     | 설명                                                                                                               | 완화책                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 문서 인코딩 손상                           | 기존 `CLAUDE.md`가 터미널에서 깨져 보일 수 있다. 무리하게 전체 재작성하면 원문 의미가 손상될 수 있다.              | 편집 전 파일 인코딩을 확인하고, 가능하면 새 UTF-8 문서로 정리한다. 기존 문서를 대체할 때는 핵심 규칙을 보존한다.                 |
| `CLAUDE.md`와 `AGENTS.md` drift            | 두 문서를 수동으로 관리하면 시간이 지나며 내용이 달라질 수 있다.                                                   | 최초 생성 시 동일 내용으로 복사한다. 필요하면 `check-agent-docs` 스크립트로 동기화 여부를 확인한다.                              |
| ESLint 규칙 과도한 강제                    | env 직접 접근, console, feature import 제한을 바로 `error`로 켜면 기존 코드가 대량으로 깨질 수 있다.               | 처음에는 문서화 또는 opt-in으로 시작한다. 이후 `warn`, 마지막에 `error`로 승격한다.                                              |
| 기존 ESLint 규칙과 신규 하네스 preset 중복 | 루트 `eslint.config.js`에 이미 env, feature import, console 규칙이 있으므로 새 `harness.js`와 책임이 겹칠 수 있다. | 기존 강제 규칙은 그대로 파악하고, `harness.js`는 opt-in/warn 후보나 공통화 가치가 있는 항목만 담는다.                            |
| 컨벤션 코드가 실제 사용되지 않음           | `packages/config/conventions`가 문서상으로만 존재하고 앱에서 쓰이지 않으면 관리 비용만 늘어난다.                   | 테스트 유틸 또는 query key helper처럼 실제 반복을 줄이는 코드부터 추가한다.                                                      |
| 공통화 과잉                                | 앱별 runtime 차이가 큰데 config에 과하게 추상화하면 Next/Vite 규칙이 흐려진다.                                     | Next/Vite 특화 규칙은 각 앱 문서에 둔다. `packages/config`에는 공통 타입과 테스트 유틸만 둔다.                                   |
| package export 누락                        | 새 파일을 추가했지만 `packages/config/package.json` exports에 빠지면 앱에서 import할 수 없다.                      | 코드 추가 후 export 경로와 TypeScript resolution을 확인한다.                                                                     |
| `@repo/config` 검증 명령 불일치            | 현재 `packages/config`에는 `typecheck` 스크립트가 없으므로 계획의 검증 명령이 그대로는 실패한다.                   | TypeScript 파일 추가 시 `tsconfig.json`/`typecheck` 스크립트를 함께 추가하거나, 앱/패키지 사용처 typecheck로 검증 기준을 바꾼다. |
| 하네스 문서가 너무 장황해짐                | LLM이 읽어야 할 문서가 지나치게 길면 실제 작업에서 핵심 규칙을 놓칠 수 있다.                                       | 각 문서는 체크리스트와 금지 패턴 중심으로 유지한다. 긴 예제는 README나 별도 docs로 분리한다.                                     |
| 환경변수 경로 표현 혼재                    | 문서에 `lib/env.ts`와 `config/env.ts` 표현이 섞이면 에이전트가 잘못된 파일을 만들 수 있다.                         | 실제 앱 구조에 맞춰 `src/config/env.ts`로 통일한다.                                                                              |
| 기존 사용자 변경 충돌                      | 현재 작업 중인 변경사항이 있을 수 있고, 관련 없는 변경을 되돌리면 안 된다.                                         | `git status --short`를 먼저 확인하고, 이번 작업 파일만 수정한다.                                                                 |

## 권장 작업 순서 요약

```text
Phase 0: 사전 점검
Phase 1: 루트 CLAUDE.md 개정 + AGENTS.md 생성
Phase 2: 앱별 CLAUDE.md 개정 + AGENTS.md 생성
Phase 3: 패키지별 CLAUDE.md 개정 + AGENTS.md 생성
Phase 4: packages/config 하네스 컨벤션 코드 추가
Phase 5: ESLint 하네스 규칙 opt-in 검토
Phase 6: 문서 동기화 검증
Phase 7: lint/typecheck/test/build 검증
```

## 다음 컨텍스트 시작 지침

다음 작업자는 먼저 이 파일을 읽은 뒤 아래 순서로 진행한다.

1. `git status --short`로 현재 변경사항을 확인한다.
2. 루트 `CLAUDE.md`와 각 작업 위치의 `CLAUDE.md`를 읽는다.
3. `AGENTS.md`가 이미 생성된 위치가 있으면 대응하는 `CLAUDE.md`와 내용이 같은지 먼저 확인한다.
4. Phase 0부터 진행하되, 이미 완료된 Phase가 있으면 완료 기준을 다시 확인하고 다음 Phase로 넘어간다.
5. 파일 수정 전 변경 범위를 짧게 기록한다.
6. 문서와 코드 컨벤션을 함께 바꾸는 경우, 문서가 실제 코드 상태와 맞는지 마지막에 확인한다.
7. 마지막에 모든 `README.md`를 확인해 문서 맵, 시작하기, 새 앱/패키지 추가 절차, 패키지 사용 안내가 하네스 변경과 맞는지 검토한다.

## 완료 정의

이 작업은 아래 조건을 만족하면 완료다.

- 모든 대상 `CLAUDE.md`가 하네스 엔지니어링 기준으로 정리되어 있다.
- 모든 대상 위치에 대응하는 `AGENTS.md`가 존재한다.
- `packages/config`에 하네스 컨벤션 코드가 추가되어 있다.
- 새 컨벤션 파일이 package export 또는 내부 사용 방식과 모순되지 않는다.
- `packages/config`에 TypeScript 컨벤션 파일을 추가했다면 검증 방식이 명확하고 실제로 통과한다.
- 모든 `README.md`를 검토했고, 필요한 문서 맵/사용자 안내 변경을 반영했거나 생략 사유를 기록했다.
- 검증 명령 결과가 기록되어 있다.
- ESLint 강제 규칙을 추가했다면 기존 코드 영향 범위와 이주 계획이 분리되어 있다.
