import { useQueryClient } from '@tanstack/react-query'
import { Suspense } from 'react'
import { isRouteErrorResponse, Outlet, useNavigate, useRouteError } from 'react-router'

import { Button } from '@repo/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@repo/ui/card'

import { BackLink } from '@/components'
import { logger } from '@/lib/logger'

function RootLayout() {
  return (
    <Suspense
      fallback={
        <main className="page-container">
          <p>로딩 중…</p>
        </main>
      }
    >
      <Outlet />
    </Suspense>
  )
}

function RootErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  logger.error('route error', { error })

  // 사용자에게 노출되는 메시지는 status code 정도까지만.
  // 상세 message는 logger로만 — ApiError가 서버 에러 본문을 포함할 수 있어 leak 방지
  const message = isRouteErrorResponse(error)
    ? `${String(error.status)} ${error.statusText}`
    : '요청을 처리할 수 없습니다.'

  const handleRetry = () => {
    // 캐시된 에러 상태 초기화 → 라우트 재진입 시 useSuspenseQuery가 다시 fetch
    void queryClient.resetQueries()
    void navigate(0)
  }

  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>문제가 발생했어요</h1>
        </CardHeader>
        <CardBody>
          <p>{message}</p>
        </CardBody>
        <CardFooter>
          <Button onClick={handleRetry}>다시 시도</Button>
          <BackLink href="/">홈</BackLink>
        </CardFooter>
      </Card>
    </main>
  )
}

export { RootLayout as Component, RootErrorBoundary as ErrorBoundary }
