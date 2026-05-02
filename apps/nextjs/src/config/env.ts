import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_EXAMPLE_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
  INTERNAL_API_TOKEN: z.string().min(1).optional(),
})

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_EXAMPLE_API_URL: process.env.NEXT_PUBLIC_EXAMPLE_API_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  INTERNAL_API_TOKEN: process.env.INTERNAL_API_TOKEN,
})

if (!parsed.success) {
  // 빌드/런타임 즉시 실패 — 잘못된 환경에서 앱이 부팅되지 않도록
  throw new Error(`Invalid environment variables:\n${parsed.error.toString()}`)
}

export const env = parsed.data
export type Env = z.infer<typeof envSchema>
