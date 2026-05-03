import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type PluginOption } from 'vite'

const analyze = process.env.ANALYZE === '1'

export default defineConfig({
  plugins: [
    react(),
    analyze
      ? (visualizer({
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
          open: true,
        }) as PluginOption)
      : null,
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 'hidden' — 번들에 sourceMappingURL 주석 미주입 → 브라우저에서 원본 노출 X.
    // 별도로 업로드한 .map 파일은 Sentry/Datadog 같은 crash-report 도구가 사용
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        // 초기 번들 분리 — vendor / router / data layer / ui kit
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
})
