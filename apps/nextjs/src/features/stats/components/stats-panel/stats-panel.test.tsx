import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatsPanel } from './stats-panel'

describe('StatsPanel', () => {
  it('ok 상태에서 uptime과 RPM을 포맷해 표시한다', () => {
    render(<StatsPanel state="ok" uptime={3661} requestsPerMin={42} />)
    expect(screen.getByText('1h 1m 1s')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('loading 상태에서 placeholder를 표시한다', () => {
    render(<StatsPanel state="loading" />)
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('fail 상태에서도 placeholder를 표시한다', () => {
    render(<StatsPanel state="fail" />)
    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})
