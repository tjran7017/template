import { Card, CardBody, CardHeader } from '@repo/ui/card'

import { HealthStatus } from '@/features/health/components'

// page는 Server Component지만 HealthSection이 'use client'라 첫 페인트는 빠름.
// 그래도 라우트 전환 직후 잠깐 표시되므로 같은 모양 유지.
export default function CsrLoading() {
  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>CSR — Client Component + React Query</h1>
        </CardHeader>
        <CardBody>
          <HealthStatus state="loading" label="확인 중…" prefix="CSR" />
        </CardBody>
      </Card>
    </main>
  )
}
