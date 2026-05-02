import { cn } from '@repo/ui/cn'

import styles from './health-status.module.scss'

export type HealthState = 'loading' | 'ok' | 'fail'

type HealthStatusProps = {
  state: HealthState
  label: string
  prefix?: string
}

export function HealthStatus({ state, label, prefix }: HealthStatusProps) {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span
        className={cn(styles.dot, state === 'ok' && styles.ok, state === 'fail' && styles.fail)}
        aria-hidden
      />
      <span>
        API 상태{prefix ? ` (${prefix})` : ''}: {label}
      </span>
    </div>
  )
}
