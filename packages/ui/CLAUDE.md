# @repo/ui

공통 디자인 시스템 패키지. **CSS 변수 기반 디자인 토큰 + React 19 단순 컴포넌트** 조합.

> **상위 문서:** 루트 `CLAUDE.md` → `packages/CLAUDE.md`
> **이 문서가 우선:** ui 패키지 특화 규약 — 컴포넌트 작성, 디자인 토큰, Storybook

## 패키지 목적

- 두 개 이상 앱이 공유하는 도메인 비종속 UI 컴포넌트 모음
- 디자인 토큰(색/타입/간격 등) 단일 정의 → 모든 사용처 일관성
- 컴포넌트 카탈로그(Storybook)로 시각 회귀 / 사용 예시 문서화

## 무엇을 / 무엇을 하지 않는가

| 패키지가 하는 일                       | 패키지가 하지 않는 일                                      |
| -------------------------------------- | ---------------------------------------------------------- |
| 디자인 토큰 (CSS 변수) 정의            | 도메인 컴포넌트 (UserCard, OrderTable 등)                  |
| 단순 primitive (Button, Card 등)       | 앱 특화 레이아웃 (AppHeader, Sidebar) — 앱의 `components/` |
| Storybook으로 사용 예시 문서화         | 비즈니스 로직 / 상태 관리                                  |
| 명시적 a11y 규칙 (focus-visible, ARIA) | 페이지 레벨 / 라우팅 / 데이터 페칭                         |

## 시작 범위

처음에는 **단순한 primitive만** 다룬다. Modal / Dropdown / Toast / Combobox 등 키보드 트랩, 포커스 복원, 복잡한 ARIA를 다뤄야 하는 컴포넌트는 **실제 필요해지는 시점에** 도입을 검토:

1. 직접 구현 — 작은 한두 개라면
2. 헤드리스 라이브러리 도입 — `react-aria`, `ariakit`, `@headlessui/react` 등

결정 사유는 ADR로 기록. 미리 _"있을지도 모르니까"_ 추가하지 않음.

## 디렉토리 구조

```
packages/ui/
├── src/
│   ├── tokens/                 디자인 토큰 (CSS 변수 + JS export)
│   │   ├── tokens.css          :root에 CSS 변수 정의
│   │   ├── tokens.ts           JS/TS 참조용 카탈로그 (var(--xxx) 문자열)
│   │   └── theme.css           data-theme 별 변수 override
│   ├── primitives/             단순 React 컴포넌트
│   │   ├── button/
│   │   │   ├── button.tsx
│   │   │   ├── button.module.scss
│   │   │   ├── button.module.scss.d.ts   ← SCSS 타입 선언 (필수)
│   │   │   ├── button.stories.tsx
│   │   │   └── button.test.tsx
│   │   └── card/
│   ├── styles/                 글로벌 reset / typography 베이스
│   └── lib/cn.ts               clsx 래퍼
├── .storybook/main.ts, preview.ts
├── vitest.config.ts            globals: true, jsdom 환경
├── vitest.setup.ts             @testing-library/jest-dom/vitest + jest-axe 등록
├── package.json
└── CLAUDE.md
```

> **배럴 파일(`index.ts`) 없음** — 외부에서는 subpath export로 직접 접근 (`@repo/ui/button`).

## 공개 API (export)

`package.json`의 `exports` 필드로 명시. 실제 정의는 [`package.json`](./package.json) 참조.

원칙:

- subpath 마다 단일 진입점 (`./button`, `./card`, `./tokens.css` 등)
- 도메인/한 앱 전용 컴포넌트는 추가하지 않음
- 새 컴포넌트 추가 시 `exports`에 등록 누락 주의 — 등록 안 하면 사용처에서 import 불가

## 디자인 토큰

### 원칙

- **CSS 변수가 단일 진실 공급원** — 컴포넌트는 항상 `var(--xxx)` 참조, 색/간격/타입 하드코딩 금지
- TypeScript 객체(`tokens.ts`)는 CSS 변수 이름의 *카탈로그*일 뿐 (값은 CSS에 있음)
- 다크모드 / 테마 변경은 `data-theme` 속성으로 변수 override

### 토큰 카테고리

[`src/tokens/tokens.css`](./src/tokens/tokens.css) 참조. 카테고리:

- `--color-*` (bg, fg, fg-muted, primary, primary-hover, primary-subtle, danger, danger-hover, border, surface)
- `--shadow-*` (sm, md)
- `--font-*` (sans, size-xs/sm/base/lg, weight-medium/semibold, line-height-tight/normal)
- `--spacing-*` (1~6)
- `--radius-*` (sm, md, lg)
- `--transition-fast`

새 토큰 추가 시:

