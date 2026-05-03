import { Link } from 'react-router'

import { Card, CardBody, CardHeader } from '@repo/ui/card'

function HomePage() {
  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>react-vite — SPA 데모</h1>
        </CardHeader>
        <CardBody>
          <p>
            React Router 7 (data router) + React Query + Zustand + MSW 데모. 라우트는 lazy 로드,
            데이터는 React Query.
          </p>
          <ul style={{ marginTop: 'var(--spacing-4)', paddingLeft: 'var(--spacing-5)' }}>
            <li>
              <Link to="/health">/health — useSuspenseQuery + 라우트 boundary</Link>
            </li>
            <li>
              <Link to="/orders">/orders — useSuspenseQuery 목록</Link>
            </li>
            <li>
              <Link to="/orders/new">/orders/new — react-hook-form + useMutation</Link>
            </li>
          </ul>
        </CardBody>
      </Card>
    </main>
  )
}

// react-router 7 route-level lazy가 Component named export를 픽업
export { HomePage as Component }
