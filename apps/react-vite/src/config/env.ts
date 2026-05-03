import { z } from 'zod'

const envSchema = z.object({
  VITE_EXAMPLE_API_URL: z.string().url(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
  // '1'이면 MSW browser worker로 fetch 가로채기 (백엔드 없이 dev 데모)
  VITE_USE_MOCK: z.enum(['0', '1']).optional(),
})

const parsed = envSchema.safeParse({
  VITE_EXAMPLE_API_URL: import.meta.env.VITE_EXAMPLE_API_URL,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_USE_MOCK: import.meta.env.VITE_USE_MOCK,
})

if (!parsed.success) {
  // 빌드/런타임 즉시 실패 — 잘못된 환경에서 앱이 부팅되지 않도록
  throw new Error(`Invalid environment variables:\n${parsed.error.toString()}`)
}

export const env = parsed.data
export type Env = z.infer<typeof envSchema>
