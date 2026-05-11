# fe-monorepo-template

Turborepo 기반 프론트엔드 모노레포 템플릿. 각 앱/패키지에는 자체 `CLAUDE.md`가 있을 수 있음. **하위 `CLAUDE.md`가 있으면 그것이 우선**, 없으면 이 문서를 따름.

## 작업 위치별 문서 맵

작업하려는 위치에 따라 어떤 `CLAUDE.md`를 읽어야 하는지 정리. **위에서 아래로** 누적해서 적용 (하위 문서가 우선).

| 작업 위치                                   | 읽어야 할 문서 (순서대로)                                       |
| ------------------------------------------- | --------------------------------------------------------------- |
| 루트 설정 (`turbo.json`, `package.json` 등) | 루트 `CLAUDE.md`                                                |
| `apps/nextjs/` 안 어디든                    | 루트 → `apps/nextjs/CLAUDE.md`                                  |
| `apps/react-vite/` 안 어디든                | 루트 → `apps/react-vite/CLAUDE.md`                              |
| `packages/` 안 모든 곳                      | 루트 → `packages/CLAUDE.md`                                     |
| `packages/<n>/` 개별 패키지                 | 루트 → `packages/CLAUDE.md` → 해당 패키지 `CLAUDE.md` (있을 때) |
| 두 앱에 영향을 미치는 변경                  | 루트 → 두 앱 `CLAUDE.md` 모두                                   |
| 패키지 + 앱에 모두 영향                     | 루트 → `packages/CLAUDE.md` → 해당 앱 `CLAUDE.md`               |

**규칙**

- 충돌 시 더 깊은(좁은 범위의) 문서가 우선
- 새 패키지/앱을 추가할 때 자체 `CLAUDE.md`가 필요하면 작성하고 이 표를 갱신. 동시에 사용자용 `README.md`도 함께 작성 (역할 분리는 "문서화 원칙" 참고)
- `CLAUDE.md` 자체를 수정한 경우, 같은 PR에 영향 받는 다른 `CLAUDE.md`도 함께 갱신 (예: 의존 그래프 변경 → 루트 + `packages/CLAUDE.md` 동시 수정)

## 패키지 매니저

- **pnpm 전용** (npm/yarn 사용 금지)
- 워크스페이스 의존성은 `workspace:*` 프로토콜 사용
- 새 의존성 추가는 항상 해당 워크스페이스 안에서 (`pnpm --filter=<n> add ...`)

## 코딩 컨벤션 (전역)

### 언어 & 스타일

- TypeScript **strict 모드 필수**
- `any` 사용 금지. 불가피하면 `unknown` 우선, 주석으로 사유 명시
- ESM only (`"type": "module"`)
- import 순서: 외부 라이브러리 → 워크스페이스(`@repo/*`) → 절대경로(`@/`) → 상대경로
- 한 파일에서 default export와 named export를 섞지 않음 (named export 선호)

### 타입 정의 (interface vs type)

객체 형태의 타입은 `interface`를 기본으로 사용한다. `type`은 interface로 표현 불가능하거나 부적합한 경우에만 사용한다.

**interface (기본값)**

- 객체 형태의 모든 타입 정의
- 컴포넌트 props 정의
- 라이브러리/모듈의 public API
- 도메인 모델, 엔티티 타입
- API 요청/응답 객체 타입
- 유틸리티 타입을 통한 객체 파생 (`extends Pick<T, K>`, `extends Omit<T, K>`, `extends Partial<T>` 등)
- HTML 속성 확장 (`extends React.InputHTMLAttributes<...>` 등)

**type (예외 — 다음 경우에만)**

- 유니온 타입 (`type Status = 'idle' | 'loading' | 'success'`)
- 튜플 타입 (`type Coord = [number, number]`)
- 매핑된 타입 (`type Nullable<T> = T | null`)
- 조건부 타입, `keyof`, `typeof` 등을 활용한 타입 변환
- 원시 타입 별칭
- interface로 extends 시 "statically known members" 에러가 발생하는 제네릭 조합

**이유**

- **선언 병합**: interface는 외부에서 확장 가능 (라이브러리 타입 augmentation 등)
- **명확한 확장**: `extends` 시 충돌이 즉시 에러로 잡힘 (intersection은 `never`로 조용히 통과)
- **에러 메시지**: interface 이름이 유지되어 IDE/에러 메시지가 깔끔함

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

## 패키지 의존 규칙

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

| 문서            | 독자                          | 다루는 내용                                                              |
| --------------- | ----------------------------- | ------------------------------------------------------------------------ |
| **`CLAUDE.md`** | Claude Code, 코드 작성/수정자 | **"이걸 어떻게 작성/수정하나?"** — 컨벤션, 의존 규칙, 변경 시 체크리스트 |
| **`README.md`** | 사용자, 면접관, 신규 합류자   | **"이게 뭐고 왜 이렇게 만들었나?"** — 소개, 사용법, 설계 의도            |

- 같은 내용을 두 문서에 중복하지 않는다
- 새 패키지/앱 추가 시 두 문서를 **함께** 작성
- 트레이드오프 있는 기술 결정은 ADR 형식으로 `docs/adr/`에 기록 (필요 시)
