import { Card, CardBody, CardHeader } from '@repo/ui/card'

import { HealthStatus } from '@/features/health/components'
import { StatsPanel } from '@/features/stats/components'

// page.tsx의 await가 끝날 때까지 자동으로 표시되는 Suspense fallback
export default function SsrLoading() {
  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>SSR — await vs streaming 패턴 비교</h1>
        </CardHeader>
        <CardBody>
          <HealthStatus state="loading" label="확인 중…" prefix="SSR await" />
          <StatsPanel state="loading" />
        </CardBody>
      </Card>
    </main>
  )
}
