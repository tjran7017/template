/** CSS 변수 이름 카탈로그 — 실제 값은 tokens.css에서 정의 */
export const tokens = {
  color: {
    bg: 'var(--color-bg)',
    fg: 'var(--color-fg)',
    fgMuted: 'var(--color-fg-muted)',
    primary: 'var(--color-primary)',
    primaryHover: 'var(--color-primary-hover)',
    primarySubtle: 'var(--color-primary-subtle)',
    danger: 'var(--color-danger)',
    dangerHover: 'var(--color-danger-hover)',
    success: 'var(--color-success)',
    successHover: 'var(--color-success-hover)',
    border: 'var(--color-border)',
    surface: 'var(--color-surface)',
  },
  shadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
  },
  spacing: {
    1: 'var(--spacing-1)',
    2: 'var(--spacing-2)',
    3: 'var(--spacing-3)',
    4: 'var(--spacing-4)',
    5: 'var(--spacing-5)',
    6: 'var(--spacing-6)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
  },
} as const
