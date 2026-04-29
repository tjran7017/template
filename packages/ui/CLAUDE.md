# @repo/ui

공통 디자인 시스템 패키지. **CSS 변수 기반 디자인 토큰 + 단순한 React 컴포넌트** 조합. 외부 UI 라이브러리 의존 없이 직접 작성.

> **상위 문서:** 루트 `CLAUDE.md` → `packages/CLAUDE.md`
> **이 문서가 우선:** ui 패키지 특화 규약 — 컴포넌트 작성, 디자인 토큰, Storybook

## 패키지 목적

- 두 개 이상 앱이 공유하는 도메인 비종속 UI 컴포넌트 모음
- 디자인 토큰(색/타입/간격 등) 단일 정의 → 모든 사용처 일관성
- 컴포넌트 카탈로그(Storybook)로 시각 회귀 / 사용 예시 문서화

## 무엇을 / 무엇을 하지 않는가

| 패키지가 하는 일 | 패키지가 하지 않는 일 |
|---|---|
| 디자인 토큰 (CSS 변수) 정의 | 도메인 컴포넌트 (UserCard, OrderTable 등) |
| 단순 primitive (Button, Input, Card 등) | 앱 특화 레이아웃 (AppHeader, Sidebar) — 앱의 `components/` |
| Storybook으로 사용 예시 문서화 | 비즈니스 로직 / 상태 관리 |
| 명시적 a11y 규칙 (focus-visible, ARIA) | 페이지 레벨 / 라우팅 / 데이터 페칭 |

## 시작 범위

처음에는 **단순한 primitive만** 다룬다 (Button, Input, Label, Card, Divider 등). 이유:

- 외부 UI 라이브러리에 의존하지 않으므로 우리가 통제할 수 있는 범위에서 시작
- Modal / Dropdown / Toast / Combobox / DatePicker 같이 키보드 트랩, 포커스 복원, ARIA 등을 정확히 다뤄야 하는 컴포넌트는 **실제 필요해지는 시점에** 도입을 검토
- 그 시점에 두 가지 옵션을 비교: ① 직접 구현 ② 헤드리스 라이브러리 도입(`react-aria`, `ariakit`, `@headlessui/react` 등)
- 결정 사유는 ADR로 기록

> **현재 시점에서는 "직접 구현 가능한 단순 컴포넌트"만 추가** — 복잡한 컴포넌트 구현 욕구가 있어도 보류하고 사용처에서 일단 자체 구현 후 패턴이 명확해지면 그때 추출.

## 디렉토리 구조

```
packages/ui/
├── src/
│   ├── tokens/                 디자인 토큰 (CSS 변수 + JS export)
│   │   ├── tokens.css          :root에 CSS 변수 정의 (color, typography, spacing 등)
│   │   ├── tokens.ts           JS/TS에서 토큰 참조용 (예: tokens.color.primary)
│   │   └── theme.css           data-theme="dark" 등 테마별 변수 override
│   ├── primitives/             단순 React 컴포넌트
│   │   ├── button/
│   │   │   ├── button.tsx
│   │   │   ├── button.module.scss
│   │   │   ├── button.stories.tsx
│   │   │   └── button.test.tsx
│   │   ├── input/
│   │   ├── label/
│   │   └── card/
│   ├── styles/                 글로벌 reset / typography 베이스
│   │   ├── reset.css
│   │   └── base.scss
│   └── lib/                    공용 유틸
│       └── cn.ts               clsx 래퍼
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── package.json
└── CLAUDE.md
```

> **배럴 파일(`index.ts`) 없음** — 외부에서는 subpath export로 직접 접근 (`@repo/ui/button`).

## 공개 API (export)

```json
// package.json
{
  "name": "@repo/ui",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    "./tokens.css": "./src/tokens/tokens.css",
    "./theme.css": "./src/tokens/theme.css",
    "./reset.css": "./src/styles/reset.css",
    "./base.scss": "./src/styles/base.scss",
    "./tokens": "./src/tokens/tokens.ts",
    "./button": "./src/primitives/button/button.tsx",
    "./input": "./src/primitives/input/input.tsx",
    "./label": "./src/primitives/label/label.tsx",
    "./card": "./src/primitives/card/card.tsx",
    "./cn": "./src/lib/cn.ts"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "@repo/config": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-dom": ">=19.0.0"
  },
  "devDependencies": {
    "@storybook/react-vite": "^8.0.0",
    "sass": "^1.80.0",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  }
}
```

