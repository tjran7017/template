import { createExampleClient, type ServiceConfig } from '@repo/api-client'

import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth'

const sharedConfig: Pick<ServiceConfig, 'getAuthToken' | 'onUnauthorized'> = {
  getAuthToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => {
    useAuthStore.getState().clear()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },
}

export const exampleApi = createExampleClient({
  baseUrl: env.VITE_EXAMPLE_API_URL,
  ...sharedConfig,
})
