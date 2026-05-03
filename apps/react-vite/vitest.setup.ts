import '@testing-library/jest-dom/vitest'

import { afterAll, afterEach, beforeAll } from 'vitest'

// env.ts zod 검증을 통과시키기 위해 모듈 import 전에 stub
// (ImportMetaEnv은 readonly로 선언돼 있어 mutable 타입으로 캐스트)
const stubEnv = import.meta.env as Record<string, string | undefined>
stubEnv.VITE_EXAMPLE_API_URL ??= 'http://localhost:5173/api'
stubEnv.VITE_APP_ENV ??= 'development'

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