1. `tokens.css`의 `:root`에 변수 추가
2. `tokens.ts`의 카탈로그 객체에 동일 키 추가 (JS 참조 가능하도록)
3. 다크모드에서 값이 달라야 하면 `theme.css`에도 추가

## 컴포넌트 작성 규칙

### 1. 폴더 단위 분리

각 컴포넌트는 자체 폴더에 다음 파일 구성:

```
button/
├── button.tsx                  컴포넌트 본체 + JSDoc 사용 예시
├── button.module.scss          스타일
├── button.module.scss.d.ts     SCSS 클래스 타입 선언 (수동 유지)
├── button.stories.tsx          Storybook 스토리
└── button.test.tsx             RTL + jest-axe 테스트
```

### 2. SCSS Modules 타입 선언 필수

각 `*.module.scss` 파일 옆에 동일 이름의 `.d.ts`를 만들어 클래스명을 명시적으로 선언한다.

```ts
// button.module.scss.d.ts
declare const styles: {
  readonly button: string
  readonly primary: string
  readonly secondary: string
  readonly danger: string
  readonly sm: string
  readonly md: string
  readonly lg: string
}
export default styles
```

이유:

- `tsconfig.json`의 `allowArbitraryExtensions: true`와 짝을 이뤄 `import styles from './x.module.scss'`가 정확한 타입으로 풀린다
- 와일드카드 ambient 선언(`Record<string, string>`)을 쓰면 `noUncheckedIndexedAccess`로 인해 모든 접근이 `string | undefined`가 되고 `cn()`에서 unsafe lint 에러가 발생
- SCSS 클래스 추가/제거 시 `.d.ts`도 같이 수정 (타입 누락 = IDE/lint 에러)

### 3. 사용 예시 JSDoc 주석 (필수)

`export` 선언 바로 위에 코드 펜스 JSDoc 작성. IDE hover 시 사용 예시가 보여야 함.

````tsx
/**
 * ```tsx
 * <Button variant="primary">저장</Button>
 * <Button variant="secondary" size="sm">취소</Button>
 * <Button variant="danger" disabled>삭제</Button>
 * ```
 */
export function Button({ ... }: ButtonProps) { ... }
````

규칙:

