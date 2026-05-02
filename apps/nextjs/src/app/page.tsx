import Link from 'next/link'

import { Card, CardBody, CardFooter, CardHeader } from '@repo/ui/card'

export default function HomePage() {
  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>fe-monorepo-template — Next.js</h1>
        </CardHeader>
        <CardBody>
          <p>App Router · Server Component 기본 · 데이터 페칭 패턴 두 가지 데모.</p>
          <ul
            style={{
              marginTop: 'var(--spacing-4)',
              paddingLeft: 'var(--spacing-5)',
              display: 'grid',
              gap: 'var(--spacing-2)',
            }}
          >
            <li>
              <Link href="/ssr">/ssr</Link> — 서버에서 직접 fetch (Server Component)
            </li>
            <li>
              <Link href="/csr">/csr</Link> — 브라우저에서 React Query (Client Component)
            </li>
          </ul>
        </CardBody>
        <CardFooter>
          <span>@repo/ui · @repo/api-client</span>
        </CardFooter>
      </Card>
    </main>
  )
}
