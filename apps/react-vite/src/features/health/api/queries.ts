import { useSuspenseQuery } from '@tanstack/react-query'

import { exampleApi } from '@/lib/api-client'

export const healthKeys = {
  all: ['health'] as const,
  status: () => [...healthKeys.all, 'status'] as const,
}

// useSuspenseQuery: 로딩은 Suspense fallback으로 throw, 에러는 ErrorBoundary로 throw
// 페이지 본문은 happy path (data가 항상 정의됨)만 렌더
export function useHealth() {
  return useSuspenseQuery({
    queryKey: healthKeys.status(),
    queryFn: () => exampleApi.request('/health', { method: 'get' }),
  })
}
