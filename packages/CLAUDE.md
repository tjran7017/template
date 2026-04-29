# packages

`@repo/*` 공통 패키지의 작성/유지보수 규약. 이 문서는 `packages/` 디렉토리 아래 모든 패키지에 공통으로 적용되며, 각 패키지(`api-client`, `ui`, `config` 등)가 자체 `CLAUDE.md`를 가지면 그쪽이 우선.

> **상위 문서:** 루트 `CLAUDE.md` (모노레포 공통 규칙)
> **이 문서가 우선:** packages 전용 규약 — 공개 API, 의존, 빌드, 버전, 새 패키지 추가 절차

## 패키지의 역할

- 두 개 이상의 앱이 공유하는 코드를 모음 (한 앱 전용 코드는 `apps/<n>/`에 둠)
- 도메인/비즈니스 로직 비종속 — 앱이 어떤 도메인이든 가져다 쓸 수 있어야 함
- **앱처럼 실행되지 않음** — 빌드 산출물 또는 소스를 `exports`로 노출하기만 함

## 패키지 명명 / 버전

- npm 이름은 **`@repo/<n>`** (예: `@repo/api-client`, `@repo/ui`, `@repo/config`)
- 폴더 이름은 npm 이름의 마지막 segment와 동일 (`packages/api-client/`)
- 폴더/패키지 이름은 **kebab-case**
- `package.json`의 `version`은 **`0.0.0`으로 고정** — 사내 모노레포라 publish하지 않음. `workspace:*`로 참조하므로 버전 의미 없음
- `private: true` 설정 (실수 publish 방지)
- 외부 publish가 필요한 경우는 ADR로 결정 후 별도 정책 수립

## 의존 방향 (전역 규칙)

```
apps/* ─→ packages/*       (앱은 패키지를 자유롭게 사용)
packages/ui ─→ packages/config
packages/api-client ─→ packages/config
packages/ui ✗ packages/api-client   (UI는 데이터 비종속)
```

- `packages/*` 끼리 **순환 의존 금지**
- 한 패키지가 다른 패키지에 의존하면 `package.json`에 `workspace:*`로 명시
- 새 패키지를 추가할 때 의존 그래프를 그리고 위 다이어그램에 반영 (루트 `CLAUDE.md`도 함께 갱신)

## 공개 API (export) 규칙

패키지의 외부 노출 표면은 `package.json`의 `exports` 필드로 **명시적으로** 정의.

```json
// package.json 패턴
{
  "name": "@repo/ui",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./button": "./src/button/index.ts",
    "./modal": "./src/modal/index.ts",
    "./tokens": "./src/tokens.css"
  }
}
```

원칙:

- **`exports`에 명시된 경로만 외부에서 import 가능** — 내부 파일을 직접 import하는 건 금지
- 큰 패키지(`@repo/ui` 등)는 **subpath export 권장** (예: `@repo/ui/button`) — 트리 셰이킹 효율 및 의도 명확
- 작은 패키지(`@repo/config` 등)는 단일 root export(`@repo/<n>`)로 충분
- TypeScript 환경에서는 소스(`.ts`)를 직접 export — 별도 빌드 단계 불필요 (아래 "빌드 산출물" 참고)

```ts
// ✅ 올바른 사용 (앱 측)
import { Button } from '@repo/ui/button'

// ❌ 잘못된 사용 — 내부 파일 직접 접근
import { Button } from '@repo/ui/src/button/button'
```

## 빌드 산출물 규칙

이 모노레포는 **소스 직접 export**(`"exports": "./src/index.ts"`) 방식을 기본으로 함.

이유:

- 모든 앱이 같은 모노레포 안의 TypeScript 빌드 파이프라인을 공유
- 각 패키지마다 별도 빌드 산출물(`dist/`)을 만들면 변경 시 watch 비용이 증가
- Turborepo의 캐시는 앱 빌드 단계에서 패키지 소스를 함께 처리

예외 (별도 빌드가 필요한 경우):

- 외부 publish 대상 패키지
- 런타임 컴파일 비용이 큰 코드(예: 큰 SVG 자동 생성)
- TypeScript 외 도구(예: SCSS 사전 빌드)가 필요한 패키지

위 예외에 해당하면 패키지 자체 `CLAUDE.md`에 빌드 전략을 명시하고 `tsup` / `vite` / `rollup` 중 하나를 선택해 일관되게 적용. 임의 도구 도입 금지.

## 의존성 관리

### dependencies vs peerDependencies vs devDependencies

