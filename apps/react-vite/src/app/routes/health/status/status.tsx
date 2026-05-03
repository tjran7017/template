import { Card, CardBody, CardFooter, CardHeader } from '@repo/ui/card'

import { BackLink } from '@/components'
import { useHealth } from '@/features/health/api'
import { HealthStatus } from '@/features/health/components'

function HealthStatusPage() {
  const { data } = useHealth()

  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>Health — useSuspenseQuery</h1>
        </CardHeader>
        <CardBody>
          <p>
            <code>useSuspenseQuery</code>는 로딩 시 Promise를, 에러 시 Error를 throw합니다. 라우트
            본문은 <strong>happy path만</strong> 작성하고, loading/error는 부모 라우트의 Suspense
            fallback / ErrorBoundary가 받습니다.
          </p>
          <HealthStatus tone="ok" label={data.status} />
        </CardBody>
        <CardFooter>
          <BackLink href="/">홈</BackLink>
        </CardFooter>
      </Card>
    </main>
  )
}

export { HealthStatusPage as Component }
