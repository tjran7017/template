import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resetOrders, server } from '@/testing/mocks/server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

// /orders/new와 /orders 둘 다 등록 — submit 성공 시 navigate 결과를 검증할 수 있게
function renderRoute(initial = '/orders/new') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        lazy: () => import('@/app/routes/root'),
        children: [
          { path: 'orders', lazy: () => import('@/app/routes/order/list/list') },
          { path: 'orders/new', lazy: () => import('./new') },
        ],
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
  resetOrders()
})

describe('OrderNewPage', () => {
  it('유효한 입력 → 제출하면 /orders로 이동하고 새 주문이 목록에 표시된다', async () => {
    const { user } = renderRoute()

    // 폼 마운트 대기
    const itemInput = await screen.findByLabelText('품목')
    const quantityInput = await screen.findByLabelText('수량')
    const submitBtn = await screen.findByRole('button', { name: /저장/ })

    await user.clear(quantityInput)
    await user.type(itemInput, '아이패드')
    await user.type(quantityInput, '3')
    await user.click(submitBtn)

    // navigate('/orders') 후 목록 페이지가 새 주문을 보여줘야 함
    await waitFor(() => {
      expect(screen.getByText(/아이패드/)).toBeInTheDocument()
    })
  })

  it('빈 품목으로 제출하면 zod 에러를 표시하고 navigate하지 않는다', async () => {
    const { user } = renderRoute()

    const submitBtn = await screen.findByRole('button', { name: /저장/ })
    await user.click(submitBtn)

    expect(await screen.findByText(/품목을 입력하세요/)).toBeInTheDocument()
    // 페이지 헤더가 그대로 (목록 페이지로 이동 X)
    expect(screen.getByRole('heading', { name: '주문 생성' })).toBeInTheDocument()
  })

  it('서버가 5xx 응답이면 에러 메시지를 폼 안에 표시한다', async () => {
    server.use(
      http.post('*/api/orders', () =>
        HttpResponse.json({ message: 'server fail' }, { status: 503 }),
      ),
    )
    const { user } = renderRoute()

    const itemInput = await screen.findByLabelText('품목')
    await user.type(itemInput, '맥미니')
    await user.click(await screen.findByRole('button', { name: /저장/ }))

    await waitFor(() => {
      expect(screen.getByText(/주문 생성 실패/)).toBeInTheDocument()
    })
    // 라우트 ErrorBoundary로는 안 가고 폼 안에 표시 (mutation 에러는 throw 안 함)
    expect(screen.getByRole('heading', { name: '주문 생성' })).toBeInTheDocument()
  })
})
