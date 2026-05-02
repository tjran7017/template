import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { HealthStatus } from './health-status'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

describe('HealthStatus', () => {
  it('성공 응답이면 status를 표시한다', async () => {
    renderWithProviders(<HealthStatus />)

    await waitFor(() => {
      expect(screen.getByText(/API 상태: ok/)).toBeInTheDocument()
    })
  })

  it('실패 응답이면 "연결 실패"를 표시한다', async () => {
    server.use(
      http.get('http://localhost:3000/api/health', () => {
        return HttpResponse.json({ message: 'oops' }, { status: 500 })
      }),
    )

    renderWithProviders(<HealthStatus />)

    await waitFor(() => {
      expect(screen.getByText(/연결 실패/)).toBeInTheDocument()
    })
  })
})
