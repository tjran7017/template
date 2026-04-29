# @repo/ui

CSS 변수 기반 디자인 토큰과 단순한 React 컴포넌트로 구성된 공통 디자인 시스템. 외부 UI 라이브러리 의존 없이 직접 작성.

## Why — 왜 만들었나

여러 앱을 운영하다 보면 다음 문제가 반복된다:

- 앱마다 Button, Input 같은 기본 컴포넌트를 따로 만들어 같은 듯 다른 UI가 생긴다
- 색/간격/폰트 같은 토큰이 앱마다 미묘하게 달라 일관성이 깨진다
- 새 디자이너 / 새 앱이 참여할 때 *"이 회사의 UI는 어떻게 생겼지?"* 를 확인할 곳이 없다
- 외부 UI 라이브러리에 깊게 묶이면 디자인 자유도와 번들 크기 모두 손해

이 패키지는 토큰부터 단순 컴포넌트까지 한 곳에 모으고, **외부 의존 없이** 직접 통제하는 방향을 택했다.

## How — 어떻게 풀었나

### 1. CSS 변수 = 디자인 토큰의 단일 진실

색/타이포/간격은 `src/tokens/tokens.css`의 `:root`에 CSS 변수로 한 번만 정의한다. 컴포넌트는 항상 `var(--xxx)`를 참조한다.

```css
/* tokens.css */
:root {
  --color-primary: #4f46e5;
  --spacing-4: 1rem;
  --radius-md: 0.5rem;
}
```

다크모드 / 테마 전환은 `data-theme` 속성으로 변수만 override:

```css
[data-theme='dark'] {
  --color-bg: #0a0a0a;
  --color-fg: #f5f5f5;
}
```

런타임 변경 가능, JS 빌드 영향 없음, 토큰 한 줄만 바꾸면 전체 앱이 따라옴.

### 2. 단순한 React 컴포넌트 직접 작성

처음에는 외부 UI 라이브러리에 의존하지 않고 native HTML element 위에 얇은 wrapper만 얹는다:

```tsx
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  ref?: React.Ref<HTMLButtonElement>
}

export function Button({ variant = 'primary', size = 'md', className, ref, ...props }: ButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(styles.button, styles[variant], styles[size], className)}
      {...props}
    />
  )
}
```

장점:

- 코드를 100% 통제 — 디자인/동작을 마음대로 조정
- 외부 라이브러리 호환성 / 버전 업데이트 부담 없음
- 번들 크기 최소
- 학습 곡선 없음 (React + HTML이 전부)

### 3. 시작 범위는 단순 primitive로 한정

Button, Input, Label, Card 같은 단순 컴포넌트만 우선 다룬다. Modal, Dropdown, Toast 같이 키보드 트랩, 포커스 복원, 복잡한 ARIA 처리가 필요한 컴포넌트는 **실제 필요해지는 시점에** 도입을 검토한다.

그 시점에 두 가지 옵션을 비교한다:

1. **직접 구현** — 작은 한두 개라면
2. **헤드리스 라이브러리 도입** — `react-aria`, `ariakit`, `@headlessui/react` 등 *"동작은 라이브러리, 시각은 우리"* 모델

결정 사유는 ADR로 기록한다. 미리 라이브러리를 도입해 의존성을 늘리지 않는다.

### 4. subpath export로 트리 셰이킹

각 컴포넌트는 자체 subpath로 export. 사용처는 필요한 것만 import:

```ts
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
```

배럴 파일(`index.ts`) 없음. import 의도가 명확하고 트리 셰이킹 효율도 최고.

### 5. Storybook으로 컴포넌트 카탈로그

각 컴포넌트는 `*.stories.tsx`로 모든 variant / 상태를 시각적으로 문서화한다. 면접관 / 디자이너 / 신규 합류자가 한 곳에서 디자인 시스템 전체를 둘러볼 수 있다.

## Result — 무엇이 좋아졌나

- **앱 간 시각 일관성** — 토큰 한 줄만 바꿔도 모든 앱이 따라옴
- **외부 의존 최소** — 패키지 의존성은 `clsx` 하나뿐, 번들 영향 거의 0
- **다크모드를 한 줄로** — `<html data-theme="dark">` 토글
- **번들 효율** — subpath import로 사용 안 한 컴포넌트 0 KB
- **디자인 시스템 살아있는 문서** — Storybook 한 곳에서 전부

## 사용법

### 설치 (모노레포 워크스페이스)

```json
// 사용처 package.json
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  }
}
```

### 1. 글로벌 스타일 / 토큰 적용

각 앱의 진입점(또는 root layout)에서 토큰 CSS를 import:

```ts
// apps/nextjs/src/app/layout.tsx
import '@repo/ui/reset.css'
import '@repo/ui/tokens.css'
import '@repo/ui/theme.css'  // 다크모드 등
```

```ts
// apps/react-vite/src/main.tsx
import '@repo/ui/reset.css'
import '@repo/ui/tokens.css'
import '@repo/ui/theme.css'
```

### 2. 컴포넌트 사용

