import { http, HttpResponse } from 'msw'

// wildcard로 baseUrl 변화에 영향 안 받음 (로컬/스테이징/실 API URL 모두 매치)
export const handlers = [
  http.get('*/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  http.get('*/api/stats', () => {
    return HttpResponse.json({ uptime: 12345, requestsPerMin: 42 })
  }),
]
