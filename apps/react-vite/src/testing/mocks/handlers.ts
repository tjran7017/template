import { http, HttpResponse } from 'msw'
import { z } from 'zod'

interface Order {
  id: string
  item: string
  quantity: number
  createdAt: string
}

// in-memory 상태 — node(server.ts)와 browser(browser.ts)가 같은 모듈을 import하므로
// 같은 컨텍스트(테스트 1회 실행, dev 세션 1회) 안에서는 GET/POST 결과가 일관됨.
// 단, 모듈 로드 후 누적되므로:
//   - 테스트: resetOrders()를 beforeEach/afterEach에서 호출
//   - dev: 새로고침해도 같은 worker가 살아 있으면 누적 — 의도된 동작
const initialOrders: Order[] = [
  { id: 'ord-1', item: '맥북 프로 16"', quantity: 1, createdAt: '2026-04-29T10:00:00Z' },
  { id: 'ord-2', item: 'HHKB 키보드', quantity: 2, createdAt: '2026-04-30T14:23:00Z' },
]
let orders: Order[] = [...initialOrders]
let nextId = 3

export function resetOrders(): void {
  orders = [...initialOrders]
  nextId = 3
}

const orderInputSchema = z.object({
  item: z.string().min(1),
  quantity: z.number().int().positive(),
})

// wildcard로 baseUrl 변화에 영향 안 받음
export const handlers = [
  http.get('*/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  http.get('*/api/stats', () => {
    return HttpResponse.json({ uptime: 12345, requestsPerMin: 42 })
  }),
  http.get('*/api/orders', () => {
    return HttpResponse.json(orders)
  }),
  http.post('*/api/orders', async ({ request }) => {
    const parsed = orderInputSchema.safeParse(await request.json())
    if (!parsed.success) {
      return HttpResponse.json(
        { code: 'invalid_input', message: parsed.error.message },
        { status: 400 },
      )
    }
    const order: Order = {
      id: `ord-${String(nextId++)}`,
      item: parsed.data.item,
      quantity: parsed.data.quantity,
      createdAt: new Date().toISOString(),
    }
    orders = [...orders, order]
    return HttpResponse.json(order)
  }),
]
