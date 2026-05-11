'use client'

import { isApiError } from '@repo/api-client'

import { useHealth } from '../../api'
import { HealthStatus } from '../health-status'

interface Props {
  prefix?: string
}

export function HealthSection({ prefix }: Props) {
  const { data, isLoading, error } = useHealth()

  if (isLoading) return <HealthStatus state="loading" label="확인 중…" prefix={prefix} />
  if (error) {
    return (
      <HealthStatus
        state="fail"
        label={isApiError(error) ? `HTTP ${error.status}` : '연결 실패'}
        prefix={prefix}
      />
    )
  }
  return <HealthStatus state="ok" label={data?.status ?? 'unknown'} prefix={prefix} />
}
