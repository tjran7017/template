/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXAMPLE_API_URL: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
  readonly VITE_USE_MOCK?: '0' | '1'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
