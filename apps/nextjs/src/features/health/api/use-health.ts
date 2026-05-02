'use client'

import { useQuery } from '@tanstack/react-query'

import { exampleApi } from '@/lib/api-client/client'

export const healthKeys = {
  all: ['health'] as const,
  status: () => [...healthKeys.all, 'status'] as const,
}

export function useHealth() {
  return useQuery({
    queryKey: healthKeys.status(),
    queryFn: () => exampleApi.request('/health', { method: 'get' }),
  })
}
