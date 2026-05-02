# @repo/ui

CSS 변수 기반 디자인 토큰과 React 19 컴포넌트로 구성된 모노레포 공통 디자인 시스템.

- **외부 UI 라이브러리 의존 없음** — `clsx`만 사용
- **CSS 변수 기반 토큰** — 다크모드 / 테마는 `data-theme` 속성으로 토글
- **SCSS Modules** — 컴포넌트별 스타일 격리
- **Subpath exports** — 트리 셰이킹 친화적
- **React 19 ref-as-prop** — `forwardRef` 없이 ref 직접 전달

## Installation

모노레포 워크스페이스 내부에서 사용:

```json
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-dom": ">=19.0.0"
  }
}
```

## Setup

각 앱 진입점에서 토큰/리셋 CSS를 import:

```ts
// apps/nextjs/src/app/layout.tsx
import '@repo/ui/reset.css'
import '@repo/ui/tokens.css'
import '@repo/ui/theme.css'
```

```ts
// apps/react-vite/src/main.tsx
import '@repo/ui/reset.css'
import '@repo/ui/tokens.css'
import '@repo/ui/theme.css'
```

## Components

| 이름   | Subpath           | 설명                                           |
| ------ | ----------------- | ---------------------------------------------- |
| Button | `@repo/ui/button` | variant / size 기반 버튼                       |
| Card   | `@repo/ui/card`   | `CardHeader / CardBody / CardFooter` composite |

각 컴포넌트의 사용 예시와 props는 소스 파일의 JSDoc 주석에서 확인 (IDE hover) 또는 Storybook에서 시각적으로 확인.

## Theming

### CSS 변수 기반 토큰

```css
/* 사용처에서 :root 또는 컴포넌트 단위로 override 가능 */
:root {
  --color-primary: #6366f1;
  --spacing-4: 1rem;
  --radius-md: 0.625rem;
}
```

전체 토큰 목록은 [`src/tokens/tokens.css`](./src/tokens/tokens.css) 참조.

### 다크모드

`<html data-theme="dark">` 토글로 변수가 자동 override:

```tsx
function ThemeToggle() {
  return (
    <Button
      onClick={() => {
        const el = document.documentElement
        el.dataset.theme = el.dataset.theme === 'dark' ? 'light' : 'dark'
      }}
    >
      테마 전환
    </Button>
  )
}
```

### JS에서 토큰 참조

인라인 스타일이 필요한 동적 케이스에서만 사용 (SCSS에서는 `var(--xxx)` 직접 사용 권장):

```tsx
import { tokens } from '@repo/ui/tokens'

;<div style={{ backgroundColor: tokens.color.primary }} />
// → backgroundColor: 'var(--color-primary)'
```

### className으로 미세 조정

모든 컴포넌트는 `className` prop을 받아 사용처가 override 가능:

```tsx
<Button variant="primary" className={styles.fullWidth}>
  로그인
</Button>
```

## Scripts

```bash
pnpm --filter=@repo/ui storybook       # 컴포넌트 카탈로그 (localhost:6006)
pnpm --filter=@repo/ui storybook:build # 정적 빌드
pnpm --filter=@repo/ui test            # vitest (RTL + jest-axe)
pnpm --filter=@repo/ui typecheck
```

## Contributing

새 컴포넌트 추가 절차, 코드 컨벤션, 접근성 체크리스트는 [`CLAUDE.md`](./CLAUDE.md) 참조.