- **`@example` 태그 사용 금지** — Storybook autodocs가 자동으로 Example 섹션을 만들어 Docs에 노출함
- ` ```tsx ` 코드 펜스만 사용하면 IDE hover에는 보이고 Storybook Docs에는 노출되지 않음
- variant / size / 주요 상태(disabled 등)를 각각 한 줄씩
- 실제 사용처에서 복붙 가능한 수준
- `console.log` 대신 `console.warn` 사용 (no-console 규칙)

### 4. Props 타입 패턴

native HTML element 타입을 `React.ComponentPropsWithRef<'tag'>`로 확장. `ref`는 자동 포함되므로 별도 선언 불필요:

```tsx
type ButtonProps = React.ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}
```

규칙:

- **`className` prop은 항상 받음** — 사용처에서 미세 조정 가능 (`cn(styles.x, className)`)
- **`ref`는 prop으로 직접 사용** — React 19, `forwardRef` 사용 금지
- **추가 props는 시각/기능 옵션만** — variant, size, invalid 같은 것
- **`type="button"` 같은 안전 기본값** — submit이 폼 제출하는 사고 방지

### 5. Composite 컴포넌트 패턴

서브 영역이 있는 컴포넌트(예: Card의 Header/Body/Footer)는 **named export로 분리**. dot-notation(`Card.Header`) 사용 금지.

```tsx
// card.tsx
export function Card({ ... }: CardProps) { ... }
export function CardHeader({ ... }: CardProps) { ... }
export function CardBody({ ... }: CardProps) { ... }
export function CardFooter({ ... }: CardProps) { ... }
```

```tsx
// 사용처
import { Card, CardHeader, CardBody } from '@repo/ui/card'
```

이유:

- IDE 타입 추론이 더 명확 (`Object.assign` 우회 없음)
- 트리 셰이킹 효율 (사용 안 한 서브컴포넌트 번들 제외)
- 개별 import 가능 → 사용처가 명시적

### 6. 스타일링 규칙

- **SCSS Modules 사용** — `*.module.scss`
- **색/간격/타입은 항상 CSS 변수** — 하드코딩 금지
- **레이아웃/사이즈는 props 분기** — variant/size 같은 props로 클래스 토글
- **`!important` 금지** — 우선순위 충돌은 구조로 해결

### 7. 접근성 체크리스트

직접 구현하므로 매번 확인:

- [ ] 키보드만으로 모든 인터랙션 가능 (Tab, Enter, Space)
- [ ] `:focus-visible` 스타일 명확히 정의 (마우스에는 안 보이고 키보드 진입 시에만)
- [ ] disabled 상태가 시각 + `disabled` 속성 둘 다 처리
- [ ] 색만으로 정보 전달하지 않음 (에러는 색 + 아이콘 + 텍스트, `aria-invalid` 등)
- [ ] 적절한 native element 사용 (`<button>` not `<div onClick>`)
- [ ] `@storybook/addon-a11y`와 `jest-axe`로 자동 검사

## Storybook

### 스토리 작성 규칙

- 모든 컴포넌트에 `tags: ['autodocs']` 적용 — Docs 자동 생성
- variant/size 분리 가능한 컴포넌트는 `argTypes`에 `control: 'select'` 지정
- Composite 컴포넌트는 `args` 대신 `render: () => (...)` 로 작성

### 컴포넌트 추가 시 필수 스토리

- 기본 / 모든 variant / 모든 size
- 비활성(disabled) / 로딩(loading) 등 주요 상태
- 에지 케이스 (긴 텍스트, 빈 값 등)
- Composite 패턴이면 단독/조합 케이스 각각

## 테스트

- **vitest** + **jsdom 환경** + **@testing-library/react** 16 + **jest-axe**
- `vitest.config.ts`에 `globals: true` — `@testing-library/react`의 auto-cleanup 활성화에 필요
- `vitest.setup.ts`에서 `@testing-library/jest-dom/vitest` 와 `jest-axe`의 `toHaveNoViolations` 등록
- 모든 컴포넌트에 `axe()` a11y 테스트 1개 이상 포함

## 컴포넌트 추가 vs 앱의 components/

| @repo/ui에 둠                | 앱의 components/에 둠                 |
| ---------------------------- | ------------------------------------- |
| 도메인 비종속 (Button, Card) | 앱 특화 레이아웃 (AppHeader, Sidebar) |
| 두 개 이상 앱이 공유         | 한 앱에서만 사용                      |
| 디자인 시스템의 일부         | 비즈니스 컴포넌트                     |
| API/스토어에 의존하지 않음   | 데이터 페칭 / 상태 관리 포함          |

> 한 앱 전용으로 시작했다가 다른 앱이 같은 컴포넌트를 쓰게 되면 그때 `@repo/ui`로 추출. 미리 옮기지 않음.

## 새 컴포넌트 추가 절차

1. **단순 primitive인지 확인** — Modal/Dropdown 등 복잡한 컴포넌트면 보류 ("시작 범위" 참고)
2. `src/primitives/<n>/` 폴더 생성
3. `<n>.module.scss` + `<n>.module.scss.d.ts` (SCSS 타입 선언) 작성
4. `<n>.tsx` 작성 — `React.ComponentPropsWithRef<'tag'>` 확장 + 코드 펜스 JSDoc + `cn()` + native element
5. `<n>.stories.tsx` — 모든 variant/상태별 스토리 + autodocs 태그
6. `<n>.test.tsx` — 인터랙션 + jest-axe a11y 테스트
7. `package.json`의 `exports`에 등록 — `"./<n>": "./src/primitives/<n>/<n>.tsx"`

## 명령어

```bash
pnpm --filter=@repo/ui storybook       # 컴포넌트 카탈로그 (localhost:6006)
pnpm --filter=@repo/ui storybook:build # 정적 빌드
pnpm --filter=@repo/ui test            # vitest
pnpm --filter=@repo/ui typecheck
```

## Claude Code 변경 시 체크리스트

- [ ] 새 컴포넌트가 _두 개 이상 앱이 공유할 만한지_ 확인했는가 (한 앱 전용은 앱 `components/`)
- [ ] 단순 primitive 범위 안에 있는가
- [ ] 컴포넌트 파일 export 바로 위에 코드 펜스 JSDoc을 작성했는가 (`@example` 태그 금지)
- [ ] 색/간격/타입을 하드코딩하지 않고 CSS 변수를 사용했는가
- [ ] `className` prop을 받아 사용처가 override 가능하도록 했는가
- [ ] `React.ComponentPropsWithRef<'tag'>` 패턴을 사용했는가 (`forwardRef` 사용 금지)
- [ ] SCSS 파일에 대응하는 `*.module.scss.d.ts`를 작성/갱신했는가
- [ ] Composite 컴포넌트는 dot-notation 대신 named export로 분리했는가
- [ ] Storybook 스토리를 작성했는가 (variant / 상태별 모두 + autodocs 태그)
- [ ] 키보드 인터랙션 / `:focus-visible` 스타일이 정의되어 있는가
- [ ] 적절한 native element를 사용했는가 (`<button>` not `<div onClick>`)
- [ ] `package.json`의 `exports`에 새 subpath를 등록했는가
- [ ] `axe()` a11y 테스트를 1개 이상 추가했는가
- [ ] 도메인 용어 / 비즈니스 로직이 컴포넌트에 들어가지 않았는가
- [ ] 외부 UI 라이브러리를 추가하려 한다면 ADR로 결정 사유를 기록했는가
