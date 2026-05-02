import type { Metadata } from 'next'

import { Providers } from './providers'
import './globals.scss'

export const metadata: Metadata = {
  title: 'Next.js App',
  description: 'fe-monorepo-template — Next.js 16 + React 19 baseline',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
