import { Suspense } from 'react'

import { Card, CardBody, CardFooter, CardHeader } from '@repo/ui/card'

import { BackLink } from '@/components'
import { getHealth } from '@/features/health/api'
import { HealthStatus } from '@/features/health/components'
import { getStats } from '@/features/stats/api'
import { StatsPanel, StatsPanelAsync } from '@/features/stats/components'

// 매 요청마다 서버에서 fetch — 캐시되지 않음 (SSR 데모)
export const dynamic = 'force-dynamic'

export default async function SsrPage() {
  // 패턴 1) page에서 await — 실패 시 throw → 같은 segment의 error.tsx가 자동 처리
  const health = await getHealth()

  // 패턴 2) page에서 Promise만 시작 (await 없음). Section이 await + Suspense throw
  const statsPromise = getStats()

  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>SSR — await vs streaming 패턴 비교</h1>
        </CardHeader>
        <CardBody>
          <section>
            <h2>1) await — blocking</h2>
            <p>
              페이지 전체가 데이터를 기다린 뒤 렌더. TTFB는 느려도 HTML이 완성된 채로 도착하므로 SEO
              결정 정보·헤더처럼 <strong>없으면 화면이 의미 없는</strong> 데이터에 적합. 에러 발생
              시 <code>error.tsx</code>가 자동 처리.
            </p>
            <HealthStatus state="ok" label={health.status} prefix="SSR await" />
          </section>
          <section style={{ marginTop: 'var(--spacing-6)' }}>
            <h2>2) async Server Component + Suspense — streaming</h2>
            <p>
              하위 async 컴포넌트가 자체적으로 await. 렌더 시 Promise를 throw하면{' '}
              <strong>Suspense 경계 안만 fallback</strong> → resolve 후 RSC 청크로 스트리밍 hydrate.
              느린 쿼리·보조 정보에 적합 (이 패널은 서버에서 1.5초 지연을 시뮬레이션). 실패도 panel
              단위 격리.
            </p>
            <Suspense fallback={<StatsPanel state="loading" />}>
              <StatsPanelAsync promise={statsPromise} />
            </Suspense>
          </section>
        </CardBody>
        <CardFooter>
          <BackLink href="/">홈</BackLink>
        </CardFooter>
      </Card>
    </main>
  )
}