> **외부 UI 라이브러리 의존 없음** — `clsx`만 사용. 모든 컴포넌트는 직접 작성.
> **subpath export**로 트리 셰이킹 효율 + import 의도 명확.

## 디자인 토큰

### 원칙

- **CSS 변수가 단일 진실 공급원** — 컴포넌트는 항상 `var(--xxx)` 참조
- TypeScript 객체(`tokens.ts`)는 CSS 변수 이름의 *카탈로그*일 뿐, 실제 값은 CSS에 있음
- 다크모드 / 테마 변경은 `data-theme` 속성으로 변수 override

### `tokens.css` 패턴

```css
/* src/tokens/tokens.css */
:root {
  /* color */
  --color-bg: #ffffff;
  --color-fg: #111111;
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-danger: #dc2626;
  --color-border: #e5e7eb;

  /* typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;

  /* spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;

  /* radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
}
```

### `theme.css` 패턴 (다크모드)

```css
/* src/tokens/theme.css */
[data-theme='dark'] {
  --color-bg: #0a0a0a;
  --color-fg: #f5f5f5;
  --color-border: #262626;
  /* primary 등은 그대로 또는 약간 조정 */
}
```

### `tokens.ts` 패턴 (JS 참조용)

```ts
/* src/tokens/tokens.ts */
/** CSS 변수 이름 카탈로그 — 실제 값은 tokens.css에서 정의 */
export const tokens = {
  color: {
    bg: 'var(--color-bg)',
    fg: 'var(--color-fg)',
    primary: 'var(--color-primary)',
    primaryHover: 'var(--color-primary-hover)',
    danger: 'var(--color-danger)',
    border: 'var(--color-border)',
  },
  spacing: {
    1: 'var(--spacing-1)',
    2: 'var(--spacing-2)',
    3: 'var(--spacing-3)',
    4: 'var(--spacing-4)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
  },
} as const
```

> JS에서 토큰을 직접 쓸 일은 거의 없음 (예: 인라인 스타일이 필요한 동적 케이스). SCSS에서는 `var(--xxx)`를 직접 쓰는 게 더 자연스러움.

## 컴포넌트 작성 규칙

### 1. 폴더 단위 분리

각 컴포넌트는 자체 폴더에 다음 파일 구성:

```
button/
├── button.tsx           컴포넌트 본체
├── button.module.scss   스타일 (필요 시)
├── button.stories.tsx   Storybook 스토리
└── button.test.tsx      테스트 (인터랙션 / 접근성)
```

### 2. 단순 컴포넌트 작성 패턴

HTML 표준 element를 그대로 활용. props는 native attributes를 확장:

```tsx
// src/primitives/button/button.tsx
import { cn } from '../../lib/cn'
import styles from './button.module.scss'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  ref?: React.Ref<HTMLButtonElement>
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(styles.button, styles[variant], styles[size], className)}
      {...props}
    />
  )
}
```

```tsx
// src/primitives/input/input.tsx
import { cn } from '../../lib/cn'
import styles from './input.module.scss'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
  ref?: React.Ref<HTMLInputElement>
}

export function Input({ invalid, className, ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(styles.input, invalid && styles.invalid, className)}
      {...props}
    />
  )
}
```

### 3. Props 컨벤션

- **`className` prop은 항상 받음** — 사용처에서 미세 조정 가능
- **`ref`는 prop으로 직접** — React 19에서 forwardRef 불필요
- **native HTML attributes 확장** — 추가 props는 variant, size 등 시각/기능 옵션만
- **`type="button"` 같은 안전 기본값** — submit 버튼이 의도치 않게 폼을 제출하는 등 흔한 실수 방지

### 4. 스타일링 규칙

- **SCSS Modules 사용** — `*.module.scss`
- **색/간격/타입은 항상 CSS 변수** — 하드코딩 금지
- **레이아웃 / 사이즈는 props 기반** — variant / size 같은 props로 분기, 사용처가 className으로 override
- **`!important` 금지** — 우선순위 충돌은 구조로 해결

```scss
/* button.module.scss */
.button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.primary {
  background-color: var(--color-primary);
  color: var(--color-bg);

  &:hover:not(:disabled) { background-color: var(--color-primary-hover); }
}

.secondary { /* ... */ }
.danger { /* ... */ }

.sm { font-size: var(--font-size-sm); padding: var(--spacing-1) var(--spacing-3); }
.md { /* default */ }
.lg { font-size: var(--font-size-lg); padding: var(--spacing-3) var(--spacing-4); }
```

### 5. 접근성 체크리스트

직접 구현하므로 매번 확인:

- [ ] 키보드만으로 모든 인터랙션 가능 (Tab, Enter, Space)
- [ ] `:focus-visible` 스타일 명확히 정의 (마우스 클릭 시에는 안 보이고 키보드 진입 시에만)
- [ ] disabled 상태가 시각 + `disabled` 속성 둘 다 처리
- [ ] 색만으로 정보 전달하지 않음 (예: 에러는 색 + 아이콘 + 텍스트, `aria-invalid` 등 속성)
- [ ] 적절한 native element 사용 (`<button>` not `<div onClick>`)
- [ ] Storybook의 `@storybook/addon-a11y`로 자동 검사

## Storybook

### 스토리 작성 규칙

```tsx
// button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = { args: { children: 'Click me', variant: 'primary' } }
export const Secondary: Story = { args: { children: 'Click me', variant: 'secondary' } }
export const Danger: Story = { args: { children: 'Delete', variant: 'danger' } }
export const Disabled: Story = { args: { children: 'Disabled', disabled: true } }
```

### 컴포넌트 추가 시 필수 스토리

- 기본 / 모든 variant / 모든 size
- 비활성(disabled) / 로딩(loading) 상태
- 에지 케이스 (긴 텍스트, 빈 값 등)
- 다크모드 (스토리북 글로벌 토글로 자동 검사)

## 컴포넌트 추가 vs 앱의 components/

이 패키지에 둘지, 사용처 앱의 `components/`에 둘지 결정 기준:

| @repo/ui에 둠 | 앱의 components/에 둠 |
|---|---|
| 도메인 비종속 (Button, Input) | 앱 특화 레이아웃 (AppHeader, Sidebar) |
| 두 개 이상 앱이 공유 | 한 앱에서만 사용 |
| 디자인 시스템의 일부 | 비즈니스 컴포넌트 |
| API/스토어에 의존하지 않음 | 데이터 페칭 / 상태 관리 포함 |

> 한 앱 전용으로 시작했다가 다른 앱이 같은 컴포넌트를 쓰게 되면 그때 `@repo/ui`로 추출. 사전에 *"공유될지도 모르니까"* 미리 옮기지 않음.

## 새 컴포넌트 추가 절차

1. **단순 primitive인지 확인** — Modal/Dropdown/Combobox 등 복잡한 컴포넌트면 일단 보류 (시작 범위 섹션 참고)
2. **`src/primitives/<n>/` 폴더 생성**
3. **컴포넌트 본체** (`<n>.tsx`) 작성 — native HTML element 위에 얹기
4. **스타일** (`<n>.module.scss`) — CSS 변수 사용
5. **스토리** (`<n>.stories.tsx`) — variant / 상태별 모두 작성
6. **테스트** (`<n>.test.tsx`) — 인터랙션, 접근성 (jest-axe 등)
7. **`package.json`의 `exports`에 등록** — `"./button": "./src/primitives/button/button.tsx"`

## 명령어

```bash
pnpm --filter=@repo/ui storybook       # 컴포넌트 카탈로그 (localhost:6006)
pnpm --filter=@repo/ui storybook:build # 정적 빌드
pnpm --filter=@repo/ui test            # vitest
pnpm --filter=@repo/ui typecheck
```

## Claude Code 변경 시 체크리스트

- [ ] 새 컴포넌트가 *두 개 이상 앱이 공유할 만한지* 확인했는가 (한 앱 전용은 앱 `components/`)
- [ ] 단순 primitive 범위 안에 있는가 (복잡한 컴포넌트라면 사용처에서 자체 구현 후 패턴이 명확해지면 추출)
- [ ] 색/간격/타입을 하드코딩하지 않고 CSS 변수를 사용했는가
- [ ] `className` prop을 받아 사용처가 override 가능하도록 했는가
- [ ] React 19의 ref-as-prop 패턴을 사용했는가 (`forwardRef` 사용 금지)
- [ ] native HTML attributes를 확장하는 형태인가 (`React.ButtonHTMLAttributes<HTMLButtonElement>` 등)
- [ ] Storybook 스토리를 작성했는가 (variant / 상태별 모두)
- [ ] 키보드 인터랙션 / `:focus-visible` 스타일이 정의되어 있는가
- [ ] 적절한 native element를 사용했는가 (`<button>` not `<div onClick>`)
- [ ] `package.json`의 `exports`에 새 subpath를 등록했는가
- [ ] 도메인 용어 / 비즈니스 로직이 컴포넌트에 들어가지 않았는가
- [ ] 외부 UI 라이브러리를 추가하려 한다면 ADR로 결정 사유를 기록했는가
