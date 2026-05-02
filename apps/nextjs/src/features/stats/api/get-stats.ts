import 'server-only'

import type { StatsPanelProps } from '../components'
import { exampleApi } from '@/lib/api-client/server'

// 보조 정보라 패널 단위로 실패 처리 — 페이지 전체가 error.tsx로 가지 않게 데이터로 변환
// 반환형을 StatsPanel props 모양으로 맞춰 페이지에서 그대로 spread
export const getStats = async (): Promise<StatsPanelProps> => {
  try {
    const data = await exampleApi.request('/stats', { method: 'get' })
    return { state: 'ok', uptime: data.uptime, requestsPerMin: data.requestsPerMin }
  } catch {
    return { state: 'fail' }
  }
}