| 종류 | 용도 | 예시 |
|---|---|---|
| `dependencies` | 패키지가 런타임에 실제로 사용 — 앱이 자동으로 같은 인스턴스를 받음 | `zod`, `openapi-fetch` |
| `peerDependencies` | 앱이 **이미 가지고 있을 것으로 가정** — 중복 인스턴스를 막아야 하는 라이브러리 | `react`, `react-dom`, `@tanstack/react-query` |
| `devDependencies` | 패키지 개발/빌드/테스트에만 필요 — 앱이 받지 않아도 됨 | `typescript`, `vitest` |

원칙:

- **React, React Query, Zustand 같은 "단일 인스턴스가 필수"인 라이브러리는 항상 `peerDependencies`** — 두 인스턴스가 들어가면 Hook 에러나 store 분리 등 심각한 버그
- 워크스페이스 의존은 항상 `workspace:*` 프로토콜
- 같은 라이브러리를 여러 패키지가 쓰면 **버전을 일치**시킴 (루트 `package.json`의 `pnpm.overrides` 활용 가능)

```json
// packages/ui/package.json 예시
{
  "dependencies": {
    "clsx": "^2.0.0",
    "@repo/config": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-dom": ">=19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  }
}
```

## 도메인 / 환경 비종속

패키지는 **앱이 어떤 도메인이든, 어떤 환경이든** 동작해야 함.

금지:

- ❌ 환경변수(`process.env`, `import.meta.env`)를 패키지 안에서 직접 읽기 — 앱이 주입해야 함
- ❌ 도메인 용어(`Order`, `Payment` 등)를 패키지 이름/모듈에 박기 — 도메인 타입은 `@repo/api-client`의 자동 생성 namespace로만 노출
- ❌ 특정 라우터(`react-router`, `next/router`)에 의존하기 — 라우팅은 앱의 책임
- ❌ 패키지 안에 `console.log` 잔류 — 앱이 주입한 logger 또는 표준 에러 throw 사용

권장:

- ✅ 설정값은 **함수 인자**로 받기 (예: `createApiClient(config)`)
- ✅ 토큰/세션 등 동적 값은 **getter 함수**로 받기 (`getAuthToken: () => string`)
- ✅ 동작 변경이 필요하면 **미들웨어/인터셉터** 패턴으로 확장점 노출

## 테스트

- 패키지의 순수 로직(유틸, 변환 함수, 검증 스키마)은 **단위 테스트 100% 커버리지 지향**
- 외부 의존(fetch, 타이머)은 모킹 — `@repo/api-client`는 `fetch`를 주입받을 수 있게 만들어 MSW로 테스트
- 테스트 파일 위치: 대상 파일 옆 `*.test.ts(x)`
- `vitest`로 통일 (jest 등 다른 러너 도입 금지 — 모노레포 일관성)

## 새 패키지 추가 절차

1. `pnpm-workspace.yaml`에 `packages/*`가 포함되어 있는지 확인 (이미 포함됨)
2. `packages/<new-name>/` 폴더 생성
3. `package.json` 작성:
   - `name: "@repo/<new-name>"`
   - `private: true`, `version: "0.0.0"`
   - `type: "module"`
   - `exports` 정의
   - `dependencies` / `peerDependencies` 분리
4. `tsconfig.json` 작성 — `@repo/config`의 base 상속
5. `src/index.ts`로 시작 (배럴 파일 아닌 진짜 진입점)
6. 의존 방향 다이어그램 갱신 (루트 `CLAUDE.md`의 "패키지 의존 규칙" 섹션)
7. 패키지에 자체 규약이 있으면 `packages/<new-name>/CLAUDE.md` 추가
8. `README.md` 작성 — **Why → How → Result** 구조

## Claude Code 변경 시 체크리스트

- [ ] 새 코드가 *두 개 이상 앱이 공유할 만한지* 검토했는가 (한 앱 전용은 `apps/<n>/`에)
- [ ] `exports` 필드에 명시되지 않은 경로로 외부 노출하지 않는가
- [ ] React 등 단일 인스턴스 라이브러리를 `dependencies`가 아닌 `peerDependencies`로 두었는가
- [ ] 환경변수를 패키지 내부에서 직접 읽지 않는가 (인자/getter로 받기)
- [ ] 도메인 용어가 패키지 이름/모듈에 들어가지 않는가
- [ ] 워크스페이스 의존을 `workspace:*`로 명시했는가
- [ ] 의존 방향이 단방향인가 (`packages/ui ↛ packages/api-client` 등)
- [ ] 패키지 변경이 모든 앱의 빌드/타입체크를 통과하는가
