import '@testing-library/jest-dom/vitest'

import { afterAll, afterEach, beforeAll, vi } from 'vitest'

// 'server-only'는 client 번들에서 throw하지만 vitest는 Next의 tree-shake가 없어 항상 실행됨
// barrel(`features/<n>/api`)이 server+client 모듈을 같이 re-export하는 구조라 mock 필수
vi.mock('server-only', () => ({}))

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
