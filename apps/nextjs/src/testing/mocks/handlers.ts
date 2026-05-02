import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('http://localhost:3000/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
]
