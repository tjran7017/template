import { Card, CardBody, CardFooter, CardHeader } from '@repo/ui/card'

import { BackLink } from '@/components'
import { HealthSection } from '@/features/health/components'

export default function CsrPage() {
  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>CSR — Client Component + React Query</h1>
        </CardHeader>
        <CardBody>
          <p>
            페이지는 Server Component로 레이아웃만 조립. 데이터 페칭이 필요한 부분만{' '}
            <strong>HealthSection이 &apos;use client&apos; + React Query로</strong>.
            캐시·리페치·로딩 상태는 React Query가 자동 관리.
          </p>
          <HealthSection prefix="CSR" />
        </CardBody>
        <CardFooter>
          <BackLink href="/">홈</BackLink>
        </CardFooter>
      </Card>
    </main>
  )
}
