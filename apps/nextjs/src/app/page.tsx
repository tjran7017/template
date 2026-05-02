import { Card, CardBody, CardFooter, CardHeader } from '@repo/ui/card'

import { HealthStatus } from '@/features/health/components/health-status'

export default function HomePage() {
  return (
    <main style={{ padding: 'var(--spacing-6)', maxWidth: '720px', margin: '0 auto' }}>
      <Card>
        <CardHeader>
          <h1>fe-monorepo-template — Next.js</h1>
        </CardHeader>
        <CardBody>
          <p>
            Server Component가 기본. 인터랙션이 필요한 부분만 <code>&apos;use client&apos;</code>로
            분리.
          </p>
          <HealthStatus />
        </CardBody>
        <CardFooter>
          <span>@repo/ui · @repo/api-client</span>
        </CardFooter>
      </Card>
    </main>
  )
}
