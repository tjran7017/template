import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { HealthSection } from './health-section'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, waitFor } from '@/testing/test-utils'

describe('HealthSection', () => {
  it('성공 응답이면 status를 표시한다', async () => {
    renderWithProviders(<HealthSection prefix="CSR" />)

    await waitFor(() => {
      expect(screen.getByText(/API 상태 \(CSR\): ok/)).toBeInTheDocument()
    })
  })

  it('5xx 응답이면 HTTP 상태 코드를 표시한다', async () => {
    server.use(
      http.get('*/api/health', () => HttpResponse.json({ message: 'oops' }, { status: 503 })),
    )

    renderWithProviders(<HealthSection prefix="CSR" />)

    await waitFor(() => {
      expect(screen.getByText(/API 상태 \(CSR\): HTTP 503/)).toBeInTheDocument()
    })
  })

  it('네트워크 실패면 "연결 실패"를 표시한다', async () => {
    server.use(http.get('*/api/health', () => HttpResponse.error()))

    renderWithProviders(<HealthSection prefix="CSR" />)

    await waitFor(() => {
      expect(screen.getByText(/API 상태 \(CSR\): 연결 실패/)).toBeInTheDocument()
    })
  })
})
