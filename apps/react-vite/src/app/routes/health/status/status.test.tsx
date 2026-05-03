import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

// 라우트 모듈을 router config에 그대로 연결 — Suspense fallback / ErrorBoundary 인프라까지 통합 검증
function renderRoute() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        lazy: () => import('@/app/routes/root'),
        children: [{ index: true, lazy: () => import('./status') }],
      },
    ],
    { initialEntries: ['/'] },
  )
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('HealthStatusPage (useSuspenseQuery + 라우트 boundary)', () => {
  it('성공 응답이면 status를 표시한다', async () => {
    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/API 상태: ok/)).toBeInTheDocument()
    })
  })

  it('5xx 응답이면 라우트 ErrorBoundary가 잡는다', async () => {
    server.use(
      http.get('*/api/health', () => HttpResponse.json({ message: 'oops' }, { status: 503 })),
    )

    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/문제가 발생했어요/)).toBeInTheDocument()
    })
  })

  it('네트워크 실패면 라우트 ErrorBoundary가 잡는다', async () => {
    server.use(http.get('*/api/health', () => HttpResponse.error()))

    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/문제가 발생했어요/)).toBeInTheDocument()
    })
  })
})
