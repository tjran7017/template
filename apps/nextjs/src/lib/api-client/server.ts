import 'server-only'

import { createExampleClient, type ServiceConfig } from '@repo/api-client'

import { env } from '@/config/env'

const sharedConfig: Pick<ServiceConfig, 'getAuthToken' | 'onUnauthorized'> = {
  // 서버 컨텍스트에서는 cookies()/headers() 등으로 토큰을 꺼냄
  // 데모는 토큰 없이 호출
  getAuthToken: () => null,
}

export const exampleApi = createExampleClient({
  baseUrl: env.NEXT_PUBLIC_EXAMPLE_API_URL,
  ...sharedConfig,
})
