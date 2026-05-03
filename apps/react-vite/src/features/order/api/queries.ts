import { useSuspenseQuery } from '@tanstack/react-query'

import { exampleApi } from '@/lib/api-client'

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
}

export function useOrders() {
  return useSuspenseQuery({
    queryKey: orderKeys.list(),
    queryFn: () => exampleApi.request('/orders', { method: 'get' }),
  })
}
