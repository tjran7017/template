import 'server-only'

import { exampleApi } from '@/lib/api-client/server'

export const getHealth = () => exampleApi.request('/health', { method: 'get' })