```tsx
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'

function LoginForm() {
  return (
    <form>
      <Input name="email" type="email" placeholder="이메일" />
      <Input name="password" type="password" placeholder="비밀번호" />
      <Button variant="primary" type="submit">로그인</Button>
    </form>
  )
}
```

### 3. 다크모드 토글

```tsx
function ThemeToggle() {
  const toggle = () => {
    const current = document.documentElement.dataset.theme
    document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark'
  }
  return <Button onClick={toggle}>테마 전환</Button>
}
```

### 4. 컴포넌트 미세 조정

`className` prop으로 사용처에서 override:

```tsx
<Button variant="primary" className={styles.fullWidth}>
  로그인
</Button>
```

```scss
/* my-page.module.scss */
.fullWidth {
  width: 100%;
}
```

## 자주 묻는 질문

### 왜 Tailwind / shadcn-ui를 안 쓰나?

이력서/조직의 강점이 SCSS Modules다. Tailwind는 학습 곡선과 클래스 폭증을 유발하고, shadcn-ui는 컴포넌트를 카피해서 가져가는 방식이라 모노레포 공통 패키지 모델과 맞지 않는다. *"한 곳에서 정의하고 모든 앱이 import"* 모델을 원했고, 그게 SCSS Modules + CSS 변수 조합이다.

### 왜 외부 UI 라이브러리(Radix, Mantine 등)를 안 쓰나?

처음부터 도입하면 의존성 부담과 학습 부담이 동시에 생긴다. 단순 컴포넌트(Button, Input, Card)는 직접 작성하는 게 더 빠르고 통제 가능하다. **실제로 복잡한 컴포넌트가 필요해지는 시점에** 그때의 요구사항에 맞춰 옵션을 비교하는 게 정직하다.

### Modal / Dropdown / Toast 같은 건 언제 추가되나?

사용처에서 실제로 필요해질 때. 그때 두 가지 길:

1. **사용처에서 일단 자체 구현** → 패턴이 명확해지면 이 패키지로 추출
2. **헤드리스 라이브러리 도입** → ADR로 결정 (`react-aria` / `ariakit` / `@headlessui/react` 등)

미리 *"있을지도 모르니까"* 추가하지 않는다.

### 우리 앱에만 쓰는 컴포넌트도 여기 두면 되나?

두지 않는다. 한 앱 전용은 그 앱의 `components/`에 둔다. 두 개 이상 앱이 공유하기 시작하면 그때 이 패키지로 추출한다. 기준:

| `@repo/ui` | 앱의 `components/` |
|---|---|
| 도메인 비종속 (Button) | 앱 특화 레이아웃 (AppHeader) |
| 두 앱 이상 공유 | 한 앱만 사용 |
| API에 의존하지 않음 | 데이터/상태 포함 |

### 디자인 토큰을 JS에서 쓰고 싶다면?

`@repo/ui/tokens`에서 카탈로그 객체를 import:

```ts
import { tokens } from '@repo/ui/tokens'

const style = { backgroundColor: tokens.color.primary }
// → backgroundColor: 'var(--color-primary)'
```

다만 SCSS에서 `var(--xxx)`를 직접 쓰는 게 더 자연스럽다. JS 사용은 인라인 스타일이 필요한 동적 케이스(애니메이션 값 계산 등)에만.

### 기존 컴포넌트의 디자인을 바꾸고 싶다면?

두 가지 경로:

1. **토큰만 바꾸면 끝나는 변경**: `tokens.css`만 수정 (예: primary 색 변경)
2. **컴포넌트 자체의 변경**: 해당 컴포넌트의 `*.module.scss` 또는 `*.tsx` 수정 + Storybook 스토리 갱신

어느 쪽이든 변경이 모든 사용처에 즉시 영향을 주므로, Storybook에서 시각 회귀를 미리 확인한다.

### 접근성은 어떻게 챙기나?

직접 작성하므로 다음을 매번 확인한다:

- 키보드만으로 모든 인터랙션 가능 (Tab, Enter, Space)
- `:focus-visible`로 키보드 진입 시 포커스 표시
- 적절한 native element 사용 (`<button>` not `<div onClick>`)
- 색만으로 정보 전달하지 않음 (에러 = 색 + 아이콘 + 텍스트 + `aria-invalid`)
- Storybook의 `@storybook/addon-a11y`로 자동 검사

### 컴포넌트를 추가하고 싶다면?

자세한 절차는 [`CLAUDE.md`](./CLAUDE.md)의 "새 컴포넌트 추가 절차" 참고.

## 명령어

```bash
# Storybook 개발 서버 (localhost:6006)
pnpm --filter=@repo/ui storybook

# Storybook 정적 빌드
pnpm --filter=@repo/ui storybook:build

# 테스트
pnpm --filter=@repo/ui test

# 타입 체크
pnpm --filter=@repo/ui typecheck
```

## 새 컴포넌트 추가

자세한 절차와 작성 규칙은 [`CLAUDE.md`](./CLAUDE.md) 참고.
