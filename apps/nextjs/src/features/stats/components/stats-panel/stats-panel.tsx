import { cn } from '@repo/ui/cn'

import styles from './stats-panel.module.scss'

export type StatsPanelProps =
  | { state: 'loading' }
  | { state: 'fail' }
  | { state: 'ok'; uptime: number; requestsPerMin: number }

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}h ${m}m ${s}s`
}

export function StatsPanel(props: StatsPanelProps) {
  const uptimeText = props.state === 'ok' ? formatUptime(props.uptime) : '—'
  const rpmText = props.state === 'ok' ? String(props.requestsPerMin) : '—'

  return (
    <div className={cn(styles.panel, styles[props.state])} role="status" aria-live="polite">
      <div className={styles.row}>
        <span className={styles.label}>Uptime</span>
        <span className={styles.value}>{uptimeText}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Requests / min</span>
        <span className={styles.value}>{rpmText}</span>
      </div>
    </div>
  )
}

// async Server Component — page에서 받은 Promise를 await.
// 렌더 시 Promise를 throw해 부모 <Suspense>가 fallback 표시.
// Promise resolve되면 본체가 RSC 청크로 스트리밍.
export async function StatsPanelAsync({ promise }: { promise: Promise<StatsPanelProps> }) {
  const props = await promise
  return <StatsPanel {...props} />
}
