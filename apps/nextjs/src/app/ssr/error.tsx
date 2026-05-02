'use client'

import { useEffect } from 'react'

import { Button } from '@repo/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@repo/ui/card'

import { BackLink } from '@/components'
import { logger } from '@/lib/logger'

// page.tsx 또는 그 하위에서 throw된 에러를 잡는 자동 Error Boundary
// 'use client' 필수 — Next.js 컨벤션
export default function SsrError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('SSR page error', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>오류가 발생했습니다</h1>
        </CardHeader>
        <CardBody>
          <p>페이지 데이터를 가져오지 못했습니다.</p>
          <pre
            style={{
              marginTop: 'var(--spacing-3)',
              padding: 'var(--spacing-3)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-sm)',
              overflowX: 'auto',
            }}
          >
            {error.message}
          </pre>
        </CardBody>
        <CardFooter style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Button onClick={reset}>다시 시도</Button>
          <BackLink href="/">홈</BackLink>
        </CardFooter>
      </Card>
    </main>
  )
}
