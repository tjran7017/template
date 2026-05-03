import { useMutation, useQueryClient } from '@tanstack/react-query'

import { orderKeys } from './queries'
import { exampleApi } from '@/lib/api-client'

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { item: string; quantity: number }) =>
      exampleApi.request('/orders', { method: 'post', body }),
    onSuccess: () => {
      // 목록 재조회 트리거 — 새 주문이 즉시 반영
      void queryClient.invalidateQueries({ queryKey: orderKeys.list() })
    },
  })
}
