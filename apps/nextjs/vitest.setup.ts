import '@testing-library/jest-dom/vitest'

import { afterAll, afterEach, beforeAll } from 'vitest'

// 테스트 환경변수 (env.ts zod 검증을 통과시키기 위해 import 전에 설정)
process.env.NEXT_PUBLIC_EXAMPLE_API_URL ??= 'http://localhost:3000/api'
process.env.NEXT_PUBLIC_APP_ENV ??= 'development'

import { server } from './src/testing/mocks/server'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
