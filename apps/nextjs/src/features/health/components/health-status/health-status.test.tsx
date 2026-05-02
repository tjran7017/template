import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HealthStatus } from './health-status'

describe('HealthStatus', () => {
  it('ok 상태에서 라벨을 표시한다', () => {
    render(<HealthStatus state="ok" label="ok" />)
    expect(screen.getByText(/API 상태: ok/)).toBeInTheDocument()
  })

  it('fail 상태에서 라벨을 표시한다', () => {
    render(<HealthStatus state="fail" label="연결 실패" />)
    expect(screen.getByText(/API 상태: 연결 실패/)).toBeInTheDocument()
  })

  it('prefix가 주어지면 괄호로 표시한다', () => {
    render(<HealthStatus state="ok" label="ok" prefix="SSR" />)
    expect(screen.getByText(/API 상태 \(SSR\): ok/)).toBeInTheDocument()
  })
})
