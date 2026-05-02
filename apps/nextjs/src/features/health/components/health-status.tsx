'use client'

import { cn } from '@repo/ui/cn'

import styles from './health-status.module.scss'
import { useHealth } from '../api/get-health'

export function HealthStatus() {
  const { data, isLoading, isError } = useHealth()

  const state: 'idle' | 'ok' | 'fail' = isLoading ? 'idle' : isError ? 'fail' : 'ok'
  const label = isLoading ? '확인 중…' : isError ? '연결 실패' : (data?.status ?? 'unknown')

  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span
        className={cn(styles.dot, state === 'ok' && styles.ok, state === 'fail' && styles.fail)}
        aria-hidden
      />
      <span>API 상태: {label}</span>
    </div>
  )
}
