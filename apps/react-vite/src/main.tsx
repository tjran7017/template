import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/app'
import { env } from '@/config/env'
import { logger } from '@/lib/logger'

import './styles/global.scss'

async function enableMocking() {
  if (env.VITE_USE_MOCK !== '1') return
  try {
    const { worker } = await import('@/testing/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
    logger.info('MSW worker started (VITE_USE_MOCK=1)')
  } catch (error) {
    logger.warn('MSW worker not started — public/mockServiceWorker.js 누락 가능', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root element not found')

void enableMocking().then(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
