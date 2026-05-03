import { cn } from '@repo/ui/cn'

import styles from './health-status.module.scss'

export type HealthStatusTone = 'ok' | 'fail'

type Props = {
  label: string
  tone?: HealthStatusTone
}

const TONE_TEXT: Record<HealthStatusTone, string> = {
  ok: '정상',
  fail: '실패',
}

export function HealthStatus({ label, tone }: Props) {
  // 색만으로 ok/fail를 구분하지 않도록 보조 텍스트를 시각적으로 함께 노출하고
  // role=status + aria-live로 변경 사항이 스크린리더에 전달되도록 함
  const toneText = tone ? TONE_TEXT[tone] : null
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span
        className={cn(styles.dot, tone === 'ok' && styles.ok, tone === 'fail' && styles.fail)}
        aria-hidden
      />
      <span>
        API 상태: {label}
        {toneText && <span className={styles.toneText}> ({toneText})</span>}
      </span>
    </div>
  )
}
