import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resetOrders, server } from '@/testing/mocks/server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

function renderRoute(initial = '/orders') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        lazy: () => import('@/app/routes/root'),
        children: [{ path: 'orders', lazy: () => import('./list') }],
      },
    ],
    { initialEntries: [initial] },
  )
  return renderWithProviders(<RouterProvider router={router} />)
}

beforeEach(() => {
  resetOrders()
})

afterEach(() => {
  // 테스트 순서 독립성 — 다른 파일 / 다음 테스트로의 상태 leak 방지
  resetOrders()
})

describe('OrderListPage', () => {
  it('주문 목록을 표시한다', async () => {
    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/맥북 프로/)).toBeInTheDocument()
    })
    expect(screen.getByText(/HHKB 키보드/)).toBeInTheDocument()
  })

  it('5xx 응답이면 라우트 ErrorBoundary가 잡는다', async () => {
    server.use(
      http.get('*/api/orders', () => HttpResponse.json({ message: 'oops' }, { status: 503 })),
    )
    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/문제가 발생했어요/)).toBeInTheDocument()
    })
  })
})
